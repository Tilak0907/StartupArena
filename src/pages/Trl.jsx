import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/TRL.css";

export default function TRL() {
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const trlDescriptions = {
    1: "Basic principles observed and reported. (Idea stage / Research phase)",
    2: "Technology concept and application formulated.",
    3: "Experimental proof of concept demonstrated.",
    4: "Technology validated in laboratory environment.",
    5: "Technology validated in relevant environment.",
    6: "Technology demonstrated in relevant environment.",
    7: "System prototype demonstrated in operational environment.",
    8: "System complete and qualified.",
    9: "Actual system proven in real-world operational environment."
  };

  useEffect(() => {
    const fetchTRL = async () => {
      if (!auth.currentUser) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:5000/getTrl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: auth.currentUser.uid
        })
      });

      const data = await response.json();
      setLevel(data.level || 1);
      setLoading(false);
    };

    fetchTRL();
  }, [navigate]);

  const saveTRL = async () => {
    await fetch("http://localhost:5000/saveTrl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: auth.currentUser.uid,
        level,
        updatedBy: "founder"
      })
    });

    alert("TRL updated successfully!");
  };

  if (loading) {
    return <p>Loading TRL...</p>;
  }

  return (
    <div className="container trl-page">
      <div className="card">

        <h2>Technology Readiness Level (TRL)</h2>

        {/* Current Level Display */}
        <div className="current-level-box">
          <h3>Current Level: TRL {level}</h3>
          <p>{trlDescriptions[level]}</p>
        </div>

        {/* TRL Levels Grid */}
        <div className="trl-grid">
          {Object.entries(trlDescriptions).map(([num, description]) => (
  <div
    key={num}
    data-level={num}                          // ✅ add this
    className={`trl-item ${parseInt(num) === level ? "selected" : ""}`}
    onClick={() => setLevel(parseInt(num))}
  >
    <div className="trl-number">TRL {num}</div>
    <div className="trl-text">{description}</div>
  </div>
))}
        </div>

        <button onClick={saveTRL}>
          Update TRL Level
        </button>

      </div>
    </div>
  );
}