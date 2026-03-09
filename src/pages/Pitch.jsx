import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/Pitch.css";

export default function Pitch() {
  const [data, setData] = useState({
    problem: "",
    solution: "",
    market: "",
    revenue: "",
  });

  const [pitchId, setPitchId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /* ---------------- FETCH EXISTING PITCH ---------------- */
  useEffect(() => {
    const fetchPitch = async () => {
      if (!auth.currentUser) return;

      const q = query(
        collection(db, "pitches"),
        where("userId", "==", auth.currentUser.uid)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const existing = snapshot.docs[0];
        setPitchId(existing.id);

        const pitchData = existing.data();

        setData({
          problem: pitchData.problem || "",
          solution: pitchData.solution || "",
          market: pitchData.market || "",
          revenue: pitchData.revenue || "",
        });
      }
    };

    fetchPitch();
  }, []);

  /* ---------------- SUBMIT / UPDATE PITCH ---------------- */
  const submitPitch = async () => {
    setError("");

    if (!auth.currentUser) {
      setError("Please login to submit your pitch.");
      return;
    }

    if (
      !data.problem.trim() ||
      !data.solution.trim() ||
      !data.market.trim() ||
      !data.revenue.trim()
    ) {
      setError("Please fill in all fields before submitting.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        problem: data.problem,
        solution: data.solution,
        market: data.market,
        revenue: data.revenue,
        userId: auth.currentUser.uid,
        status: "submitted",
        updatedAt: new Date(),
      };

      /* 🔹 UPDATE EXISTING */
      if (pitchId) {
        await updateDoc(doc(db, "pitches", pitchId), payload);
        alert("Pitch updated successfully!");
      } else {
        /* 🔹 CREATE NEW */
        await addDoc(collection(db, "pitches"), {
          ...payload,
          createdAt: new Date(),
        });
        alert("Pitch submitted successfully!");
      }

      // ✅ Redirect to evaluation page
      navigate("/evaluation");

    } catch (err) {
      console.error("Pitch submission failed:", err);
      setError("Failed to submit pitch. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="container pitch-page">
      <h2>{pitchId ? "Update Your Pitch" : "Pitch Simulation"}</h2>

      <div className="pitch-layout">

        <div className="card">
          {error && <p className="error">{error}</p>}

          <label>Problem Statement</label>
          <textarea
            value={data.problem}
            placeholder="Describe the real-world problem clearly..."
            onChange={(e) =>
              setData({ ...data, problem: e.target.value })
            }
          />

          <label>Solution</label>
          <textarea
            value={data.solution}
            placeholder="Explain your solution and its uniqueness..."
            onChange={(e) =>
              setData({ ...data, solution: e.target.value })
            }
          />

          <label>Target Market</label>
          <input
            value={data.market}
            placeholder="Who are your customers?"
            onChange={(e) =>
              setData({ ...data, market: e.target.value })
            }
          />

          <label>Revenue Model</label>
          <input
            value={data.revenue}
            placeholder="How will you generate revenue?"
            onChange={(e) =>
              setData({ ...data, revenue: e.target.value })
            }
          />

          <button onClick={submitPitch} disabled={loading}>
            {loading
              ? "Processing..."
              : pitchId
              ? "Update Pitch"
              : "Submit Pitch"}
          </button>
        </div>

        {/* TIPS PANEL */}
        <div className="card tips">
          <h3>Pitching Tips</h3>
          <p><strong>Problem:</strong> Identify a clear, real-world pain point.</p>
          <p><strong>Solution:</strong> Explain what makes it unique.</p>
          <p><strong>Market:</strong> Define who will pay and why.</p>
          <p><strong>Revenue:</strong> Mention pricing or monetization strategy.</p>
          <hr />
          <p className="hint">
            💡 Submit your pitch to receive AI-powered evaluation.
          </p>
        </div>

      </div>
    </div>
  );
}
