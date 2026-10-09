
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Calendar,
  FileText,
  ChevronRight,
  Award,
  Brain,
  BarChart2,
  Video,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE = 'http://localhost:8080/api';

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviewType, setInterviewType] = useState('TECHNICAL');
  const [subject, setSubject] = useState('Java Spring Boot');
  const [latestResume, setLatestResume] = useState(null);
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();

  let currentUser = null;

  try {
    const savedUser = localStorage.getItem('interview_iq_user');
    currentUser = savedUser ? JSON.parse(savedUser) : null;
  } catch {
    currentUser = null;
  }

  const targetCompany = currentUser?.targetCompany || 'General';
  const targetRole = currentUser?.targetRole || '';

  useEffect(() => {
    if (targetRole) {
      setSubject(targetRole);
    }
  }, [targetRole]);

  const getHeaders = () => {
    const token = localStorage.getItem('interview_iq_token');

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');

        const [historyRes, resumeRes] = await Promise.all([
          fetch(`${API_BASE}/interviews/history`, {
            headers: getHeaders()
          }),
          fetch(`${API_BASE}/resumes/latest`, {
            headers: getHeaders()
          })
        ]);

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(Array.isArray(historyData) ? historyData : []);
        } else {
          setError('Unable to load interview history. Please refresh the page.');
        }

        if (resumeRes.ok && resumeRes.status !== 204) {
          const resumeData = await resumeRes.json();
          setLatestResume(resumeData);
        } else {
          setLatestResume(null);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(
          'Unable to connect to the server. Check that your backend is running.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStartInterview = async (e) => {
    e.preventDefault();

    if (!subject.trim()) {
      alert('Please enter a subject or topic.');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(`${API_BASE}/interviews/start`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          type: interviewType,
          subject: subject.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start interview');
      }

      if (!data.interview?.id) {
        throw new Error('The server did not return an interview ID.');
      }

      navigate(`/interview/${data.interview.id}`);
    } catch (err) {
      alert('Error starting interview: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const completedInterviews = [...history]
    .filter((item) => item.status === 'COMPLETED')
    .reverse();

  const average = (items, getScore) => {
    const validScores = items
      .map(getScore)
      .filter((score) => typeof score === 'number' && Number.isFinite(score));

    if (validScores.length === 0) return '0.0';

    return (
      validScores.reduce((sum, score) => sum + score, 0) /
      validScores.length
    ).toFixed(1);
  };

  const avgOverall = average(
    completedInterviews,
    (item) => item.overallScore
  );

  const avgComm = average(
    completedInterviews,
    (item) => item.communicationScore
  );

  const avgConf = average(
    completedInterviews,
    (item) => {
      if (
        typeof item.confidenceScore !== 'number' ||
        typeof item.eyeContactScore !== 'number'
      ) {
        return null;
      }

      return (item.confidenceScore + item.eyeContactScore) / 2;
    }
  );

  let atsScore = null;

  if (latestResume?.analysisResults) {
    try {
      const parsed =
        typeof latestResume.analysisResults === 'string'
          ? JSON.parse(latestResume.analysisResults)
          : latestResume.analysisResults;

      if (typeof parsed?.atsScore === 'number') {
        atsScore = parsed.atsScore;
      }
    } catch (err) {
      console.error('Failed to parse ATS score:', err);
    }
  }

  const chartData = {
    labels: completedInterviews.map((item) =>
      new Date(item.createdAt).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Overall Performance',
        data: completedInterviews.map((item) => item.overallScore),
        fill: true,
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13, 148, 136, 0.10)',
        tension: 0.4,
        pointBackgroundColor: '#0d9488',
        pointBorderColor: '#ffffff',
        pointHoverRadius: 6
      },
      {
        label: 'Confidence / Eye Contact',
        data: completedInterviews.map((item) => {
          if (
            typeof item.confidenceScore !== 'number' ||
            typeof item.eyeContactScore !== 'number'
          ) {
            return null;
          }

          return (item.confidenceScore + item.eyeContactScore) / 2;
        }),
        borderColor: '#14b8a6',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointBackgroundColor: '#14b8a6',
        pointBorderColor: '#ffffff',
        pointHoverRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: '#526c6c',
          font: {
            family: 'Plus Jakarta Sans',
            weight: '600'
          },
          usePointStyle: true,
          padding: 18
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#173536',
        bodyColor: '#526c6c',
        borderColor: '#d7eae7',
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(23, 53, 54, 0.06)'
        },
        ticks: {
          color: '#718787'
        }
      },
      y: {
        min: 0,
        max: 10,
        grid: {
          color: 'rgba(23, 53, 54, 0.06)'
        },
        ticks: {
          color: '#718787',
          stepSize: 2
        }
      }
    }
  };

  const totalInterviews = history.length;

  const metricCardStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    minWidth: 0
  };

  const iconBoxStyle = (background, color) => ({
    padding: '12px',
    borderRadius: '12px',
    background,
    color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  });

  const metricLabelStyle = {
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    fontWeight: 600
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        paddingBottom: '20px',
        color: 'var(--text-primary)'
      }}
    >
      {/* Dashboard Header */}
      <section
        className="glass-card"
        style={{
          background:
            'linear-gradient(135deg, #e8f8f5 0%, #f5fbfa 55%, #e6f7f5 100%)',
          padding: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
          borderColor: '#cce8e3'
        }}
      >
        <div style={{ flex: '1 1 300px' }}>
          <span
            style={{
              display: 'inline-block',
              color: '#0f766e',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '12px'
            }}
          >
            Your Interview Preparation
          </span>

          <h1
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              margin: 0,
              fontWeight: 800,
              lineHeight: 1.2
            }}
          >
            Master Your Placements
          </h1>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              margin: '12px 0 0',
              lineHeight: 1.7,
              maxWidth: '620px'
            }}
          >
            Practice interviews, improve your communication, and track your
            progress with AI-powered feedback.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: '#ffffff',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid #d7eae7',
              minWidth: '175px'
            }}
          >
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: '5px'
                }}
              >
                Target Company
              </span>

              <span
                className="badge badge-cyan"
                style={{
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  overflowWrap: 'anywhere'
                }}
              >
                {targetCompany === 'General'
                  ? 'General Preparation'
                  : targetCompany}
              </span>
            </div>

            {targetRole && (
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: '5px'
                  }}
                >
                  Target Role
                </span>

                <span
                  className="badge badge-primary"
                  style={{
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    overflowWrap: 'anywhere'
                  }}
                >
                  {targetRole}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/select-company')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0d9488',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 700,
                padding: '4px 0',
                textDecoration: 'underline',
                textAlign: 'left',
                alignSelf: 'flex-start'
              }}
            >
              Change target
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/resume')}
            className="btn-secondary"
            style={{
              minHeight: '44px',
              justifyContent: 'center'
            }}
          >
            <FileText size={18} />
            {latestResume ? 'Update Resume' : 'Upload Resume'}
          </button>
        </div>
      </section>

      {/* Error Notice */}
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            background: '#fef2f2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '0.9rem'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))',
          gap: '18px'
        }}
      >
        <div className="glass-card" style={metricCardStyle}>
          <div style={iconBoxStyle('#e6f7f5', '#0d9488')}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800 }}>
              {avgOverall}/10
            </div>
            <div style={metricLabelStyle}>Avg Answer Score</div>
          </div>
        </div>

        <div className="glass-card" style={metricCardStyle}>
          <div style={iconBoxStyle('#e0f7f4', '#0f766e')}>
            <Brain size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800 }}>
              {avgComm}/10
            </div>
            <div style={metricLabelStyle}>Communication Skill</div>
          </div>
        </div>

        <div className="glass-card" style={metricCardStyle}>
          <div style={iconBoxStyle('#f0fdfa', '#0d9488')}>
            <Video size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800 }}>
              {avgConf}/10
            </div>
            <div style={metricLabelStyle}>Visual Confidence</div>
          </div>
        </div>

        <div className="glass-card" style={metricCardStyle}>
          <div style={iconBoxStyle('#e8f7ed', '#15803d')}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800 }}>
              {totalInterviews}
            </div>
            <div style={metricLabelStyle}>Total Interviews</div>
          </div>
        </div>

        <div
          className="glass-card interactive"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/resume')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/resume');
            }
          }}
          style={{
            ...metricCardStyle,
            cursor: 'pointer'
          }}
        >
          <div
            style={iconBoxStyle(
              atsScore === null
                ? '#f0f9f8'
                : atsScore >= 80
                  ? '#e8f7ed'
                  : atsScore >= 60
                    ? '#fff7e6'
                    : '#fef2f2',
              atsScore === null
                ? '#718787'
                : atsScore >= 80
                  ? '#15803d'
                  : atsScore >= 60
                    ? '#b45309'
                    : '#dc2626'
            )}
          >
            <FileText size={24} />
          </div>

          <div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800 }}>
              {atsScore !== null ? `${atsScore}%` : 'N/A'}
            </div>
            <div style={metricLabelStyle}>
              {atsScore !== null ? 'ATS Match Score' : 'No Resume Uploaded'}
            </div>
          </div>
        </div>
      </section>

      {/* Start Interview and Performance Chart */}
      <section className="grid-2">
        <div
          className="glass-card"
          style={{
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <h3
            style={{
              fontSize: '1.2rem',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '9px'
            }}
          >
            <Play size={19} color="#0d9488" />
            Start Mock Interview
          </h3>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.88rem',
              lineHeight: 1.6,
              marginTop: 0,
              marginBottom: '22px'
            }}
          >
            Choose an interview type and topic to begin your practice session.
          </p>

          <form
            onSubmit={handleStartInterview}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flex: 1
            }}
          >
            <div className="form-group">
              <label htmlFor="interview-type">Interview Category</label>

              <select
                id="interview-type"
                className="form-control"
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
              >
                <option value="HR">Behavioral (HR)</option>
                <option value="TECHNICAL">Technical Interview</option>
                <option value="APTITUDE">Quantitative Aptitude</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="interview-subject">Subject / Topic Focus</label>

              <input
                id="interview-subject"
                type="text"
                className="form-control"
                placeholder="e.g. Java, React, Python, DBMS"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            {latestResume ? (
              <div
                style={{
                  background: '#e8f7ed',
                  border: '1px solid #b9e6c8',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '9px'
                }}
              >
                <CheckCircle2
                  size={18}
                  color="#15803d"
                  style={{ flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: '#166534',
                      fontWeight: 700,
                      overflowWrap: 'anywhere'
                    }}
                  >
                    Resume linked: {latestResume.fileName}
                  </div>
                  <div style={{ color: '#15803d', marginTop: '3px' }}>
                    Resume-based preparation is available.
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => navigate('/resume')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/resume');
                  }
                }}
                role="button"
                tabIndex={0}
                style={{
                  background: '#fff7e6',
                  border: '1px solid #f5d99b',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '9px',
                  cursor: 'pointer'
                }}
              >
                <AlertCircle
                  size={18}
                  color="#a16207"
                  style={{ flexShrink: 0 }}
                />
                <div>
                  <div style={{ color: '#92400e', fontWeight: 600 }}>
                    No resume uploaded.
                  </div>
                  <div
                    style={{
                      color: '#a16207',
                      marginTop: '3px'
                    }}
                  >
                    Upload your resume for personalized preparation.
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{
                marginTop: 'auto',
                width: '100%',
                justifyContent: 'center',
                minHeight: '46px'
              }}
              disabled={creating}
            >
              {creating ? (
                'Starting Session...'
              ) : (
                <>
                  <Play size={17} />
                  Launch AI Interview
                </>
              )}
            </button>
          </form>
        </div>

        {/* Performance Chart */}
        <div
          className="glass-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0
          }}
        >
          <h3
            style={{
              fontSize: '1.2rem',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '9px'
            }}
          >
            <BarChart2 size={19} color="#0d9488" />
            Performance Progress
          </h3>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.88rem',
              lineHeight: 1.6,
              marginTop: 0,
              marginBottom: '20px'
            }}
          >
            Track your scores across completed interviews.
          </p>

          <div
            style={{
              flex: 1,
              minHeight: '220px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {loading ? (
              <p style={{ color: 'var(--text-secondary)' }}>
                Loading performance data...
              </p>
            ) : completedInterviews.length > 0 ? (
              <div style={{ width: '100%' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '30px 10px',
                  color: 'var(--text-secondary)'
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    background: '#e6f7f5',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}
                >
                  <BarChart2 size={25} color="#0d9488" />
                </div>

                <p style={{ fontWeight: 700, color: '#173536' }}>
                  No performance history yet
                </p>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6
                  }}
                >
                  Complete your first interview to view your score progress.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Interview History */}
      <section className="glass-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '18px'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>
              Interview History
            </h3>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                margin: 0
              }}
            >
              Review previous sessions and feedback.
            </p>
          </div>

          <span className="badge badge-primary">
            {totalInterviews} {totalInterviews === 1 ? 'Session' : 'Sessions'}
          </span>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>
            Loading interview history...
          </div>
        ) : history.length === 0 ? (
          <div
            style={{
              color: 'var(--text-secondary)',
              padding: '34px 12px',
              textAlign: 'center',
              background: '#f7fcfb',
              borderRadius: '12px',
              border: '1px dashed #cce8e3'
            }}
          >
            <Calendar
              size={28}
              color="#0d9488"
              style={{ marginBottom: '10px' }}
            />
            <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#173536' }}>
              No interviews found
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Start your first mock interview using the form above.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                minWidth: '650px',
                fontSize: '0.9rem'
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-glass)',
                    background: '#f4fbfa',
                    color: 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  <th style={{ padding: '14px 12px' }}>Date</th>
                  <th style={{ padding: '14px 12px' }}>Interview Type</th>
                  <th style={{ padding: '14px 12px' }}>Subject</th>
                  <th style={{ padding: '14px 12px' }}>Status</th>
                  <th style={{ padding: '14px 12px' }}>Score</th>
                  <th style={{ padding: '14px 12px' }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {history.map((session) => (
                  <tr
                    key={session.id}
                    style={{
                      borderBottom: '1px solid #e8f1ef',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <td
                      style={{
                        padding: '14px 12px',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {new Date(session.createdAt).toLocaleDateString()}
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          marginTop: '3px'
                        }}
                      >
                        {new Date(session.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    <td style={{ padding: '14px 12px', fontWeight: 600 }}>
                      {session.type}
                    </td>

                    <td
                      style={{
                        padding: '14px 12px',
                        overflowWrap: 'anywhere'
                      }}
                    >
                      {session.subject}
                    </td>

                    <td style={{ padding: '14px 12px' }}>
                      {session.status === 'COMPLETED' ? (
                        <span className="badge badge-success">
                          Completed
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          Started
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 12px', fontWeight: 700 }}>
                      {typeof session.overallScore === 'number'
                        ? `${session.overallScore}/10`
                        : '-'}
                    </td>

                    <td style={{ padding: '14px 12px' }}>
                      {session.status === 'COMPLETED' ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/feedback/${session.id}`)}
                          className="btn-secondary"
                          style={{
                            padding: '7px 10px',
                            fontSize: '0.78rem',
                            borderRadius: '8px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          View Feedback <ChevronRight size={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(`/interview/${session.id}`)}
                          className="btn-primary"
                          style={{
                            padding: '7px 10px',
                            fontSize: '0.78rem',
                            borderRadius: '8px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Resume Session <ChevronRight size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
