import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/Evaluation.css";

export default function Evaluation() {

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {

    const evaluateStartup = async () => {

      if (!auth.currentUser) {
        navigate("/login");
        return;
      }

      try {

        setLoading(true);

        const response = await fetch("https://startuparena.onrender.com/evaluate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: auth.currentUser.uid,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Evaluation failed");
        }

        setResult(data);

      } catch (err) {

        console.error("Evaluation API error:", err);

      } finally {

        setLoading(false);

      }

    };

    evaluateStartup();

  }, [navigate]);

  /* -------------------- LOADING -------------------- */

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Evaluating your startup idea...</p>
        </div>
      </div>
    );
  }

  /* -------------------- NO RESULT -------------------- */

  if (!result) {
    return (
      <div className="container">
        <div className="card">

          <h2>No Evaluation Available</h2>

          <p>Please submit your pitch to receive evaluation.</p>

          <button onClick={() => navigate("/pitch")}>
            Submit Pitch
          </button>

        </div>
      </div>
    );
  }

  /* -------------------- SAFE VALUES -------------------- */

  const readiness = result.readiness || "Unknown";

  const score =
    typeof result.score === "number"
      ? result.score
      : 0;

  const confidence =
    result.confidence || "Not Available";

  const status =
    result.status || "Pending";

  const evaluationType =
    result.evaluationType || "Backend Evaluation";

  const prediction =
    result.prediction || "Unknown";

  /* -------------------- UI -------------------- */

  return (

    <div className="container evaluation-page">

      <div className="card">

        <h2>Startup Evaluation Summary</h2>

        <p className="subtitle">
          Evaluation Method:
          <strong> {evaluationType}</strong>
        </p>


        {/* 🔹 SCORE DISPLAY */}

        <div className="score-section">

          <h3>Overall Readiness Score</h3>

          <div className="score-value">
            {score}%
          </div>

          <div className="score-bar">

            <div
              className="score-fill"
              style={{ width: `${score}%` }}
            ></div>

          </div>

        </div>

        {/* 🔹 READINESS LEVEL */}

        <p className={`readiness ${readiness.toLowerCase()}`}>

          Readiness Level:
          <strong> {readiness}</strong>

        </p>

        {/* 🔹 READINESS EXPLANATION */}

        <div className="readiness-info">

          <h4>What does this mean?</h4>

          {readiness === "High" && (
            <p>
              Your startup idea is well-structured,
              validated, and strongly aligned with
              successful startup patterns.
            </p>
          )}

          {readiness === "Medium" && (
            <p>
              Your idea shows potential but requires
              refinement in clarity, validation,
              or business structure.
            </p>
          )}

          {readiness === "Low" && (
            <p>
              Your startup idea requires significant
              improvement before it can be considered
              execution-ready.
            </p>
          )}

          {readiness === "Unknown" && (
            <p>
              Evaluation data is incomplete.
              Please re-submit your pitch.
            </p>
          )}

        </div>

        {/* 🔹 CONFIDENCE */}

        <p className="confidence">

          Confidence Indicator:
          <strong> {confidence}</strong>

        </p>

        {/* 🔹 STATUS */}

        <p className="status">

          Evaluation Status:
          <strong> {status}</strong>

        </p>

        {/* 🔹 ACTION BUTTONS */}

        <div className="actions">

          <button onClick={() => navigate("/feedback")}>
            View Detailed Feedback
          </button>

          <button
            className="secondary"
            onClick={() => navigate("/pitch")}
          >
            Update Pitch
          </button>

        </div>

      </div>

    </div>

  );

}