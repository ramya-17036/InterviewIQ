
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award,
  RefreshCw,
  ChevronLeft,
  CheckCircle2,
  MessageSquare,
  BarChart2,
  Star,
  TrendingUp,
  Lightbulb,
  AlertCircle,
} from 'lucide-react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const API_BASE = 'http://localhost:8080/api';

const colors = {
  primary: '#0d9488',
  secondary: '#14b8a6',
  dark: '#173536',
  text: '#526c6c',
  muted: '#648080',
  border: '#d7eae7',
  background: '#f4fbfa',
  white: '#ffffff',
  lightTeal: '#e2f6f2',
};

const cardStyle = {
  background: colors.white,
  border: `1px solid ${colors.border}`,
  borderRadius: '18px',
  padding: '24px',
  boxShadow: '0 5px 18px rgba(13, 148, 136, 0.05)',
  minWidth: 0,
};

const sectionHeading = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  color: colors.dark,
  fontSize: '1.12rem',
  fontWeight: 750,
  margin: '0 0 20px',
};

const clampScore = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(10, number));
};

const displayScore = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1).replace(/\.0$/, '') : '—';
};

const getScoreColor = (score) => {
  if (score >= 8) return colors.primary;
  if (score >= 6) return '#b7791f';
  return '#c24141';
};

