import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

export default function Dashboard() {

  const [user, setUser] = useState(null);
  const [pitchStatus, setPitchStatus] = useState("Not Submitted");

  const [fundingStatus, setFundingStatus] = useState("Not Submitted");
  const [trlStatus, setTrlStatus] = useState("Not Submitted");
  const [matrixStatus, setMatrixStatus] = useState("Not Submitted");

  const [loading, setLoading] = useState(true);

  const news = [
    {
      title: "AI startups continue to attract strong investment globally as investors focus on technology driven innovation.",
      source: "Startup Ecosystem Update",
      link: "https://example.com/news1"
    },
    {
      title: "Indian startup ecosystem is expanding rapidly with support from incubators, accelerators and venture capital firms.",
      source: "Startup India Report",
      link: "https://example.com/news2"
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

          /* ===============================
             CHECK PITCH
          =============================== */

          const pitchQuery = query(
            collection(db, "pitches"),
            where("userId", "==", currentUser.uid)
          );

          const pitchSnapshot = await getDocs(pitchQuery);

          setPitchStatus(
            pitchSnapshot.empty ? "Not Submitted" : "Submitted & Evaluated"
          );

          /* ===============================
             CHECK FUNDING
          =============================== */

          const fundingQuery = query(
            collection(db, "fundingDetails"),
            where("userId", "==", currentUser.uid)
          );

          const fundingSnapshot = await getDocs(fundingQuery);

          setFundingStatus(
            fundingSnapshot.empty ? "Not Submitted" : "Submitted"
          );

          /* ===============================
             CHECK TRL
          =============================== */

          const trlQuery = query(
            collection(db, "trl"),
            where("userId", "==", currentUser.uid)
          );

          const trlSnapshot = await getDocs(trlQuery);

          setTrlStatus(
            trlSnapshot.empty ? "Not Submitted" : "Submitted"
          );

          /* ===============================
             CHECK EVALUATION MATRIX
          =============================== */

          const matrixQuery = query(
            collection(db, "evaluationMatrix"),
            where("userId", "==", currentUser.uid)
          );

          const matrixSnapshot = await getDocs(matrixQuery);

          if (matrixSnapshot.empty) {

            setMatrixStatus("Not Submitted");

          } else {

            const matrixData = matrixSnapshot.docs[0].data();

            const matrixValues = matrixData.matrix || {};

            const hasTrueValue = Object.values(matrixValues).some(
              value => value === true
            );

            if (hasTrueValue) {
              setMatrixStatus("Submitted");
            } else {
              setMatrixStatus("Not Submitted");
            }

          }

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

      {/* MAIN CARDS */}

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
            className="primary-btn-pitch"
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
            Evaluation Results of the Pitch
          </p>

          <button
            className="primary-btn"
            onClick={() => navigate("/evaluation")}
          >
            View Evaluation
          </button>

        </div>

      </section>

      {/* SMALL FEATURE CARDS */}

      <section className="dashboard-grid">

        <div className="dashboard-card">

          <h3>Funding Details</h3>

          <p>
            {fundingStatus === "Submitted"
              ? "Submitted"
              : "Not Submitted — Please submit funding details"}
          </p>

          <button
            className="primary-btn"
            onClick={() => navigate("/funding")}
          >
            Add Funding
          </button>

        </div>

        <div className="dashboard-card">

          <h3>TRL Level</h3>

          <button
            className="primary-btn-trl"
            onClick={() => navigate("/trl")}
          >
            View TRL
          </button>

        </div>

        <div className="dashboard-card">

          <h3>Evaluation Matrix</h3>

          <p>
            {matrixStatus === "Submitted"
              ? "Submitted"
              : "Not Submitted — Please submit evaluation matrix"}
          </p>

          <button
            className="primary-btn"
            onClick={() => navigate("/matrix")}
          >
            View Matrix
          </button>

        </div>

      </section>

      {/* INFO */}

      <section className="dashboard-info">

        <h3>How StartupArena Helps You</h3>

        <ul>
          <li>Real startup evaluation simulation</li>
          <li>Mentor Review and feedback</li>
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

              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <p style={{ fontWeight: "600" }}>
                  {item.title}
                </p>
              </a>

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