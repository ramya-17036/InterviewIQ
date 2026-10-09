
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video,
  Mic,
  Volume2,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Eye,
  Camera,
  Square,
  FileText,
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';
const ML_API = 'http://localhost:5000/api/analyze-frame';

const theme = {
  primary: '#0d9488',
  secondary: '#14b8a6',
  dark: '#173536',
  text: '#526c6c',
  muted: '#648080',
  border: '#d7eae7',
  background: '#f4fbfa',
  white: '#ffffff',
  success: '#0d9488',
  warning: '#b7791f',
  danger: '#c24141',
};

const cardStyle = {
  background: theme.white,
  border: `1px solid ${theme.border}`,
  borderRadius: '18px',
  padding: '24px',
  boxShadow: '0 5px 18px rgba(13, 148, 136, 0.05)',
  minWidth: 0,
};

const buttonStyle = {
  border: 'none',
  borderRadius: '10px',
  padding: '12px 16px',
  fontWeight: 700,
  fontSize: '0.9rem',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  cursor: 'pointer',
  transition: 'background 0.2s ease',
};

export default function InterviewSession() {
  const { id: interviewId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [interview, setInterview] = useState(null);
  const [error, setError] = useState('');

  // Speech and transcription
  const [micActive, setMicActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechVolume, setSpeechVolume] = useState(10);
  const recognitionRef = useRef(null);

  // Webcam
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [videoActive, setVideoActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // Diagnostics
  const [faceConfidence, setFaceConfidence] = useState(0);
  const [eyeContactGaze, setEyeContactGaze] = useState('Waiting');
  const [mlServiceAvailable, setMlServiceAvailable] = useState(true);

  const currentGazeRef = useRef('Waiting');
  const currentConfidenceRef = useRef(0);
  const currentFaceDetectedRef = useRef(false);

  const confidenceSumRef = useRef(0);
  const confidenceCountRef = useRef(0);
  const eyeContactSumRef = useRef(0);
  const eyeContactCountRef = useRef(0);

  const recognitionSupportedRef = useRef(false);
  const isListeningRef = useRef(false);
  const hasSubmittedRef = useRef(false);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('interview_iq_token');

    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  // Load interview questions
  useEffect(() => {
    let cancelled = false;

    const fetchQuestions = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `${API_BASE}/interviews/${interviewId}/feedback`,
          { headers: getHeaders() }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error || data.message || 'Failed to load interview questions.'
          );
        }

        if (cancelled) return;

        const loadedQuestions = Array.isArray(data.questions)
          ? data.questions
          : [];

        setQuestions(loadedQuestions);
        setInterview(data.interview || null);

        if (loadedQuestions.length === 0) {
          setError('No questions were found for this interview session.');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load interview details.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (interviewId) fetchQuestions();
    else {
      setError('Interview ID is missing.');
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [interviewId, getHeaders]);

  // Reset visual-analysis averages for each question
  useEffect(() => {
    confidenceSumRef.current = 0;
    confidenceCountRef.current = 0;
    eyeContactSumRef.current = 0;
    eyeContactCountRef.current = 0;
  }, [currentIdx]);

  // Start webcam and microphone permission request
  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    const startMedia = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(true);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setVideoActive(true);
        }

        setMicActive(
          stream.getAudioTracks().some((track) => track.enabled)
        );
        setCameraError(false);
      } catch (err) {
        console.error('Camera or microphone access failed:', err);

        if (!cancelled) {
          setCameraError(true);
          setVideoActive(false);
          setMicActive(false);
        }
      }
    };

    startMedia();

    return () => {
      cancelled = true;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setVideoActive(false);
      setMicActive(false);
    };
  }, [loading]);

  // Send webcam frames to the Python analysis service.
  // Metrics remain unavailable if the service cannot be reached.
  useEffect(() => {
    if (!videoActive || loading) return;

    let cancelled = false;
    let requestInProgress = false;

    const intervalId = setInterval(async () => {
      const video = videoRef.current;

      if (
        cancelled ||
        requestInProgress ||
        !video ||
        video.paused ||
        video.ended ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.6);

      requestInProgress = true;

      try {
        const response = await fetch(ML_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageData }),
        });

        if (!response.ok) {
          throw new Error('The analysis service returned an error.');
        }

        const result = await response.json();

        if (cancelled) return;

        setMlServiceAvailable(true);

        const detected =
          result.faceDetected !== false &&
          result.gazeDirection !== 'No Face Detected';

        const confidence = detected
          ? Math.max(
              0,
              Math.min(100, Number(result.confidenceScore) || 0)
            )
          : 0;

        const gaze = detected
          ? result.gazeDirection || 'Unknown'
          : 'No Face Detected';

        currentFaceDetectedRef.current = detected;
        currentGazeRef.current = gaze;
        currentConfidenceRef.current = confidence;

        setFaceConfidence(Math.round(confidence));
        setEyeContactGaze(gaze);

        if (detected) {
          confidenceSumRef.current += confidence;
          confidenceCountRef.current += 1;

          const eyeScore = Number(result.eyeContactScore);

          if (Number.isFinite(eyeScore)) {
            eyeContactSumRef.current += eyeScore;
            eyeContactCountRef.current += 1;
          }
        }
      } catch (err) {
        if (!cancelled) {
          setMlServiceAvailable(false);
          currentFaceDetectedRef.current = false;
          currentGazeRef.current = 'Service unavailable';
          currentConfidenceRef.current = 0;
          setFaceConfidence(0);
          setEyeContactGaze('Service unavailable');
        }
      } finally {
        requestInProgress = false;
      }
    }, 1500);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [videoActive, loading]);

  // Draw a simple visual tracking overlay.
  // The canvas is an overlay only; it is not itself a face detector.
  useEffect(() => {
    if (!videoActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;

    const drawLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const detected = currentFaceDetectedRef.current;
      const gaze = currentGazeRef.current;
      const stable = gaze.toLowerCase() === 'stable';

      const boxColor = !detected
        ? '#c24141'
        : stable
          ? '#0d9488'
          : '#d97706';

      const x = 100;
      const y = 35;
      const width = 120;
      const height = 165;

      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      const corner = 12;
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.moveTo(x, y + corner);
      ctx.lineTo(x, y);
      ctx.lineTo(x + corner, y);

      ctx.moveTo(x + width - corner, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + corner);

      ctx.moveTo(x, y + height - corner);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x + corner, y + height);

      ctx.moveTo(x + width - corner, y + height);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x + width, y + height - corner);
      ctx.stroke();

      ctx.fillStyle = boxColor;
      ctx.font = 'bold 11px system-ui';

      let label = 'WAITING FOR FACE';

      if (!detected) {
        label = mlServiceAvailable
          ? 'NO FACE DETECTED'
          : 'ANALYSIS UNAVAILABLE';
      } else if (stable) {
        label = 'GAZE: STABLE';
      } else {
        label = `GAZE: ${gaze.toUpperCase()}`;
      }

      ctx.fillText(label.slice(0, 31), 10, 20);

      animationId = requestAnimationFrame(drawLoop);
    };

    drawLoop();

    return () => cancelAnimationFrame(animationId);
  }, [videoActive, mlServiceAvailable]);

  // Speak the current question
  const speakQuestion = useCallback((text) => {
    if (!text || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    const voice =
      voices.find(
        (item) =>
          item.lang.startsWith('en') &&
          item.name.toLowerCase().includes('google')
      ) ||
      voices.find((item) => item.lang.startsWith('en'));

    if (voice) utterance.voice = voice;

    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    const question = questions[currentIdx];

    if (question?.questionText) {
      speakQuestion(question.questionText);
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [questions, currentIdx, speakQuestion]);

  // Set up browser speech recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      recognitionSupportedRef.current = false;
      return;
    }

    recognitionSupportedRef.current = true;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const spokenText = result[0]?.transcript || '';

        if (result.isFinal) finalText += spokenText;
        else interimText += spokenText;
      }

      if (finalText) {
        setTranscript((previous) =>
          `${previous}${previous && !previous.endsWith(' ') ? ' ' : ''}${finalText}`.trimStart()
        );
      }

      if (interimText) {
        setSpeechVolume(25 + Math.floor(Math.random() * 45));
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);

      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(
          'Speech recognition encountered a problem. You can still type your answer.'
        );
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
      setSpeechVolume(10);
    };

    recognitionRef.current = recognition;

    return () => {
      isListeningRef.current = false;

      try {
        recognition.stop();
      } catch {
        // Recognition may already be stopped.
      }

      recognitionRef.current = null;
    };
  }, []);

  const handleStartListening = () => {
    const recognition = recognitionRef.current;

    if (!recognition || !recognitionSupportedRef.current) {
      setError(
        'Speech recognition is not supported in this browser. Please type your answer instead.'
      );
      return;
    }

    if (isListeningRef.current) return;

    setError('');
    isListeningRef.current = true;
    setIsListening(true);

    try {
      recognition.start();
    } catch (err) {
      isListeningRef.current = false;
      setIsListening(false);
      setError('Could not start speech recognition. Please try again.');
    }
  };

  const handleStopListening = () => {
    isListeningRef.current = false;
    setIsListening(false);
    setSpeechVolume(10);

    try {
      recognitionRef.current?.stop();
    } catch {
      // Recognition may already be stopped.
    }
  };

  // Stop browser media and speech when leaving the page.
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore cleanup errors.
      }

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleCompleteInterview = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/interviews/${interviewId}/complete`,
        {
          method: 'POST',
          headers: getHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || data.message || 'Failed to complete interview.'
        );
      }

      navigate(`/feedback/${interviewId}`);
    } catch (err) {
      hasSubmittedRef.current = false;
      setError(err.message || 'Unable to complete the interview.');
    }
  };

  const handleSubmitAnswer = async () => {
    const activeQuestion = questions[currentIdx];

    if (!activeQuestion) {
      setError('There is no active question to submit.');
      return;
    }

    if (!transcript.trim()) {
      setError('Please type or record an answer before continuing.');
      return;
    }

    if (hasSubmittedRef.current || submitting) return;

    hasSubmittedRef.current = true;
    setSubmitting(true);
    setError('');
    handleStopListening();

    const avgConfidence =
      confidenceCountRef.current > 0
        ? confidenceSumRef.current / confidenceCountRef.current
        : 0;

    const avgEyeContact =
      eyeContactCountRef.current > 0
        ? eyeContactSumRef.current / eyeContactCountRef.current
        : 0;

    try {
      const response = await fetch(
        `${API_BASE}/interviews/${interviewId}/submit-answer`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            questionId: activeQuestion.id,
            answer: transcript.trim(),
            confidence: Math.round(avgConfidence * 10) / 10,
            eyeContact: Math.round(avgEyeContact * 10) / 10,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || data.message || 'Failed to submit your answer.'
        );
      }

      setTranscript('');

      if (currentIdx < questions.length - 1) {
        setCurrentIdx((previous) => previous + 1);
        hasSubmittedRef.current = false;
      } else {
        await handleCompleteInterview();
      }
    } catch (err) {
      hasSubmittedRef.current = false;
      setError(err.message || 'Unable to submit your answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeQuestion = questions[currentIdx];

  if (loading) {
    return (
      <div
        style={{
          minHeight: '55vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          color: theme.text,
        }}
      >
        <Loader2
          size={38}
          color={theme.primary}
          style={{ animation: 'spin 1.2s linear infinite' }}
        />
        <h2 style={{ color: theme.dark, fontSize: '1.1rem', margin: 0 }}>
          Preparing your interview
        </h2>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          Loading your personalized interview questions...
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', margin: '20px auto' }}>
        <AlertTriangle
          size={36}
          color={theme.warning}
          style={{ marginBottom: '12px' }}
        />
        <h2 style={{ color: theme.dark, margin: '0 0 10px' }}>
          Interview unavailable
        </h2>
        <p style={{ color: theme.text, lineHeight: 1.6 }}>
          {error || 'No questions are available for this session.'}
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            ...buttonStyle,
            background: theme.primary,
            color: theme.white,
          }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const confidenceColor =
    faceConfidence >= 80
      ? theme.success
      : faceConfidence >= 50
        ? theme.warning
        : theme.danger;

  const gazeStable = eyeContactGaze.toLowerCase() === 'stable';

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        color: theme.dark,
        width: '100%',
      }}
    >
      {/* Session heading */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 12px',
              borderRadius: '30px',
              background: '#e2f6f2',
              color: theme.primary,
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '10px',
            }}
          >
            <Sparkles size={15} />
            AI MOCK INTERVIEW
          </div>

          <h1
            style={{
              margin: 0,
              color: theme.dark,
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: 800,
            }}
          >
            Interview Session
          </h1>

          <p
            style={{
              color: theme.text,
              margin: '8px 0 0',
              fontSize: '0.9rem',
            }}
          >
            Speak naturally, or type your answer to each question.
          </p>
        </div>

        <div
          style={{
            padding: '12px 16px',
            background: theme.white,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            minWidth: '145px',
          }}
        >
          <div style={{ fontSize: '0.77rem', color: theme.muted }}>
            QUESTION PROGRESS
          </div>
          <div
            style={{
              color: theme.primary,
              fontWeight: 800,
              fontSize: '1.15rem',
              marginTop: '4px',
            }}
          >
            {currentIdx + 1} / {questions.length}
          </div>
          <div
            style={{
              height: '5px',
              background: '#e2f3f0',
              borderRadius: '10px',
              overflow: 'hidden',
              marginTop: '10px',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${((currentIdx + 1) / questions.length) * 100}%`,
                background: theme.primary,
                transition: 'width 0.25s ease',
              }}
            />
          </div>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            padding: '13px 15px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            borderRadius: '11px',
            border: '1px solid #f3caca',
            background: '#fff3f3',
            color: '#b42323',
            fontSize: '0.88rem',
            lineHeight: 1.6,
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Interview and diagnostics columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: '22px',
          alignItems: 'start',
        }}
      >
        {/* Interview question and answer */}
        <section
          style={{
            ...cardStyle,
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                padding: '7px 12px',
                borderRadius: '30px',
                background: '#e2f6f2',
                color: theme.primary,
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              Question {currentIdx + 1}
            </span>

            <span style={{ fontSize: '0.82rem', color: theme.text }}>
              Category: {interview?.type || 'Interview'}
            </span>
          </div>

          {/* AI interviewer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '15px',
                background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.15rem',
                flexShrink: 0,
              }}
            >
              AI
            </div>

            <div>
              <div
                style={{
                  color: theme.dark,
                  fontWeight: 750,
                  fontSize: '0.98rem',
                }}
              >
                Dr. Arthur
              </div>
              <div
                style={{
                  color: theme.text,
                  fontSize: '0.82rem',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: theme.primary,
                  }}
                />
                AI Interview Coach
              </div>
            </div>
          </div>

          {/* Current question */}
          <div
            style={{
              padding: '22px',
              borderRadius: '14px',
              border: '1px solid #cce9e4',
              background: '#f4fbfa',
            }}
          >
            <div
              style={{
                fontSize: '0.77rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: theme.primary,
                marginBottom: '12px',
              }}
            >
              YOUR QUESTION
            </div>

            <div
              style={{
                color: theme.dark,
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                fontWeight: 600,
                lineHeight: 1.75,
                overflowWrap: 'anywhere',
              }}
            >
              {activeQuestion?.questionText}
            </div>

            <button
              type="button"
              onClick={() => speakQuestion(activeQuestion?.questionText)}
              title="Read question aloud"
              style={{
                ...buttonStyle,
                marginTop: '17px',
                padding: '9px 12px',
                background: '#ffffff',
                color: theme.primary,
                border: `1px solid ${theme.border}`,
                fontSize: '0.82rem',
              }}
            >
              <Volume2 size={17} />
              Listen to Question
            </button>
          </div>

          {/* Answer editor */}
          <div>
            <label
              htmlFor="interview-answer"
              style={{
                display: 'block',
                fontSize: '0.83rem',
                fontWeight: 700,
                color: theme.dark,
                marginBottom: '10px',
              }}
            >
              Your Answer
            </label>

            <textarea
              id="interview-answer"
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="Type your answer here, or use the microphone to transcribe your response..."
              rows={8}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                resize: 'vertical',
                minHeight: '170px',
                padding: '15px',
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                background: '#ffffff',
                color: theme.dark,
                fontFamily: 'inherit',
                fontSize: '0.93rem',
                lineHeight: 1.75,
                outlineColor: theme.primary,
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '0.77rem',
                color: theme.muted,
                marginTop: '8px',
              }}
            >
              <span>Speak or type your response.</span>
              <span>{transcript.trim() ? transcript.trim().split(/\s+/).length : 0} words</span>
            </div>
          </div>

          {/* Answer actions */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
              gap: '12px',
            }}
          >
            {isListening ? (
              <button
                type="button"
                onClick={handleStopListening}
                style={{
                  ...buttonStyle,
                  background: '#fff0f0',
                  color: '#b42323',
                  border: '1px solid #f3caca',
                }}
              >
                <Square size={16} />
                Stop Recording
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartListening}
                style={{
                  ...buttonStyle,
                  background: '#e2f6f2',
                  color: theme.primary,
                  border: '1px solid #cce9e4',
                }}
              >
                <Mic size={18} />
                Record Answer
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={submitting || !transcript.trim()}
              style={{
                ...buttonStyle,
                background:
                  submitting || !transcript.trim()
                    ? '#a8cfca'
                    : theme.primary,
                color: '#ffffff',
                cursor:
                  submitting || !transcript.trim()
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {submitting ? (
                <>
                  <Loader2
                    size={18}
                    style={{ animation: 'spin 1.2s linear infinite' }}
                  />
                  Submitting...
                </>
              ) : currentIdx === questions.length - 1 ? (
                <>
                  Finish Interview
                  <CheckCircle2 size={18} />
                </>
              ) : (
                <>
                  Next Question
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {isListening && (
            <div
              role="status"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '10px',
                background: '#edfbf6',
                color: theme.primary,
                fontSize: '0.85rem',
              }}
            >
              <Mic size={17} />
              Listening... Speak clearly and select Stop Recording when done.
            </div>
          )}
        </section>

        {/* Webcam and diagnostics */}
        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
            minWidth: 0,
          }}
        >
          {/* Webcam card */}
          <section style={{ ...cardStyle, padding: '18px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '15px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  fontWeight: 750,
                  color: theme.dark,
                }}
              >
                <Video size={19} color={theme.primary} />
                Webcam Preview
              </div>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 9px',
                  borderRadius: '20px',
                  background: videoActive ? '#edfbf6' : '#fff3f3',
                  color: videoActive ? theme.primary : '#b42323',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: videoActive ? theme.primary : '#c24141',
                  }}
                />
                {videoActive ? 'Camera On' : 'Camera Off'}
              </span>
            </div>

            <div
              style={{
                width: '100%',
                aspectRatio: '4 / 3',
                background: '#eaf3f2',
                border: `1px solid ${theme.border}`,
                borderRadius: '13px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                  display: cameraError ? 'none' : 'block',
                }}
              />

              {!cameraError && (
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={240}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {cameraError && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '22px',
                    color: theme.text,
                  }}
                >
                  <Camera
                    size={35}
                    color={theme.primary}
                    style={{ marginBottom: '12px' }}
                  />
                  <strong style={{ color: theme.dark, marginBottom: '7px' }}>
                    Camera Unavailable
                  </strong>
                  <span style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
                    Allow camera access in your browser settings. You can
                    continue by typing your answers.
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                color: theme.muted,
                fontSize: '0.78rem',
                lineHeight: 1.6,
                marginTop: '12px',
              }}
            >
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
              Camera diagnostics require permission and an available Python
              analysis service.
            </div>
          </section>

          {/* Diagnostic metrics */}
          <section style={cardStyle}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                marginBottom: '20px',
              }}
            >
              <Eye size={20} color={theme.primary} />
              <h2
                style={{
                  fontSize: '1rem',
                  color: theme.dark,
                  margin: 0,
                }}
              >
                Interview Diagnostics
              </h2>
            </div>

            {/* Confidence */}
            <div style={{ marginBottom: '23px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.85rem',
                  marginBottom: '9px',
                }}
              >
                <span style={{ color: theme.text }}>
                  Body Language Confidence
                </span>
                <strong style={{ color: confidenceColor }}>
                  {mlServiceAvailable ? `${faceConfidence}%` : 'Unavailable'}
                </strong>
              </div>

              <div
                style={{
                  height: '7px',
                  background: '#e4f1ef',
                  borderRadius: '20px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${mlServiceAvailable ? faceConfidence : 0}%`,
                    background: confidenceColor,
                    borderRadius: '20px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Eye contact */}
            <div style={{ marginBottom: '23px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.85rem',
                  marginBottom: '9px',
                }}
              >
                <span style={{ color: theme.text }}>Eye Contact Tracking</span>
                <strong
                  style={{
                    color: gazeStable ? theme.primary : theme.warning,
                    textAlign: 'right',
                  }}
                >
                  {eyeContactGaze}
                </strong>
              </div>

              <div
                style={{
                  height: '7px',
                  background: '#e4f1ef',
                  borderRadius: '20px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: gazeStable ? '100%' : '25%',
                    background: gazeStable ? theme.primary : theme.warning,
                    borderRadius: '20px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Microphone status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '13px',
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                background: '#f8fcfb',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  background: isListening ? '#d7f4ed' : '#e9f4f2',
                  color: theme.primary,
                  flexShrink: 0,
                }}
              >
                <Mic size={20} />
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: theme.dark,
                    fontSize: '0.86rem',
                  }}
                >
                  Microphone
                </div>
                <div
                  style={{
                    color: theme.text,
                    fontSize: '0.78rem',
                    marginTop: '4px',
                  }}
                >
                  {isListening
                    ? 'Transcribing your answer'
                    : micActive
                      ? 'Permission granted'
                      : 'Not active'}
                </div>
              </div>

              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isListening
                    ? theme.primary
                    : micActive
                      ? '#7ebbb0'
                      : '#c5d5d2',
                }}
              />
            </div>

            {/* Voice activity indicator */}
            <div style={{ marginTop: '22px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.84rem',
                    color: theme.text,
                  }}
                >
                  Voice Activity
                </span>
                <span
                  style={{
                    fontSize: '0.76rem',
                    color: theme.muted,
                  }}
                >
                  {isListening ? 'Listening' : 'Idle'}
                </span>
              </div>

              <div
                aria-label="Voice activity indicator"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '4px',
                  height: '34px',
                }}
              >
                {Array.from({ length: 25 }, (_, index) => {
                  const height = isListening
                    ? 5 + ((index * 7 + speechVolume) % Math.max(speechVolume, 12))
                    : 4 + (index % 3);

                  return (
                    <div
                      key={index}
                      style={{
                        flex: 1,
                        height: `${Math.min(height, 32)}px`,
                        borderRadius: '4px',
                        background: isListening
                          ? theme.secondary
                          : '#cfe7e2',
                        transition: 'height 0.15s ease',
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {!mlServiceAvailable && (
              <div
                style={{
                  marginTop: '18px',
                  padding: '12px',
                  background: '#fff7e6',
                  color: '#8a5a13',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  lineHeight: 1.6,
                }}
              >
                The Python analysis service is not responding. Visual
                diagnostic metrics are unavailable; you can still complete
                your interview.
              </div>
            )}
          </section>

          {/* Helpful reminder */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '16px',
              border: `1px solid ${theme.border}`,
              borderRadius: '14px',
              background: '#edfbf6',
              color: theme.text,
              fontSize: '0.83rem',
              lineHeight: 1.65,
            }}
          >
            <FileText
              size={18}
              color={theme.primary}
              style={{ flexShrink: 0, marginTop: '2px' }}
            />
            <span>
              <strong style={{ color: theme.dark }}>Interview tip:</strong>{' '}
              Structure your answer clearly, give a relevant example, and
              explain what you learned.
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
