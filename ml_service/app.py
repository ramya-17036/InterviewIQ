import os
import base64

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

OPENCV_AVAILABLE = False
MEDIAPIPE_AVAILABLE = False
SKLEARN_AVAILABLE = False
TENSORFLOW_AVAILABLE = False

try:
    import cv2
    import numpy as np
    OPENCV_AVAILABLE = True
    print("[SUCCESS] OpenCV loaded.")
except ImportError as exc:
    print(f"[WARNING] OpenCV/NumPy unavailable: {exc}")

try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = hasattr(mp, "solutions") and hasattr(mp.solutions, "face_mesh")
    if MEDIAPIPE_AVAILABLE:
        print("[SUCCESS] MediaPipe Face Mesh loaded.")
    else:
        print("[WARNING] MediaPipe Face Mesh API unavailable; using OpenCV fallback.")
except Exception as exc:
    print(f"[WARNING] MediaPipe unavailable: {exc}")

try:
    import sklearn  # noqa: F401
    SKLEARN_AVAILABLE = True
except ImportError:
    print("[INFO] Scikit-learn is optional for this heuristic service.")

try:
    import tensorflow  # noqa: F401
    TENSORFLOW_AVAILABLE = True
except ImportError:
    print("[INFO] TensorFlow is optional for the current endpoints.")


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "InterviewIQ Machine Learning Engine",
        "modules": {
            "opencv": OPENCV_AVAILABLE,
            "mediapipe": MEDIAPIPE_AVAILABLE,
            "scikit_learn": SKLEARN_AVAILABLE,
            "tensorflow": TENSORFLOW_AVAILABLE,
        },
    })


def decode_frame(image_data):
    if not isinstance(image_data, str) or not image_data.strip():
        raise ValueError("The image field must contain a base64 image.")
    if "," in image_data:
        image_data = image_data.split(",", 1)[1]
    try:
        image_bytes = base64.b64decode(image_data, validate=True)
    except Exception as exc:
        raise ValueError("The image is not valid base64 data.") from exc

    if not OPENCV_AVAILABLE:
        return None, 320, 240

    array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Could not decode the webcam image.")
    height, width = image.shape[:2]
    return image, width, height


def analyze_with_mediapipe(image):
    face_mesh_api = mp.solutions.face_mesh
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    with face_mesh_api.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
    ) as face_mesh:
        results = face_mesh.process(rgb_image)

    if not results.multi_face_landmarks:
        return False, "No Face Detected", 0.0

    landmarks = results.multi_face_landmarks[0].landmark
    if len(landmarks) <= 473:
        return True, "Eye Tracking Unavailable", 0.5

    left_pupil = landmarks[468]
    right_pupil = landmarks[473]
    left_center = (landmarks[33].x + landmarks[133].x) / 2
    right_center = (landmarks[362].x + landmarks[263].x) / 2
    deviation = ((left_pupil.x - left_center) + (right_pupil.x - right_center)) / 2

    if deviation < -0.012:
        return True, "Looking Left", 0.4
    if deviation > 0.012:
        return True, "Looking Right", 0.4
    return True, "Stable", 0.95


def analyze_with_opencv(image):
    """Haar cascades detect faces/eyes but do not reliably measure true gaze."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    eye_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_eye.xml"
    )
    if face_cascade.empty():
        raise RuntimeError("OpenCV face cascade could not be loaded.")

    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
    )
    if len(faces) == 0:
        return False, "No Face Detected", 0.0

    x, y, fw, fh = max(faces, key=lambda face: face[2] * face[3])
    face_gray = gray[y:y + fh, x:x + fw]
    if eye_cascade.empty():
        return True, "Eye Tracking Unavailable", 0.5

    eyes = eye_cascade.detectMultiScale(
        face_gray, scaleFactor=1.1, minNeighbors=4, minSize=(10, 10)
    )
    if len(eyes) >= 2:
        eyes = sorted(eyes, key=lambda eye: eye[0])[:2]
        centers = [eye[0] + eye[2] / 2 for eye in eyes]
        deviation = (sum(centers) / 2 - fw / 2) / max(fw, 1)
        if abs(deviation) > 0.05:
            return True, "Unstable Gaze", 0.4
        return True, "Stable", 0.75
    if len(eyes) == 1:
        return True, "Unstable Gaze", 0.5
    return True, "Eye Tracking Unavailable", 0.5


def calculate_scores(face_detected, eye_contact_ratio, gaze_direction):
    """Heuristic visual indicators on a 0-100 scale, not psychological confidence."""
    if not face_detected:
        return 0.0, 0.0

    eye_score = max(0.0, min(100.0, eye_contact_ratio * 100.0))
    if gaze_direction == "Stable":
        body_score = 80.0
    elif gaze_direction in ("Looking Left", "Looking Right"):
        body_score = 55.0
    elif gaze_direction == "Unstable Gaze":
        body_score = 45.0
    else:
        body_score = 50.0
    return round(body_score, 1), round(eye_score, 1)


@app.route("/api/analyze-frame", methods=["POST"])
def analyze_frame():
    try:
        data = request.get_json(silent=True)
        if not data or "image" not in data:
            return jsonify({"error": "No image payload found."}), 400

        image, width, height = decode_frame(data["image"])
        if image is None:
            return jsonify({
                "faceDetected": False,
                "gazeDirection": "Analysis Unavailable",
                "eyeContactScore": 0.0,
                "confidenceScore": 0.0,
                "dimensions": {"width": width, "height": height},
                "note": "OpenCV is unavailable; frame analysis was not performed.",
            })

        if MEDIAPIPE_AVAILABLE:
            face_detected, gaze, eye_ratio = analyze_with_mediapipe(image)
        else:
            face_detected, gaze, eye_ratio = analyze_with_opencv(image)

        body_score, eye_score = calculate_scores(face_detected, eye_ratio, gaze)
        return jsonify({
            "faceDetected": bool(face_detected),
            "gazeDirection": gaze,
            "eyeContactScore": eye_score,
            "confidenceScore": body_score,
            "dimensions": {"width": width, "height": height},
            "scoreType": "heuristic_visual_indicator",
        })
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        app.logger.exception("Frame analysis failed")
        return jsonify({"error": f"Frame analysis failed: {str(exc)}"}), 500


@app.route("/api/analyze-speech", methods=["POST"])
def analyze_speech():
    try:
        data = request.get_json(silent=True)
        if not data or "text" not in data:
            return jsonify({"error": "No text payload found."}), 400

        text = str(data["text"]).strip()
        try:
            duration = float(data.get("durationSeconds", 10.0))
        except (TypeError, ValueError):
            return jsonify({"error": "durationSeconds must be a number."}), 400

        words = text.split()
        word_count = len(words)
        wpm = (word_count / duration) * 60.0 if duration > 0 else 0.0
        if wpm < 80:
            status, delivery_score = "Too Slow", 6.5
        elif wpm > 170:
            status, delivery_score = "Too Fast", 7.0
        else:
            status, delivery_score = "Optimal", 9.0

        keywords = {
            "java", "python", "experience", "implement", "efficient",
            "design", "oops", "spring", "framework",
        }
        hits = sum(1 for word in words if word.lower().strip(".,!?") in keywords)
        sentiment_score = min(10.0, 5.0 + hits * 0.5)
        return jsonify({
            "wordCount": word_count,
            "wordsPerMinute": round(wpm, 1),
            "deliveryStatus": status,
            "deliveryScore": round(delivery_score, 1),
            "sentimentScore": round(sentiment_score, 1),
        })
    except Exception as exc:
        app.logger.exception("Speech analysis failed")
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"InterviewIQ ML service starting at http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
