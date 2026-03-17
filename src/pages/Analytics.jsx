import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import "../styles/Analytics.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!auth.currentUser) {
        navigate("/login");
        return;
      }

      try {
        const userId = auth.currentUser.uid;

        /* ===============================
           1️⃣ GET EVALUATION RESULT
        =============================== */

        const evalQuery = query(
          collection(db, "evaluationResults"),
          where("userId", "==", userId)
        );

        const evalSnapshot = await getDocs(evalQuery);

        if (evalSnapshot.empty) {
          setLoading(false);
          return;
        }

        const evaluation = evalSnapshot.docs[0].data();
        const score = evaluation.score || 0;

        /* ===============================
           2️⃣ GET FEATURE VECTOR
        =============================== */

        const featureQuery = query(
          collection(db, "featureVectors"),
          where("userId", "==", userId)
        );

        const featureSnapshot = await getDocs(featureQuery);

        if (featureSnapshot.empty) {
          console.warn("No feature vector found");
          setLoading(false);
          return;
        }

        const featureData = featureSnapshot.docs[0].data();
        const features = featureData.features || [];

        /* ===============================
           3️⃣ NEW LOGIC (STRUCTURED + TF-IDF)
        =============================== */

        const normalizeTFIDF = (val, max = 30) =>
          Math.min(1, val / max);

        const getScore = (structured, tfidf) => {
          const structuredPercent = (structured / 3) * 70;
          const tfidfPercent = normalizeTFIDF(tfidf) * 30;
          return Math.round(structuredPercent + tfidfPercent);
        };

        const problemScore = getScore(features[0] || 0, features[5] || 0);
        const solutionScore = getScore(features[1] || 0, features[6] || 0);
        const marketScore = getScore(features[2] || 0, features[7] || 0);
        const revenueScore = getScore(features[3] || 0, features[8] || 0);

        setAnalyticsData({
          overall: score,
          problem: problemScore,
          solution: solutionScore,
          market: marketScore,
          revenue: revenueScore,
        });

      } catch (err) {
        console.error("Analytics error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [navigate]);

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  /* ---------------- NO DATA ---------------- */
  if (!analyticsData) {
    return (
      <div className="container">
        <div className="card">
          <h2>No Analytics Available</h2>
          <p>Please submit your pitch to view analytics.</p>
          <button onClick={() => navigate("/pitch")}>
            Submit Pitch
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- CHART DATA ---------------- */

  const data = {
    labels: [
      "Problem Clarity",
      "Solution Strength",
      "Market Potential",
      "Revenue Model",
    ],
    datasets: [
      {
        label: "Component Score (%)",
        data: [
          analyticsData.problem,
          analyticsData.solution,
          analyticsData.market,
          analyticsData.revenue,
        ],
        backgroundColor: [
          "#22c55e",
          "#3b82f6",
          "#f59e0b",
          "#8b5cf6",
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          color: "#ffffff",
          font: {
            family: "Figtree",
            size: 13,
            weight: "500",
          },
        },
        grid: {
          color: "rgba(255,255,255,0.07)",
        },
      },
      x: {
        ticks: {
          color: "#ffffff",
          font: {
            family: "Figtree",
            size: 13,
            weight: "500",
          },
        },
        grid: {
          color: "rgba(255,255,255,0.07)",
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#ffffff",
        },
      },
    },
  };

  return (
    <div className="container analytics-page">
      <div className="card">
        <h2>Startup Analytics</h2>

        <p className="subtitle">
          Overall Readiness Score: <strong>{analyticsData.overall}%</strong>
        </p>

        <Bar data={data} options={options} />

        <p className="hint">
          📊 Component scores are derived from structured features and TF-IDF values.
        </p>
      </div>
    </div>
  );
}