
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Briefcase,
  Award,
  Building2,
  Target,
  LoaderCircle,
  X
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';

const COMPANIES = [
  {
    id: 'TCS',
    name: 'TCS',
    desc: 'Tata Consultancy Services - largest Indian multinational IT service provider.',
    gradient: 'linear-gradient(135deg, #1F57B3 0%, #0088CC 100%)',
    textColor: '#ffffff',
    roles: [
      {
        id: 'TCS Ninja',
        name: 'TCS Ninja Developer',
        desc: 'Entry-level development role evaluating fundamental coding (C/C++/Java/Python), SQL, operating systems, and basic analytical skills.',
        skills: ['C/Java/Python', 'SQL basics', 'Aptitude', 'Data Structures']
      },
      {
        id: 'TCS Digital',
        name: 'TCS Digital Developer',
        desc: 'Premium role evaluating advanced coding skills, Cloud concepts, AI/ML basics, Full Stack architecture, and system integration.',
        skills: ['Advanced DSA', 'Cloud Computing', 'Full-Stack development', 'AI/ML concepts']
      },
      {
        id: 'Systems Engineer',
        name: 'Systems Engineer',
        desc: 'Evaluates operating systems, infrastructure administration, Linux shell scripting, networking, and system security fundamentals.',
        skills: ['Operating Systems', 'Networking', 'Shell Scripting', 'IT Infrastructure']
      }
    ]
  },
  {
    id: 'Infosys',
    name: 'Infosys',
    desc: 'Infosys - global leader in next-generation digital services and consulting.',
    gradient: 'linear-gradient(135deg, #007CC3 0%, #005082 100%)',
    textColor: '#ffffff',
    roles: [
      {
        id: 'Systems Engineer',
        name: 'Systems Engineer',
        desc: 'Evaluates basic algorithms, relational database fundamentals, object-oriented programming concepts (Java/Python/C#), and software engineering principles.',
        skills: ['OOPs Concepts', 'SQL', 'Basic Coding', 'Web fundamentals']
      },
      {
        id: 'Digital Specialist Engineer',
        name: 'Digital Specialist Engineer (DSE)',
        desc: 'Focuses on application programming, modern framework technologies (React/Node), web services APIs, and relational/NoSQL databases.',
        skills: ['React/Node.js', 'REST APIs', 'Database Design', 'DSA']
      },
      {
        id: 'Specialist Programmer',
        name: 'Specialist Programmer (SP)',
        desc: 'Elite developer track evaluating advanced competitive programming, complex system designs, microservices, scaling issues, and low-level optimization.',
        skills: ['Competitive Programming', 'System Design', 'Algorithms', 'High Performance Systems']
      }
    ]
  },
  {
    id: 'Wipro',
    name: 'Wipro',
    desc: 'Wipro - leading global IT, consulting and business process services company.',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
    textColor: '#ffffff',
    roles: [
      {
        id: 'Project Engineer',
        name: 'Project Engineer',
        desc: 'Entry-level engineering role evaluating core language concepts, manual and automation testing fundamentals, SQL query formulation, and SDLC phases.',
        skills: ['Java/C++', 'Testing concepts', 'SQL Queries', 'SDLC']
      },
      {
        id: 'Wipro Star',
        name: 'Wipro Star Developer',
        desc: 'Evaluates complex analytical reasoning, advanced programming logic, multi-threading, database indexing, and enterprise system design.',
        skills: ['Advanced Coding', 'Database Optimization', 'OOPs Design', 'Concurrency']
      }
    ]
  },
  {
    id: 'Cognizant',
    name: 'Cognizant',
    desc: 'Cognizant - leading technology services provider helping clients modernize technology.',
    gradient: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
    textColor: '#ffffff',
    roles: [
      {
        id: 'Programmer Analyst',
        name: 'Programmer Analyst',
        desc: 'Evaluates debugging expertise, language fundamentals (Java/C#), testing methodologies, SQL databases, and ticket resolution logic.',
        skills: ['Debugging', 'SQL Basics', 'Core Java/.NET', 'Software Testing']
      },
      {
        id: 'GenC Elevate',
        name: 'GenC Elevate Developer',
        desc: 'Focuses on backend services, modern web frontend tech, intermediate data structures, and database mapping framework implementations (e.g. Hibernate).',
        skills: ['Web Frameworks', 'Data Structures', 'Database integrations', 'JavaScript']
      }
    ]
  },
  {
    id: 'Reliance Jio',
    name: 'Reliance Jio',
    desc: 'Jio - digital services company providing LTE networks and tech ecosystems in India.',
    gradient: 'linear-gradient(135deg, #0f3cc9 0%, #1d4ed8 100%)',
    textColor: '#ffffff',
    roles: [
      {
        id: 'Software Development Engineer',
        name: 'Software Development Engineer',
        desc: 'Evaluates building high-scale backends, API optimization, MVC architectures, caching strategies, and telemetry instrumentation.',
        skills: ['API Development', 'Java/Go/Python', 'SQL & NoSQL', 'System Design']
      },
      {
        id: 'Cloud & DevOps Engineer',
        name: 'Cloud & DevOps Engineer',
        desc: 'Evaluates understanding of Docker/Kubernetes container orchestration, cloud configurations (AWS/Azure/GCP), CI/CD scripting, and site reliability.',
        skills: ['Docker/K8s', 'CI/CD Pipelines', 'AWS/GCP', 'Linux Internals']
      }
    ]
  },
  {
    id: 'Flipkart',
    name: 'Flipkart',
    desc: "Flipkart - India's leading e-commerce marketplace powered by cutting-edge tech.",
    gradient: 'linear-gradient(135deg, #183fa1 0%, #2874f0 100%)',
    textColor: '#ffffff',
    roles: [
      {
        id: 'SDE-1',
        name: 'Software Development Engineer I (SDE-1)',
        desc: 'Highly rigorous tech interview evaluating clean object-oriented design patterns, complex algorithms, caching, rate-limiters, and transaction logic.',
        skills: ['Algorithms', 'Object Oriented Design', 'Concurrency', 'System Design']
      },
      {
        id: 'UI Engineer I',
        name: 'UI Engineer I',
        desc: 'Evaluates deep frontend expertise, browser rendering performance, asynchronous programming, custom state managers, and CSS/HTML layouts.',
        skills: ['React/JavaScript', 'Web Performance', 'DOM architecture', 'CSS Layouts']
      },
      {
        id: 'Data Analyst',
        name: 'Data Analyst',
        desc: 'Evaluates descriptive analytics, SQL window functions, query tuning, basic python pandas manipulation, and statistical distribution modeling.',
        skills: ['SQL/Window Functions', 'Pandas/Python', 'Statistics', 'Data Visualization']
      }
    ]
  },
  {
    id: 'Zomato',
    name: 'Zomato',
    desc: 'Zomato - food delivery and restaurant search platform catering to millions daily.',
    gradient: 'linear-gradient(135deg, #cb202d 0%, #ef4444 100%)',
    textColor: '#ffffff',
    roles: [
      {
        id: 'Software Engineer',
        name: 'Software Engineer',
        desc: 'Evaluates real-time geo-spatial processing, concurrency, queueing systems (Kafka), pub-sub patterns, and ultra-low latency API design.',
        skills: ['High Throughput Systems', 'Kafka/Redis', 'Node.js/Go/Python', 'DSA']
      },
      {
        id: 'Mobile Developer (iOS/Android)',
        name: 'Mobile Developer (iOS/Android)',
        desc: 'Evaluates mobile application lifecycles, memory profiles, offline synchronization, location APIs, and smooth UI frame rendering.',
        skills: ['Swift/Kotlin', 'Mobile Architecture', 'Offline Sync', 'Location APIs']
      }
    ]
  },
  {
    id: 'Swiggy',
    name: 'Swiggy',
    desc: 'Swiggy - premier on-demand delivery platform with robust logistics tech.',
    gradient: 'linear-gradient(135deg, #fc8019 0%, #ff9e47 100%)',
    textColor: '#ffffff',
    roles: [
      {
        id: 'SDE-1',
        name: 'Software Development Engineer I (SDE-1)',
        desc: 'Focuses on microservice partitioning, clean interface design, algorithms, database transaction handling, and resilience patterns.',
        skills: ['Data Structures', 'Microservices', 'REST APIs', 'Java/Go']
      },
      {
        id: 'QA Automation Engineer',
        name: 'QA Automation Engineer',
        desc: 'Evaluates API automation testing, test execution speed, writing stable UI tests, and continuous test pipelines.',
        skills: ['Selenium/Playwright', 'API Automation', 'Test Strategy', 'CICD testing']
      }
    ]
  },
  {
    id: 'Paytm',
    name: 'Paytm',
    desc: "Paytm - India's pioneer financial services app & payment systems provider.",
    gradient: 'linear-gradient(135deg, #00b9f5 0%, #002e6e 100%)',
    textColor: '#ffffff',
    roles: [
      {
        id: 'Backend Engineer',
        name: 'Backend Engineer',
        desc: 'Evaluates high-security financial transactions, double-entry accounting schemas, strict API security, encryption standards, and thread safety.',
        skills: ['Java/Spring Boot', 'Transaction Security', 'Concurrency', 'SQL Integrity']
      },
      {
        id: 'DevOps Engineer',
        name: 'DevOps Engineer',
        desc: 'Evaluates automated configuration management, security hardening, virtual private clouds, network firewalls, and kubernetes operations.',
        skills: ['Kubernetes', 'Cloud Security', 'Terraform', 'Monitoring']
      }
    ]
  },
  {
    id: 'Zoho',
    name: 'Zoho',
    desc: 'Zoho - Indian technology company producing Web-based business tools.',
    gradient: 'linear-gradient(135deg, #009e49 0%, #e20613 100%)',
    textColor: '#ffffff',
    roles: [
      {
        id: 'Software Developer',
        name: 'Software Developer',
        desc: 'Evaluates strong custom programming logic without external libraries, system memory footprint optimization, custom web architectures, and algorithms.',
        skills: ['C/Java', 'Custom Frameworks', 'Algorithms', 'Logic & Aptitude']
      },
      {
        id: 'Frontend Web Developer',
        name: 'Frontend Web Developer',
        desc: 'Evaluates pure Vanilla Javascript mastery, DOM manipulation optimization, rendering loop speeds, custom components, and layouts.',
        skills: ['Vanilla JS', 'DOM manipulation', 'HTML5/CSS3', 'Web UI optimization']
      }
    ]
  },
  {
    id: 'Freshworks',
    name: 'Freshworks',
    desc: 'Freshworks - multi-national SaaS company providing business software products.',
    gradient: 'linear-gradient(135deg, #0052cc 0%, #00a3ff 100%)',
    textColor: '#ffffff',
    roles: [
      {
        id: 'Software Engineer',
        name: 'Software Engineer',
        desc: 'Evaluates multi-tenant SaaS application design, REST API specifications, webhook configurations, and database relations.',
        skills: ['Ruby on Rails/Java/Node', 'SaaS Architecture', 'REST APIs', 'Relational DBs']
      },
      {
        id: 'Product Analyst',
        name: 'Product Analyst',
        desc: 'Evaluates usage cohort analysis, SQL aggregation queries, KPI dashboards, product funnel analytics, and customer success indicators.',
        skills: ['SQL/Cohorts', 'Product Metrics', 'Excel & BI Tools', 'A/B Testing']
      }
    ]
  },
  {
    id: 'General',
    name: 'General Mock',
    desc: 'General Mock - tailored for standard college and campus placements.',
    gradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
    textColor: '#ffffff',
    roles: [
      {
        id: 'General SDE',
        name: 'General Software Engineer',
        desc: 'Standard tech interview assessing database concepts, computer networks, object-oriented concepts, and basic data structures.',
        skills: ['DBMS', 'Computer Networks', 'OOPs', 'Basic DSA']
      },
      {
        id: 'General QA',
        name: 'General Quality Analyst',
        desc: 'Standard QA interview evaluating test case generation, test strategies, exploratory testing, and basic automation.',
        skills: ['Test Case Writing', 'Manual Testing', 'QA Methodologies', 'Agile']
      },
      {
        id: 'General PM',
        name: 'General Product Manager',
        desc: 'Standard PM mock session focused on product design, estimation, user research, and generic metrics.',
        skills: ['Product Sense', 'Guesstimates', 'Behavioral metrics', 'Design thinking']
      }
    ]
  }
];

