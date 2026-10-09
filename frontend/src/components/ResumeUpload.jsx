
import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileCheck2,
  BriefcaseBusiness,
  RefreshCw,
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const initialAnalysis = {
  skills: [],
  experience: 'Entry Level',
  suggestedRole: 'Full Stack Developer',
  atsScore: 0,
  feedback: [],
};

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
    color: '#173536',
    width: '100%',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #d7eae7',
    borderRadius: '18px',
    padding: '24px',
    boxShadow: '0 5px 18px rgba(13, 148, 136, 0.05)',
    minWidth: 0,
  },
  heading: {
    color: '#173536',
    fontSize: '1.2rem',
    fontWeight: 700,
    margin: '0 0 18px',
  },
  sectionLabel: {
    color: '#526c6c',
    fontSize: '0.82rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    margin: '0 0 10px',
  },
};

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [latestResume, setLatestResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('interview_iq_token');

    return token
      ? { Authorization: `Bearer ${token}` }
      : {};
  };

  const fetchLatestResume = async () => {
    try {
      const response = await fetch(`${API_BASE}/resumes/latest`, {
        headers: getHeaders(),
      });

      if (response.status === 204 || response.status === 404) {
        setLatestResume(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Unable to load your latest resume.');
      }

      const data = await response.json();
      setLatestResume(data);
    } catch (err) {
      console.error('Error fetching latest resume:', err);
      setError((current) => current || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestResume();
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setSuccess(false);
    setError('');

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const extension = selectedFile.name
      .split('.')
      .pop()
      .toLowerCase();

    if (!['pdf', 'txt'].includes(extension)) {
      setFile(null);
      setError('Please select a PDF or TXT file.');
      event.target.value = '';
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError('The file size must be 10 MB or less.');
      event.target.value = '';
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError('Please select a resume to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/resumes/upload`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || data.message || 'Failed to upload your resume.'
        );
      }

      setSuccess(true);
      setFile(null);

      const input = document.getElementById('resume-file');
      if (input) input.value = '';

      await fetchLatestResume();
    } catch (err) {
      setError(
        err.message ||
          'Unable to upload your resume. Please check your connection and try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  let parsedAnalysis = { ...initialAnalysis };

  if (latestResume?.analysisResults) {
    try {
      const result =
        typeof latestResume.analysisResults === 'string'
          ? JSON.parse(latestResume.analysisResults)
          : latestResume.analysisResults;

      parsedAnalysis = {
        ...initialAnalysis,
        ...(result && typeof result === 'object' ? result : {}),
      };
    } catch (err) {
      console.error('Failed to parse resume analysis:', err);
    }
  }

  const rawScore = Number(parsedAnalysis.atsScore) || 0;
  const scoreVal = Math.max(0, Math.min(100, rawScore));

  const getAtsDetails = (score) => {
    if (score >= 80) {
      return {
        color: '#0d9488',
        text: 'Excellent Match',
        bg: '#e6f7f4',
      };
    }

    if (score >= 60) {
      return {
        color: '#b7791f',
        text: 'Good Potential',
        bg: '#fff7e6',
      };
    }

    return {
      color: '#c24141',
      text: 'Needs Optimization',
      bg: '#fff0f0',
    };
  };

  const atsDetails = getAtsDetails(scoreVal);
  const radius = 38;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (scoreVal / 100) * circumference;

  const skills = Array.isArray(parsedAnalysis.skills)
    ? parsedAnalysis.skills
    : [];

  const feedback = Array.isArray(parsedAnalysis.feedback)
    ? parsedAnalysis.feedback
    : [];

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Date unavailable';

    const date = new Date(dateValue);

    return Number.isNaN(date.getTime())
      ? 'Date unavailable'
      : date.toLocaleDateString();
  };

  return (
    <div style={styles.page} className="animate-fade-in">
      {/* Page heading */}
      <div
        style={{
          textAlign: 'center',
          padding: '12px 10px 8px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#e2f6f2',
            color: '#0d9488',
            padding: '8px 14px',
            borderRadius: '30px',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          <Sparkles size={16} />
          AI-POWERED RESUME ANALYSIS
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.7rem, 4vw, 2.35rem)',
            color: '#173536',
            margin: '0 0 12px',
            fontWeight: 800,
          }}
        >
          Resume Analysis
        </h1>

        <p
          style={{
            color: '#526c6c',
            maxWidth: '650px',
            margin: '0 auto',
            lineHeight: 1.7,
            fontSize: '0.96rem',
          }}
        >
          Upload your resume to analyze your skills, experience, and ATS
          compatibility. Use the insights to prepare for more personalized
          interview questions.
        </p>
      </div>

      {/* Main two-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Upload card */}
        <section style={styles.card}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '22px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#e2f6f2',
                color: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Upload size={22} />
            </div>

            <div>
              <h2 style={{ ...styles.heading, marginBottom: '4px' }}>
                Upload Resume
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  color: '#526c6c',
                }}
              >
                Add your latest resume for analysis
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '13px',
                borderRadius: '10px',
                border: '1px solid #f3caca',
                background: '#fff3f3',
                color: '#b42323',
                fontSize: '0.88rem',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              role="status"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '13px',
                borderRadius: '10px',
                border: '1px solid #b8e7d9',
                background: '#edfbf6',
                color: '#087f67',
                fontSize: '0.88rem',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>Resume uploaded and analyzed successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="resume-file"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '38px 18px',
                border: '2px dashed #9edbd2',
                borderRadius: '14px',
                background: '#f4fbfa',
                cursor: 'pointer',
                gap: '12px',
                transition: 'background 0.2s, border-color 0.2s',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#dff5f0',
                  color: '#0d9488',
                }}
              >
                <Upload size={27} />
              </div>

              <div>
                <div
                  style={{
                    fontWeight: 700,
                    color: '#173536',
                    marginBottom: '6px',
                  }}
                >
                  Click to choose a resume
                </div>
                <div style={{ color: '#526c6c', fontSize: '0.87rem' }}>
                  Select a file from your computer
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.78rem',
                  color: '#648080',
                  background: '#ffffff',
                  border: '1px solid #d7eae7',
                  borderRadius: '20px',
                  padding: '6px 12px',
                }}
              >
                PDF or TXT · Maximum 10 MB
              </span>

              <input
                id="resume-file"
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  padding: 0,
                  margin: '-1px',
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                  border: 0,
                }}
              />
            </label>

            {file && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#ffffff',
                  border: '1px solid #cce9e4',
                  padding: '13px',
                  borderRadius: '12px',
                  marginTop: '16px',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    background: '#e2f6f2',
                    color: '#0d9488',
                    borderRadius: '9px',
                    padding: '9px',
                    display: 'flex',
                    flexShrink: 0,
                  }}
                >
                  <FileText size={20} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: '#173536',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={file.name}
                  >
                    {file.name}
                  </div>

                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: '#648080',
                      marginTop: '4px',
                    }}
                  >
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                <CheckCircle2
                  size={19}
                  color="#0d9488"
                  style={{ flexShrink: 0 }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !file}
              style={{
                width: '100%',
                marginTop: '18px',
                padding: '14px 18px',
                borderRadius: '11px',
                border: 'none',
                background:
                  uploading || !file ? '#a8cfca' : '#0d9488',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: uploading || !file ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '9px',
                transition: 'background 0.2s',
              }}
            >
              {uploading ? (
                <>
                  <RefreshCw size={18} />
                  Analyzing Resume...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Analyze Resume
                </>
              )}
            </button>

            <p
              style={{
                fontSize: '0.78rem',
                lineHeight: 1.6,
                color: '#648080',
                textAlign: 'center',
                margin: '14px 0 0',
              }}
            >
              Your resume is processed by the InterviewIQ backend to generate
              your analysis.
            </p>
          </form>
        </section>

        {/* Active resume profile */}
        <section style={styles.card}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '22px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#e2f6f2',
                color: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={22} />
            </div>

            <div>
              <h2 style={{ ...styles.heading, marginBottom: '4px' }}>
                Active Resume Profile
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  color: '#526c6c',
                }}
              >
                Your latest resume insights
              </p>
            </div>
          </div>

          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '45px 15px',
                color: '#526c6c',
              }}
            >
              <RefreshCw
                size={25}
                color="#0d9488"
                style={{ marginBottom: '12px' }}
              />
              <p style={{ margin: 0 }}>Loading resume data...</p>
            </div>
          ) : !latestResume ? (
            <div
              style={{
                background: '#f4fbfa',
                border: '1px dashed #b8ddd7',
                borderRadius: '14px',
                padding: '38px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#e2f6f2',
                  color: '#0d9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <FileText size={29} />
              </div>

              <h3
                style={{
                  color: '#173536',
                  fontSize: '1rem',
                  margin: '0 0 8px',
                }}
              >
                No Active Resume
              </h3>

              <p
                style={{
                  color: '#526c6c',
                  fontSize: '0.87rem',
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                Upload your resume to view your ATS score, extracted skills,
                suggested role, and optimization feedback here.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {/* File information */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '15px',
                  borderRadius: '12px',
                  border: '1px solid #d7eae7',
                  background: '#f8fcfb',
                }}
              >
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background: '#e2f6f2',
                    color: '#0d9488',
                    display: 'flex',
                    flexShrink: 0,
                  }}
                >
                  <FileCheck2 size={22} />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.93rem',
                      fontWeight: 700,
                      color: '#173536',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {latestResume.fileName || 'Uploaded Resume'}
                  </div>

                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: '#648080',
                      marginTop: '5px',
                    }}
                  >
                    Uploaded on {formatDate(latestResume.uploadedAt)}
                  </div>
                </div>
              </div>

              {/* ATS score */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  flexWrap: 'wrap',
                  padding: '18px',
                  border: '1px solid #cce9e4',
                  borderRadius: '14px',
                  background: '#f4fbfa',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100px',
                    height: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="100"
                    height="100"
                    viewBox="0 0 100 100"
                    style={{ transform: 'rotate(-90deg)' }}
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="#dcefeb"
                      strokeWidth={strokeWidth}
                    />

                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke={atsDetails.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>

                  <div
                    style={{
                      position: 'absolute',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        color: '#173536',
                      }}
                    >
                      {scoreVal}%
                    </span>

                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#648080',
                      }}
                    >
                      ATS SCORE
                    </span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: '150px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '7px 11px',
                      borderRadius: '20px',
                      background: atsDetails.bg,
                      color: atsDetails.color,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      marginBottom: '12px',
                    }}
                  >
                    <CheckCircle2 size={15} />
                    {atsDetails.text}
                  </div>

                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: '#526c6c',
                      lineHeight: 1.7,
                    }}
                  >
                    Suggested Role
                    <div
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#173536',
                        marginTop: '2px',
                      }}
                    >
                      {parsedAnalysis.suggestedRole || 'Not available'}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: '#526c6c',
                      marginTop: '9px',
                    }}
                  >
                    Experience:{' '}
                    <strong style={{ color: '#173536' }}>
                      {parsedAnalysis.experience || 'Entry Level'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Extracted skills */}
              <div>
                <h3 style={styles.sectionLabel}>Skills Extracted</h3>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  {skills.length > 0 ? (
                    skills.map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        style={{
                          background: '#e2f6f2',
                          color: '#087f75',
                          border: '1px solid #c1e8df',
                          padding: '7px 11px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: '#648080',
                      }}
                    >
                      No skills were extracted.
                    </span>
                  )}
                </div>
              </div>

              {/* ATS optimization feedback */}
              <div>
                <h3 style={styles.sectionLabel}>
                  ATS Optimization Checklist
                </h3>

                {feedback.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      padding: '15px',
                      background: '#f8fcfb',
                      border: '1px solid #d7eae7',
                      borderRadius: '12px',
                    }}
                  >
                    {feedback.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          fontSize: '0.85rem',
                          color: '#526c6c',
                          lineHeight: 1.65,
                        }}
                      >
                        <CheckCircle2
                          size={17}
                          color="#0d9488"
                          style={{
                            marginTop: '2px',
                            flexShrink: 0,
                          }}
                        />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: '#648080',
                      margin: 0,
                    }}
                  >
                    No optimization feedback is available.
                  </p>
                )}
              </div>

              {/* Extracted text */}
              <div>
                <h3 style={styles.sectionLabel}>
                  Extracted Content Summary
                </h3>

                <div
                  style={{
                    fontSize: '0.85rem',
                    color: '#526c6c',
                    background: '#f8fcfb',
                    border: '1px solid #d7eae7',
                    padding: '14px',
                    borderRadius: '12px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    lineHeight: 1.75,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {latestResume.extractedText ||
                    'No extracted resume text is available.'}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '9px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#edfbf6',
                  color: '#087f67',
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                }}
              >
                <BriefcaseBusiness
                  size={17}
                  style={{ flexShrink: 0, marginTop: '2px' }}
                />
                Your resume insights can help personalize your InterviewIQ
                preparation.
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
