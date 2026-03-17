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

  const [profileStatus, setProfileStatus] = useState("Not Submitted"); // ⭐ NEW

  const [loading, setLoading] = useState(true);

  const news = [
    {
      title: "Visa processing startup Atlys raises $36 Mn in Series C funding",
      source: "Entrackr",
      link: "https://entrackr.com/news/visa-processing-startup-atlys-raises-36-mn-in-series-c-funding-11218314"
    },
    {
      title: "This startup lets you harvest your own mangoes, without owning a mango tree",
      source: "livemint",
      link: "https://www.livemint.com/companies/start-ups/rent-a-tree-kerala-startup-lets-you-lease-mango-trees-harvest-mangoes-11773313324283.html"
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

          /* ⭐ PROFILE CHECK (NEW) */
          const profileQuery = query(
            collection(db, "profiles"),
            where("userId", "==", currentUser.uid)
          );

          const profileSnapshot = await getDocs(profileQuery);

          if (profileSnapshot.empty) {

            setProfileStatus("Not Submitted");

          } else {

            const profileData = profileSnapshot.docs[0].data();

            const values = Object.values(profileData).filter(
              value => value !== null && value !== "" && value !== undefined
            );

            const totalFields = Object.keys(profileData).length - 1;

            if (values.length >= totalFields) {
              setProfileStatus("Submitted");
            } else {
              setProfileStatus("Not Submitted");
            }

          }

          /* EXISTING CODE BELOW (UNCHANGED) */

          const pitchQuery = query(
            collection(db, "pitches"),
            where("userId", "==", currentUser.uid)
          );

          const pitchSnapshot = await getDocs(pitchQuery);

          setPitchStatus(
            pitchSnapshot.empty ? "Not Submitted" : "Submitted & Evaluated"
          );

          const fundingQuery = query(
            collection(db, "fundingDetails"),
            where("userId", "==", currentUser.uid)
          );

          const fundingSnapshot = await getDocs(fundingQuery);

          setFundingStatus(
            fundingSnapshot.empty ? "Not Submitted" : "Submitted"
          );

          const trlQuery = query(
            collection(db, "trl"),
            where("userId", "==", currentUser.uid)
          );

          const trlSnapshot = await getDocs(trlQuery);

          setTrlStatus(
            trlSnapshot.empty ? "Not Submitted" : "Submitted"
          );

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

            setMatrixStatus(hasTrueValue ? "Submitted" : "Not Submitted");

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

          {/* ⭐ SMALL PROFILE MESSAGE */}
          <p className="profile-status">
            {profileStatus === "Submitted"
              ? "Profile Submitted ✅"
              : "Profile Not Submitted — Please complete your profile"}
          </p>

        </div>

        <div className="dashboard-user">
          <p className="user-email">
            <span>Logged In : </span>
            {user.email}
          </p>
        </div>

      </section>

      {/* REST OF YOUR CODE UNCHANGED */}

      {/* MAIN CARDS */}
      <section className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Pitch Status</h3>
          <span className={`status-pill ${pitchStatus === "Not Submitted" ? "pending" : "success"}`}>
            {pitchStatus}
          </span>
          <button className="primary-btn-pitch" onClick={() => navigate("/pitch")}>
            {pitchStatus === "Not Submitted" ? "Submit Pitch" : "Update Pitch"}
          </button>
        </div>

        <div className="dashboard-card">
          <h3>Evaluation</h3>
          <p>Evaluation Results of the Pitch</p>
          <button className="primary-btn" onClick={() => navigate("/evaluation")}>
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
          <button className="primary-btn" onClick={() => navigate("/funding")}>
            Add Funding
          </button>
        </div>

        <div className="dashboard-card">
          <h3>TRL Level</h3>
          <button className="primary-btn-trl" onClick={() => navigate("/trl")}>
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
          <button className="primary-btn" onClick={() => navigate("/matrix")}>
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

      {/* NEWS */}
      <section className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Startup Updates</h3>

          {news.map((item, index) => (
            <div key={index} className="news-item">
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="news-link">
                {item.title}
              </a>
              <p className="news-source">{item.source}</p>
              <hr className="news-divider" />
            </div>
          ))}
        </div>
      </section>

    </div>

  );

}