export default function SelectCompany({ user, onUpdateCompany }) {
  const [selectedCompany, setSelectedCompany] = useState(
    user?.targetCompany || ''
  );
  const [selectedRole, setSelectedRole] = useState(
    user?.targetRole || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const currentCompanyObj = COMPANIES.find(
    (company) => company.id === selectedCompany
  );

  const currentRoleObj = currentCompanyObj?.roles?.find(
    (role) => role.id === selectedRole
  );

  const handleCompanySelect = (companyId) => {
    setError('');
    setSelectedCompany(companyId);

    const company = COMPANIES.find(
      (item) => item.id === companyId
    );

    if (company?.roles?.length) {
      if (
        user?.targetCompany === companyId &&
        company.roles.some((role) => role.id === user?.targetRole)
      ) {
        setSelectedRole(user.targetRole);
      } else {
        setSelectedRole(company.roles[0].id);
      }
    } else {
      setSelectedRole('');
    }
  };

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setError('');
  };

  const handleConfirm = async () => {
    if (!selectedCompany) {
      setError('Please select a company to proceed.');
      return;
    }

    if (!selectedRole) {
      setError('Please select a role to proceed.');
      return;
    }

    const token = localStorage.getItem('interview_iq_token');

    if (!token) {
      setError('Your session has expired. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/users/company`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          company: selectedCompany,
          role: selectedRole
        })
      });

      let responseData = {};

      try {
        responseData = await response.json();
      } catch {
        responseData = {};
      }

      if (!response.ok) {
        throw new Error(
          responseData.error || 'Failed to update target details.'
        );
      }

      if (typeof onUpdateCompany === 'function') {
        onUpdateCompany(
          responseData.targetCompany ?? selectedCompany,
          responseData.targetRole ?? selectedRole
        );
      }

      navigate('/');
    } catch (err) {
      setError(
        err.message ||
        'Unable to save your preferences. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="select-company-page animate-fade-in">
      <style>{`
        .select-company-page {
          --sc-primary: #0d9488;
          --sc-secondary: #14b8a6;
          --sc-text: #173536;
          --sc-muted: #526c6c;
          --sc-border: #d7eae7;
          --sc-surface: #ffffff;
          width: 100%;
          min-height: 85vh;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 36px 16px;
          color: var(--sc-text);
        }

        .sc-container {
          width: 100%;
          max-width: 1050px;
          padding: 32px;
          background: var(--sc-surface);
          border: 1px solid var(--sc-border);
          border-radius: 22px;
          box-shadow: 0 12px 38px rgba(13, 148, 136, 0.08);
        }

        .sc-heading {
          text-align: center;
          margin-bottom: 32px;
        }

        .sc-heading-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--sc-primary);
          background: #e7f8f5;
          border: 1px solid #c8eee7;
          border-radius: 16px;
        }

        .sc-title {
          margin: 0 0 12px;
          color: var(--sc-text);
          font-size: clamp(1.7rem, 4vw, 2.3rem);
          font-weight: 800;
          line-height: 1.2;
        }

        .sc-subtitle {
          max-width: 680px;
          margin: 0 auto;
          color: var(--sc-muted);
          font-size: 0.96rem;
          line-height: 1.7;
        }

        .sc-section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 18px;
          color: var(--sc-text);
          font-size: 1.1rem;
          font-weight: 750;
        }

        .sc-step {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 29px;
          height: 29px;
          color: #ffffff;
          background: var(--sc-primary);
          border-radius: 50%;
          font-size: 0.85rem;
          font-weight: 800;
        }

        .sc-company-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 34px;
        }

        .sc-company-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 0;
          padding: 18px;
          text-align: left;
          color: var(--sc-text);
          background: #ffffff;
          border: 1px solid var(--sc-border);
          border-radius: 15px;
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease,
            transform 0.2s ease, background 0.2s ease;
        }

        .sc-company-card:hover {
          border-color: #8bd8cc;
          box-shadow: 0 6px 20px rgba(13, 148, 136, 0.08);
          transform: translateY(-2px);
        }

        .sc-company-card.selected {
          background: #f0fbf9;
          border: 2px solid var(--sc-primary);
          padding: 17px;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.08);
        }

        .sc-company-top {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-right: 16px;
        }

        .sc-company-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 800;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
        }

        .sc-company-name {
          margin: 0;
          color: var(--sc-text);
          font-size: 1rem;
          font-weight: 750;
        }

        .sc-company-description {
          margin: 0;
          color: var(--sc-muted);
          font-size: 0.82rem;
          line-height: 1.55;
        }

        .sc-selected-indicator {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 23px;
          height: 23px;
          color: #ffffff;
          background: var(--sc-primary);
          border-radius: 50%;
        }

        .sc-role-section {
          margin-bottom: 30px;
          padding-top: 4px;
        }

        .sc-role-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
        }

        .sc-role-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          max-width: 100%;
          padding: 11px 15px;
          color: var(--sc-muted);
          background: #ffffff;
          border: 1px solid var(--sc-border);
          border-radius: 11px;
          font-size: 0.88rem;
          font-weight: 650;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sc-role-button:hover {
          border-color: #8bd8cc;
          background: #f5fcfb;
        }

        .sc-role-button.selected {
          color: #087f74;
          background: #e8f8f5;
          border-color: var(--sc-primary);
        }

        .sc-role-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 23px;
          background: #f7fcfb;
          border: 1px solid var(--sc-border);
          border-radius: 16px;
          animation: scFadeIn 0.25s ease;
        }

        .sc-role-heading {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin: 0 0 10px;
          color: var(--sc-text);
          font-size: 1.08rem;
          line-height: 1.5;
        }

        .sc-role-description {
          margin: 0;
          color: var(--sc-muted);
          font-size: 0.9rem;
          line-height: 1.7;
        }

        .sc-skills-title {
          margin: 0 0 12px;
          color: var(--sc-muted);
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .sc-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .sc-skill {
          padding: 7px 11px;
          color: #087f74;
          background: #e6f7f3;
          border: 1px solid #c6ece4;
          border-radius: 8px;
          font-size: 0.79rem;
          font-weight: 650;
        }

        .sc-error {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-bottom: 24px;
          padding: 13px 15px;
          color: #b42318;
          background: #fff3f1;
          border: 1px solid #ffd5ce;
          border-radius: 11px;
          font-size: 0.88rem;
          line-height: 1.5;
        }

        .sc-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 24px;
          border-top: 1px solid var(--sc-border);
        }

        .sc-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 45px;
          padding: 11px 19px;
          border-radius: 11px;
          font-size: 0.9rem;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sc-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .sc-button-secondary {
          color: var(--sc-text);
          background: #ffffff;
          border: 1px solid var(--sc-border);
        }

        .sc-button-secondary:hover:not(:disabled) {
          background: #f2faf8;
          border-color: #a9dcd4;
        }

        .sc-button-primary {
          min-width: 195px;
          color: #ffffff;
          background: var(--sc-primary);
          border: 1px solid var(--sc-primary);
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.17);
        }

        .sc-button-primary:hover:not(:disabled) {
          background: #0b8278;
          box-shadow: 0 6px 17px rgba(13, 148, 136, 0.23);
          transform: translateY(-1px);
        }

        @keyframes scFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 800px) {
          .sc-company-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .sc-container {
            padding: 25px;
          }
        }

        @media (max-width: 520px) {
          .select-company-page {
            padding: 20px 10px;
          }

          .sc-container {
            padding: 18px 14px;
            border-radius: 16px;
          }

          .sc-company-grid {
            grid-template-columns: 1fr;
            gap: 11px;
          }

          .sc-company-card {
            padding: 15px;
          }

          .sc-company-card.selected {
            padding: 14px;
          }

          .sc-role-panel {
            padding: 17px;
          }

          .sc-role-button {
            width: 100%;
            justify-content: flex-start;
          }

          .sc-actions {
            flex-direction: column-reverse;
            align-items: stretch;
          }

          .sc-button {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .select-company-page *,
          .select-company-page *::before,
          .select-company-page *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="sc-container">
        <header className="sc-heading">
          <div className="sc-heading-icon">
            <Target size={27} />
          </div>

          <h2 className="sc-title">
            Select Your Target Company &amp; Role
          </h2>

          <p className="sc-subtitle">
            Choose your preferred company and placement role.
            InterviewIQ will tailor your interview practice to the
            selected role, including relevant topics, questions,
            and evaluation.
          </p>
        </header>

        {error && (
          <div className="sc-error" role="alert">
            <X size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        <section>
          <h3 className="sc-section-title">
            <span className="sc-step">1</span>
            <Building2 size={20} color="#0d9488" />
            Select a Company
          </h3>

          <div className="sc-company-grid">
            {COMPANIES.map((company) => {
              const isSelected = selectedCompany === company.id;

              return (
                <button
                  key={company.id}
                  type="button"
                  className={`sc-company-card ${
                    isSelected ? 'selected' : ''
                  }`}
                  onClick={() => handleCompanySelect(company.id)}
                  aria-pressed={isSelected}
                  aria-label={`Select ${company.name}`}
                >
                  {isSelected && (
                    <span className="sc-selected-indicator">
                      <Check size={14} />
                    </span>
                  )}

                  <div className="sc-company-top">
                    <div
                      className="sc-company-logo"
                      style={{
                        background: company.gradient,
                        color: company.textColor
                      }}
                    >
                      {company.name.substring(0, 2)}
                    </div>

                    <h4 className="sc-company-name">
                      {company.name}
                    </h4>
                  </div>

                  <p className="sc-company-description">
                    {company.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {selectedCompany && currentCompanyObj && (
          <section className="sc-role-section animate-fade-in">
            <h3 className="sc-section-title">
              <span className="sc-step">2</span>
              <Briefcase size={20} color="#0d9488" />
              Choose a Role at {currentCompanyObj.name}
            </h3>

            <div className="sc-role-list">
              {currentCompanyObj.roles.map((role) => {
                const isRoleSelected = selectedRole === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    className={`sc-role-button ${
                      isRoleSelected ? 'selected' : ''
                    }`}
                    onClick={() => handleRoleSelect(role.id)}
                    aria-pressed={isRoleSelected}
                  >
                    <Briefcase size={15} />
                    <span>{role.name}</span>
                    {isRoleSelected && <Check size={15} />}
                  </button>
                );
              })}
            </div>

            {selectedRole && currentRoleObj && (
              <div className="sc-role-panel">
                <div>
                  <h4 className="sc-role-heading">
                    <Award
                      size={21}
                      color="#0d9488"
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    Role Description: {currentRoleObj.name}
                  </h4>

                  <p className="sc-role-description">
                    {currentRoleObj.desc}
                  </p>
                </div>

                <div>
                  <h5 className="sc-skills-title">
                    Core Evaluated Skills
                  </h5>

                  <div className="sc-skills">
                    {currentRoleObj.skills.map((skill) => (
                      <span className="sc-skill" key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        <div className="sc-actions">
          <button
            type="button"
            className="sc-button sc-button-secondary"
            onClick={() => navigate('/')}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="sc-button sc-button-primary"
            onClick={handleConfirm}
            disabled={loading || !selectedCompany || !selectedRole}
          >
            {loading ? (
              <>
                <LoaderCircle size={17} className="sc-spinner" />
                Saving Preference...
              </>
            ) : (
              <>
                Confirm Selections
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .sc-spinner {
          animation: scSpin 1s linear infinite;
        }

        @keyframes scSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
