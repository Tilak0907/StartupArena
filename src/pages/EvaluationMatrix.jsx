import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/EvaluationMatrix.css";

export default function EvaluationMatrix() {
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const criteriaList = [
    "Understanding of Tech Ecosystem",
    "Core Team with Subject Expertise",
    "External Collaboration",
    "Industry Networking",
    "Market-Based Business Model",
    "Clear Value Proposition"
  ];

  const whyFillReasons = [
    {
      icon: "🎯",
      title: "Identify Gaps Early",
      desc: "Pinpoint weaknesses in your startup's foundation before investors do — and fix them proactively."
    },
    {
      icon: "📊",
      title: "Benchmark Readiness",
      desc: "Understand exactly where your startup stands across key dimensions that matter to the ecosystem."
    },
    {
      icon: "🤝",
      title: "Build Investor Trust",
      desc: "A completed matrix signals structured thinking and strategic awareness — qualities investors look for."
    },
    {
      icon: "🚀",
      title: "Accelerate Growth",
      desc: "Founders who evaluate honestly grow 2x faster by focusing resources on what actually matters."
    },
    {
      icon: "🔁",
      title: "Track Progress",
      desc: "Re-evaluate over time to see how your startup evolves and whether gaps are closing."
    }
  ];

  /* ================================
     FETCH SAVED MATRIX
  ================================= */
  useEffect(() => {
    const fetchMatrix = async () => {
      if (!auth.currentUser) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          "https://startuparena.onrender.com/getMatrix",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: auth.currentUser.uid })
          }
        );

        const data = await response.json();

        if (data && Object.keys(data).length > 0) {
          setMatrix(data);
        } else {
          initializeEmptyMatrix();
        }
      } catch (error) {
        console.error("Matrix fetch error:", error);
        initializeEmptyMatrix();
      } finally {
        setLoading(false);
      }
    };

    fetchMatrix();
  }, [navigate]);

  /* ================================
     INITIALIZE EMPTY MATRIX
  ================================= */
  const initializeEmptyMatrix = () => {
    const emptyMatrix = {};
    criteriaList.forEach(item => {
      emptyMatrix[item] = false;
    });
    setMatrix(emptyMatrix);
  };

  /* ================================
     HANDLE CHECKBOX CHANGE
  ================================= */
  const handleChange = (criterion) => {
    setMatrix(prev => ({
      ...prev,
      [criterion]: !prev[criterion]
    }));
  };

  /* ================================
     SAVE MATRIX
  ================================= */
  const handleSubmit = async () => {
    try {
      await fetch("https://startuparena.onrender.com/saveMatrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: auth.currentUser.uid, matrix })
      });
      alert("Evaluation Matrix Saved Successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Error saving matrix.");
    }
  };

  // Completion score
  const completedCount = matrix
    ? Object.values(matrix).filter(Boolean).length
    : 0;
  const totalCount = criteriaList.length;
  const completionPct = Math.round((completedCount / totalCount) * 100);

  /* ================================
     LOADING STATE
  ================================= */
  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading Evaluation Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container matrix-page">
      <div className="matrix-layout">

        {/* LEFT — Main Matrix Card */}
        <div className="card matrix-card">
          <h2>Startup Evaluation Matrix</h2>

          {/* Progress bar */}
          <div className="progress-wrapper">
            <div className="progress-label">
              <span>Completion</span>
              <span className="progress-pct">{completionPct}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          <table className="matrix-table">
            <thead>
              <tr>
                <th>Criteria</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {criteriaList.map((criterion, index) => (
                <tr
                  key={index}
                  className={matrix[criterion] ? "checked-row" : ""}
                  onClick={() => handleChange(criterion)}
                >
                  <td>
                    <div className="criteria-cell">
                      <span className="row-index">{index + 1}</span>
                      {criterion}
                    </div>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={matrix[criterion] || false}
                      onChange={() => handleChange(criterion)}
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="save-btn" onClick={handleSubmit}>
            Save Evaluation
          </button>
        </div>

        {/* RIGHT — Why Fill Panel */}
        <aside className="why-panel">
          <div className="why-header">
            <span className="why-icon">💡</span>
            <h3>Why Fill This Matrix?</h3>
          </div>
          <p className="why-intro">
            This matrix isn't just a checklist — it's a strategic lens for your startup's
            health. Here's why every founder should take it seriously:
          </p>

          <ul className="why-list">
            {whyFillReasons.map((reason, i) => (
              <li key={i} className="why-item">
                <span className="why-item-icon">{reason.icon}</span>
                <div>
                  <strong>{reason.title}</strong>
                  <p>{reason.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="why-callout">
            <span>✅</span>
            <p>
              Founders who complete this matrix are <strong>better prepared</strong> for
              mentorship sessions, funding rounds, and ecosystem opportunities.
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}