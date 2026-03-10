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
            body: JSON.stringify({
              userId: auth.currentUser.uid
            })
          }
        );

        const data = await response.json();

        // Backend returns matrix directly
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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
          matrix
        })
      });

      alert("Evaluation Matrix Saved Successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Error saving matrix.");
    }
  };

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
      <div className="card">
        <h2>Startup Evaluation Matrix</h2>

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
    </div>
  );
}
