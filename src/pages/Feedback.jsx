import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/Feedback.css";

export default function Feedback() {
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvaluation = async () => {
      if (!auth.currentUser) {
        navigate("/login");
        return;
      }

      try {
        const q = query(
          collection(db, "evaluationResults"),
          where("userId", "==", auth.currentUser.uid)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          // 🔹 Manually find latest evaluation
          const evaluations = snapshot.docs.map(doc => doc.data());

          const latest = evaluations.sort(
            (a, b) =>
              new Date(b.evaluatedAt?.seconds
                ? b.evaluatedAt.seconds * 1000
                : b.evaluatedAt
              ) -
              new Date(a.evaluatedAt?.seconds
                ? a.evaluatedAt.seconds * 1000
                : a.evaluatedAt
              )
          )[0];

          setEvaluation(latest);
        }
      } catch (err) {
        console.error("Failed to fetch evaluation:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [navigate]);

  /* -------------------- LOADING -------------------- */
  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading feedback...</p>
        </div>
      </div>
    );
  }

  /* -------------------- NO EVALUATION -------------------- */
  if (!evaluation) {
    return (
      <div className="container">
        <div className="card">
          <h2>No Evaluation Found</h2>
          <p>Please submit your pitch to receive evaluation.</p>
          <button onClick={() => navigate("/pitch")}>
            Submit Pitch
          </button>
        </div>
      </div>
    );
  }

  /* -------------------- SAFE EXTRACTION -------------------- */
  const readiness = evaluation.readiness || "Low";
  const score = evaluation.score || 0;
  const confidence = evaluation.confidence || "Low";
  const evaluationType =
    evaluation.evaluationType || "Pattern-Based Evaluation";

  const strengths = evaluation.strengths || [];
  const weaknesses = evaluation.weaknesses || [];

  /* -------------------- TIPS -------------------- */
  const tips = [];

  weaknesses.forEach((item) => {
    const text = item.toLowerCase();

    if (text.includes("problem")) {
      tips.push(
        "Clarify the problem with measurable impact and real-world context."
      );
    }

    if (text.includes("solution")) {
      tips.push(
        "Strengthen your solution differentiation and technical advantage."
      );
    }

    if (text.includes("market")) {
      tips.push(
        "Provide clearer target market definition and validation data."
      );
    }

    if (text.includes("revenue")) {
      tips.push(
        "Explain monetization logic and revenue sustainability in detail."
      );
    }
  });

  if (tips.length === 0) {
    tips.push("Continue validating and refining your startup idea.");
  }

  /* -------------------- UI -------------------- */
  return (
    <div className="container feedback-page">
      <div className="card">

        <h2>Founder Feedback</h2>

        <p className="subtitle">
          Evaluation Type: <strong>{evaluationType}</strong>
        </p>

        <div className="score-summary">
          <p>
            Overall Score: <strong>{score}%</strong>
          </p>

          <p>
            Readiness Level:{" "}
            <strong className={`readiness ${readiness.toLowerCase()}`}>
              {readiness}
            </strong>
          </p>

          <p>
            Confidence: <strong>{confidence}</strong>
          </p>
        </div>

        {/* Strengths */}
        <section className="feedback-section success">
          <h3>✅ Strengths</h3>
          {strengths.length > 0 ? (
            <ul>
              {strengths.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>No major strengths identified.</p>
          )}
        </section>

        {/* Weaknesses */}
        <section className="feedback-section warning">
          <h3>⚠ Weaknesses</h3>
          {weaknesses.length > 0 ? (
            <ul>
              {weaknesses.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>No critical weaknesses detected.</p>
          )}
        </section>

        {/* Tips */}
        <section className="feedback-section info">
          <h3>💡 Improvement Tips</h3>
          <ul>
            {tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </section>

        <div className="actions">
          <button onClick={() => navigate("/pitch")}>
            Update Pitch
          </button>
        </div>

      </div>
    </div>
  );
}