export default function Feedback() {
  const { id: interviewId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('interview_iq_token');

    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchFeedback = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `${API_BASE}/interviews/${interviewId}/feedback`,
          { headers: getHeaders() }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.error ||
              result.message ||
              'Failed to retrieve interview feedback.'
          );
        }

        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load interview feedback.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (interviewId) {
      fetchFeedback();
    } else {
      setError('Interview ID is missing.');
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [interviewId, getHeaders]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '55vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px',
          color: colors.text,
        }}
      >
        <RefreshCw
          size={38}
          color={colors.primary}
          style={{ animation: 'spin 1.2s linear infinite' }}
        />
        <h2 style={{ color: colors.dark, fontSize: '1.1rem', margin: 0 }}>
          Preparing your feedback
        </h2>
        <p style={{ margin: 0, fontSize: '0.9rem', textAlign: 'center' }}>
          Loading your interview scores and evaluation...
        </p>
      </div>
    );
  }

  if (error || !data?.interview) {
    return (
      <div
        style={{
          ...cardStyle,
          maxWidth: '600px',
          margin: '30px auto',
          textAlign: 'center',
        }}
      >
        <AlertCircle
          size={38}
          color="#c24141"
          style={{ marginBottom: '12px' }}
        />
        <h2 style={{ color: colors.dark, margin: '0 0 10px' }}>
          Feedback unavailable
        </h2>
        <p style={{ color: colors.text, lineHeight: 1.7 }}>
          {error || 'The feedback for this interview could not be found.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            border: 'none',
            borderRadius: '10px',
            padding: '12px 18px',
            background: colors.primary,
            color: colors.white,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={16} style={{ verticalAlign: 'middle' }} /> Back to
          Dashboard
        </button>
      </div>
    );
  }

  const { interview, questions = [] } = data;
  const questionList = Array.isArray(questions) ? questions : [];

  const overall = clampScore(interview.overallScore);
  const technical = clampScore(interview.technicalScore);
  const communication = clampScore(interview.communicationScore);
  const eyeContact = clampScore(interview.eyeContactScore);
  const confidence = clampScore(interview.confidenceScore);
  const sentenceStructure = clampScore(
    (overall + communication) / 2
  );

  const radarData = {
    labels: [
      'Technical Accuracy',
      'Communication',
      'Eye Contact',
      'Confidence',
      'Sentence Structure',
    ],
    datasets: [
      {
        label: 'Your Score',
        data: [
          technical,
          communication,
          eyeContact,
          confidence,
          sentenceStructure,
        ],
        backgroundColor: 'rgba(13, 148, 136, 0.18)',
        borderColor: colors.primary,
        borderWidth: 2.5,
        pointBackgroundColor: colors.primary,
        pointBorderColor: '#ffffff',
        pointRadius: 4,
      },
      {
        label: 'Benchmark Target',
        data: [8.5, 8, 8.5, 8, 8],
        backgroundColor: 'rgba(20, 184, 166, 0.04)',
        borderColor: '#7cbfb4',
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointBackgroundColor: '#7cbfb4',
        pointBorderColor: '#ffffff',
        pointRadius: 3,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.1,
    scales: {
      r: {
        min: 0,
        max: 10,
        beginAtZero: true,
        angleLines: { color: '#d7eae7' },
        grid: { color: '#d7eae7' },
        pointLabels: {
          color: colors.text,
          font: {
            family: 'Arial, sans-serif',
            size: 11,
            weight: '600',
          },
        },
        ticks: {
          stepSize: 2,
          color: colors.muted,
          backdropColor: 'transparent',
          font: { size: 10 },
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: colors.text,
          usePointStyle: true,
          padding: 18,
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw}/10`,
        },
      },
    },
  };

  const scoreItems = [
    {
      label: 'Technical & Domain Knowledge',
      score: technical,
      description: 'Accuracy of technical explanations',
      color: '#0d9488',
    },
    {
      label: 'Communication & Flow',
      score: communication,
      description: 'Clarity and organization of responses',
      color: '#14b8a6',
    },
    {
      label: 'Eye Contact Stability',
      score: eyeContact,
      description: 'Visual engagement during the session',
      color: '#3b9bb2',
    },
    {
      label: 'Confidence',
      score: confidence,
      description: 'Confidence and presentation',
      color: '#68a99b',
    },
  ];

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        color: colors.dark,
        width: '100%',
      }}
    >
      {/* Page header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              background: colors.lightTeal,
              color: colors.primary,
              borderRadius: '25px',
              padding: '7px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              marginBottom: '10px',
            }}
          >
            <Award size={15} />
            INTERVIEW PERFORMANCE REPORT
          </div>

          <h1
            style={{
              color: colors.dark,
              fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
              fontWeight: 800,
              margin: 0,
            }}
          >
            Interview Feedback
          </h1>

          <p
            style={{
              color: colors.text,
              fontSize: '0.9rem',
              lineHeight: 1.6,
              margin: '8px 0 0',
            }}
          >
            Review your scores, responses, and areas for improvement.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '10px 15px',
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            background: colors.white,
            color: colors.primary,
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={17} />
          Dashboard
        </button>
      </header>

      {/* Overall score summary */}
      <section
        style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, #ffffff 0%, #eaf9f5 100%)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '26px',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: '100px',
              height: '100px',
              flexShrink: 0,
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 22px rgba(13, 148, 136, 0.18)',
            }}
          >
            <span style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1 }}>
              {displayScore(interview.overallScore)}
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>/ 10</span>
          </div>

          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                color: colors.dark,
                fontSize: '1.4rem',
                margin: '0 0 10px',
              }}
            >
              Overall Score
            </h2>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                color: getScoreColor(overall),
                fontSize: '0.88rem',
                fontWeight: 700,
                marginBottom: '12px',
              }}
            >
              <Star size={16} />
              {overall >= 8
                ? 'Strong Performance'
                : overall >= 6
                  ? 'Good Progress'
                  : 'Room to Improve'}
            </div>

            <div style={{ color: colors.text, fontSize: '0.88rem', lineHeight: 1.8 }}>
              <div>
                Interview Category:{' '}
                <strong style={{ color: colors.dark }}>
                  {interview.type || 'General'}
                </strong>
              </div>
              <div>
                Focus:{' '}
                <strong style={{ color: colors.dark }}>
                  {interview.subject || 'General Interview'}
                </strong>
              </div>
              <div>
                Interview Reference:{' '}
                <strong style={{ color: colors.dark }}>
                  #{interview.id}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: `1px solid ${colors.border}`,
            paddingTop: '20px',
            minWidth: 0,
          }}
        >
          <h3
            style={{
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: colors.primary,
              margin: '0 0 10px',
              fontWeight: 800,
            }}
          >
            Executive Feedback Summary
          </h3>
          <p
            style={{
              color: colors.text,
              fontSize: '0.92rem',
              lineHeight: 1.8,
              margin: 0,
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
            }}
          >
            {interview.feedback || 'No overall feedback summary is available.'}
          </p>
        </div>
      </section>

      {/* Score cards */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
        }}
      >
        {scoreItems.map((item) => (
          <div
            key={item.label}
            style={{
              ...cardStyle,
              padding: '19px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <span
                style={{
                  color: colors.text,
                  fontSize: '0.84rem',
                  lineHeight: 1.5,
                  fontWeight: 600,
                }}
              >
                {item.label}
              </span>

              <TrendingUp
                size={18}
                color={item.color}
                style={{ flexShrink: 0 }}
              />
            </div>

            <div
              style={{
                fontSize: '1.7rem',
                fontWeight: 800,
                color: colors.dark,
                marginTop: '16px',
              }}
            >
              {displayScore(item.score)}
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  color: colors.muted,
                }}
              >
                {' '}
                / 10
              </span>
            </div>

            <div
              style={{
                fontSize: '0.77rem',
                color: colors.muted,
                marginTop: '5px',
                lineHeight: 1.5,
              }}
            >
              {item.description}
            </div>

            <div
              style={{
                height: '6px',
                background: '#e7f2f0',
                borderRadius: '20px',
                overflow: 'hidden',
                marginTop: '15px',
              }}
            >
              <div
                style={{
                  width: `${item.score * 10}%`,
                  height: '100%',
                  background: item.color,
                  borderRadius: '20px',
                }}
              />
            </div>
          </div>
        ))}
      </section>

      {/* Dimension breakdown and radar chart */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: '22px',
          alignItems: 'stretch',
        }}
      >
        <section style={cardStyle}>
          <h2 style={sectionHeading}>
            <Award size={21} color={colors.primary} />
            Dimensional Breakdown
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '23px' }}>
            {scoreItems.map((item) => (
              <div key={item.label}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    fontSize: '0.86rem',
                    marginBottom: '9px',
                  }}
                >
                  <span style={{ color: colors.text }}>{item.label}</span>
                  <strong style={{ color: colors.dark, flexShrink: 0 }}>
                    {displayScore(item.score)}%
                  </strong>
                </div>

                <div
                  style={{
                    height: '8px',
                    borderRadius: '20px',
                    background: '#e7f2f0',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${item.score * 10}%`,
                      height: '100%',
                      borderRadius: '20px',
                      background: item.color,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '25px',
              padding: '14px',
              background: '#f4fbfa',
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: colors.text,
              fontSize: '0.83rem',
              lineHeight: 1.7,
            }}
          >
            <Lightbulb
              size={18}
              color={colors.primary}
              style={{ flexShrink: 0, marginTop: '2px' }}
            />
            Focus on the areas with lower scores when preparing for your next
            mock interview.
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={sectionHeading}>
            <BarChart2 size={21} color={colors.primary} />
            Performance Analytics
          </h2>

          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              margin: '0 auto',
            }}
          >
            <Radar data={radarData} options={radarOptions} />
          </div>

          <p
            style={{
              textAlign: 'center',
              color: colors.muted,
              fontSize: '0.78rem',
              lineHeight: 1.6,
              margin: '14px 0 0',
            }}
          >
            Compare your interview dimensions against the benchmark target.
          </p>
        </section>
      </div>

      {/* Question-by-question evaluation */}
      <section style={cardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '22px',
          }}
        >
          <h2 style={{ ...sectionHeading, margin: 0 }}>
            <MessageSquare size={21} color={colors.primary} />
            Session Transcript & AI Evaluation
          </h2>

          <span
            style={{
              padding: '7px 11px',
              background: colors.lightTeal,
              color: colors.primary,
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            {questionList.length}{' '}
            {questionList.length === 1 ? 'Question' : 'Questions'}
          </span>
        </div>

        {questionList.length === 0 ? (
          <div
            style={{
              background: colors.background,
              border: `1px dashed ${colors.border}`,
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              color: colors.text,
              fontSize: '0.9rem',
            }}
          >
            No question-level evaluation is available for this session.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {questionList.map((question, index) => {
              const contentScore = clampScore(question.score);
              const confidenceScore = clampScore(question.confidenceScore);

              return (
                <article
                  key={question.id ?? index}
                  style={{
                    background: '#fbfefd',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '14px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '17px',
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '11px',
                        flex: 1,
                        minWidth: '180px',
                      }}
                    >
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          borderRadius: '10px',
                          background: colors.lightTeal,
                          color: colors.primary,
                          fontWeight: 800,
                          fontSize: '0.85rem',
                        }}
                      >
                        {index + 1}
                      </div>

                      <h3
                        style={{
                          fontSize: '0.97rem',
                          lineHeight: 1.7,
                          color: colors.dark,
                          margin: '4px 0 0',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {question.questionText || 'Question text unavailable'}
                      </h3>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          padding: '7px 10px',
                          borderRadius: '20px',
                          background: '#e2f6f2',
                          color: colors.primary,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Content: {displayScore(question.score)}/10
                      </span>

                      <span
                        style={{
                          padding: '7px 10px',
                          borderRadius: '20px',
                          background: '#edf5fb',
                          color: '#376d8a',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Confidence: {displayScore(question.confidenceScore)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        color: colors.dark,
                        fontSize: '0.83rem',
                        fontWeight: 750,
                        marginBottom: '8px',
                      }}
                    >
                      Your Response
                    </div>

                    <div
                      style={{
                        color: colors.text,
                        background: colors.white,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '10px',
                        padding: '14px',
                        fontSize: '0.88rem',
                        lineHeight: 1.8,
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {question.candidateAnswer?.trim()
                        ? question.candidateAnswer
                        : 'No response was recorded for this question.'}
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#edfbf6',
                      border: '1px solid #cce9e4',
                      borderRadius: '11px',
                      padding: '15px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: colors.primary,
                        fontSize: '0.84rem',
                        fontWeight: 750,
                        marginBottom: '8px',
                      }}
                    >
                      <CheckCircle2 size={17} />
                      AI Critique & Improvement Recommendations
                    </div>

                    <p
                      style={{
                        color: colors.text,
                        fontSize: '0.86rem',
                        lineHeight: 1.8,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {question.evaluationFeedback ||
                        'No specific evaluation feedback is available for this answer.'}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '8px',
        }}
      >
        <p
          style={{
            color: colors.muted,
            fontSize: '0.8rem',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Review this report to identify what to practice next.
        </p>

        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '9px',
            border: 'none',
            borderRadius: '10px',
            padding: '13px 18px',
            background: colors.primary,
            color: colors.white,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Back to Dashboard
          <ChevronLeft size={17} />
        </button>
      </div>
    </div>
  );
}
