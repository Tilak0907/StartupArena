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
        const q = query(
          collection(db, "evaluationResults"),
          where("userId", "==", auth.currentUser.uid)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setLoading(false);
          return;
        }

        const evaluation = snapshot.docs[0].data();

        const score = evaluation.score || 0;
        const readiness = evaluation.readiness || "Low";
        const strengths = evaluation.strengths || [];
        const weaknesses = evaluation.weaknesses || [];

        /* ---------------- COMPONENT SCORING ---------------- */

        let problemScore = 50;
        let solutionScore = 50;
        let marketScore = 50;
        let revenueScore = 50;

        // Increase based on strengths
        strengths.forEach((item) => {
          if (item.toLowerCase().includes("problem"))
            problemScore += 20;

          if (item.toLowerCase().includes("solution"))
            solutionScore += 20;

          if (item.toLowerCase().includes("market"))
            marketScore += 20;

          if (item.toLowerCase().includes("revenue"))
            revenueScore += 20;
        });

        // Decrease based on weaknesses
        weaknesses.forEach((item) => {
          if (item.toLowerCase().includes("problem"))
            problemScore -= 15;

          if (item.toLowerCase().includes("solution"))
            solutionScore -= 15;

          if (item.toLowerCase().includes("market"))
            marketScore -= 15;

          if (item.toLowerCase().includes("revenue"))
            revenueScore -= 15;
        });

        // Adjust based on overall readiness
        if (readiness === "High") {
          problemScore += 5;
          solutionScore += 5;
          marketScore += 5;
          revenueScore += 5;
        }

        if (readiness === "Low") {
          problemScore -= 5;
          solutionScore -= 5;
          marketScore -= 5;
          revenueScore -= 5;
        }

        setAnalyticsData({
          overall: score,
          problem: Math.max(0, Math.min(problemScore, 100)),
          solution: Math.max(0, Math.min(solutionScore, 100)),
          market: Math.max(0, Math.min(marketScore, 100)),
          revenue: Math.max(0, Math.min(revenueScore, 100)),
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

  /* ---------------- CHART CONFIG ---------------- */

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
        color: "#ffffff",        // ✅ white Y-axis numbers
        font: {
          family: "Figtree",
          size: 13,
          weight: "500",
        },
      },
      grid: {
        color: "rgba(255,255,255,0.07)",
      },
      border: {
        color: "rgba(255,255,255,0.1)",
      },
    },
    x: {
      ticks: {
        color: "#ffffff",        // ✅ white bar label names
        font: {
          family: "Figtree",
          size: 13,
          weight: "500",
        },
      },
      grid: {
        color: "rgba(255,255,255,0.07)",
      },
      border: {
        color: "rgba(255,255,255,0.1)",
      },
    },
  },
  plugins: {
    legend: {
      labels: {
        color: "#ffffff",        // ✅ white legend text
        font: {
          family: "Figtree",
          size: 13,
        },
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
          📊 Component scores are derived from backend ECLAT evaluation
          (strength & weakness signals).
        </p>
      </div>
    </div>
  );
}
