import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

export default function Dashboard() {

  const [user, setUser] = useState(null);
  const [pitchStatus, setPitchStatus] = useState("Not Submitted");
  const [loading, setLoading] = useState(true);

  /* ⭐ MANUAL NEWS */

  const news = [
    {
      title: "AI startups continue to attract strong investment globally as investors focus on technology driven innovation.",
      source: "Startup Ecosystem Update"
    },
    {
      title: "Indian startup ecosystem is expanding rapidly with support from incubators, accelerators and venture capital firms.",
      source: "Startup India Report"
    }
  ];

  const navigate = useNavigate();

  useEffect(() => {

    const alreadyTracked = sessionStorage.getItem("visitTracked");

    if (!alreadyTracked) {

      fetch("https://startuparena.onrender.com/track-visit", {
        method: "POST"
      });

      sessionStorage.setItem("visitTracked", "true");

    }

  }, []);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {

      setUser(currentUser);

      if (currentUser) {

        try {

          const q = query(
            collection(db, "pitches"),
            where("userId", "==", currentUser.uid)
          );

          const snapshot = await getDocs(q);

          setPitchStatus(
            snapshot.empty ? "Not Submitted" : "Submitted & Evaluated"
          );

        } catch {

          setPitchStatus("Not Submitted");

        }

      }

      setLoading(false);

    });

    const handleTabClose = () => signOut(auth);
    window.addEventListener("beforeunload", handleTabClose);

    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", handleTabClose);
    };

  }, []);

  if (loading) {

    return (
      <div className="dashboard-page">
        <div className="dashboard-card">Loading dashboard...</div>
      </div>
    );

  }

  if (!user) {

    navigate("/login");
    return null;

  }

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (

    <div className="dashboard-page">

      <section className="dashboard-hero">

        <div>
          <h1>Welcome to StartupArena</h1>
          <p>A Platform to Transform Ideas into Reality</p>
        </div>

        <div className="dashboard-user">
          <p className="user-email"><p>Logged In</p>{user.email}</p>
        </div>

      </section>

      {/* CARDS */}

      <section className="dashboard-grid">

        <div className="dashboard-card">

          <h3>Pitch Status</h3>

          <span
            className={`status-pill ${
              pitchStatus === "Not Submitted" ? "pending" : "success"
            }`}
          >
            {pitchStatus}
          </span>

          <button
            className="primary-btn"
            onClick={() => navigate("/pitch")}
          >
            {pitchStatus === "Not Submitted"
              ? "Submit Pitch"
              : "Update Pitch"}
          </button>

        </div>

        <div className="dashboard-card">

          <h3>Evaluation</h3>

          <p>
            AI-generated startup readiness feedback based on your pitch.
          </p>

          <button
            className="primary-btn"
            onClick={() => navigate("/feedback")}
          >
            View Feedback
          </button>

        </div>

        <div className="dashboard-card">

          <h3>Analytics</h3>

          <p>
            Analyze strengths and improvement areas using insights.
          </p>

          <button
            className="primary-btn"
            onClick={() => navigate("/analytics")}
          >
            View Analytics
          </button>

        </div>

      </section>

      {/* INFO */}

      <section className="dashboard-info">

        <h3>How StartupArena Helps You</h3>

        <ul>
          <li>Real startup evaluation simulation</li>
          <li>Explainable AI-based analysis</li>
          <li>Highlights strengths & weaknesses</li>
          <li>Improves investor readiness</li>
        </ul>

      </section>

      {/* STARTUP NEWS */}

      <section className="dashboard-grid">

        <div className="dashboard-card">

          <h3>Startup Updates</h3>

          {news.map((item, index) => (

            <div key={index} style={{ marginBottom: "12px" }}>

              <p style={{ fontWeight: "600" }}>
                {item.title}
              </p>

              <p style={{ fontSize: "13px", color: "#666" }}>
                {item.source}
              </p>

              <hr style={{ margin: "10px 0" }} />

            </div>

          ))}

        </div>

      </section>

    </div>

  );

}