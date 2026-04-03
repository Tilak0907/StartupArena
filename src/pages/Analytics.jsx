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
        const overallScore = evaluation.score || 0;

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
           3️⃣ CREATE WEIGHTS
           (Structured + TF-IDF)
        =============================== */

        const normalizeTFIDF = (val, max = 30) =>
          Math.min(1, val / max);

        const getWeight = (structured, tfidf) => {
          const s = structured / 3;        // normalize 0–1
          const t = normalizeTFIDF(tfidf); // normalize 0–1
          return (s * 0.7) + (t * 0.3);    // weighted
        };

        const weights = [
          getWeight(features[0] || 0, features[5] || 0), // problem
          getWeight(features[1] || 0, features[6] || 0), // solution
          getWeight(features[2] || 0, features[7] || 0), // market
          getWeight(features[3] || 0, features[8] || 0), // revenue
        ];

        /* ===============================
           4️⃣ DISTRIBUTE OVERALL SCORE
        =============================== */

        const totalWeight = weights.reduce((a, b) => a + b, 0);

        const distributedScores = weights.map(w =>
          totalWeight === 0
            ? 0
            : Math.round((w / totalWeight) * overallScore)
        );

        /* Fix rounding mismatch */
        const diff =
          overallScore -
          distributedScores.reduce((a, b) => a + b, 0);

        if (diff !== 0) {
          distributedScores[0] += diff; // adjust first
        }

        setAnalyticsData({
          overall: overallScore,
          problem: distributedScores[0],
          solution: distributedScores[1],
          market: distributedScores[2],
          revenue: distributedScores[3],
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
        label: "Component Score",
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
        max: analyticsData.overall, // 🔥 important change
        ticks: {
          color: "#ffffff",
        },
      },
      x: {
        ticks: {
          color: "#ffffff",
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
          Overall Readiness Score: <strong>{analyticsData.overall}</strong>
        </p>

        <Bar data={data} options={options} />

        <p className="hint">
          Component scores are proportionally distributed from overall evaluation score.
        </p>
      </div>
    </div>
  );
}