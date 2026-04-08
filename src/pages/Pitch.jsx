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
    painPoints: "", // ✅ Moved to top of state
    problem: "",
    solution: "",
    market: "",
    revenue: "",
  });

  const [pitchId, setPitchId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const navigate = useNavigate();

  /* ── Toast Helper ── */
  const showToast = (message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

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
          painPoints: pitchData.painPoints || "",
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
    if (!auth.currentUser) {
      showToast("Please login to submit your pitch.", "error");
      return;
    }

    // STRICT MANDATORY CHECK
    if (
      !data.painPoints.trim() ||
      !data.problem.trim() ||
      !data.solution.trim() ||
      !data.market.trim() ||
      !data.revenue.trim()
    ) {
      showToast("All fields are mandatory! Please fill in every section.", "error");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        painPoints: data.painPoints.trim(),
        problem: data.problem.trim(),
        solution: data.solution.trim(),
        market: data.market.trim(),
        revenue: data.revenue.trim(),
        userId: auth.currentUser.uid,
        status: "submitted",
        updatedAt: new Date(),
      };

      if (pitchId) {
        await updateDoc(doc(db, "pitches", pitchId), payload);
        showToast("Pitch updated successfully!", "success");
      } else {
        await addDoc(collection(db, "pitches"), {
          ...payload,
          createdAt: new Date(),
        });
        showToast("Pitch submitted successfully!", "success");
      }

      setTimeout(() => navigate("/evaluation"), 1500);

    } catch (err) {
      console.error("Pitch submission failed:", err);
      showToast("Failed to submit pitch. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container pitch-page">
      {toast.show && (
        <div className={`toast-message ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <h2>{pitchId ? "Update Your Pitch" : "Pitch Simulation"}</h2>

      <div className="pitch-layout">
        <div className="card">
          {/* ✅ Placed before Problem Statement with Disclaimer */}
          <label>Customer Pain Points * <small>(Mandatory but not considered for evaluation)</small></label>
          <textarea
            className="field-lg"
            value={data.painPoints}
            placeholder="What specific issues do your customers face?"
            onChange={(e) => setData({ ...data, painPoints: e.target.value })}
          />

          <label>Problem Statement *</label>
          <textarea
            className="field-lg"
            value={data.problem}
            placeholder="Describe the real-world problem clearly..."
            onChange={(e) => setData({ ...data, problem: e.target.value })}
          />

          <label>Solution *</label>
          <textarea
            className="field-lg"
            value={data.solution}
            placeholder="Explain your solution and its uniqueness..."
            onChange={(e) => setData({ ...data, solution: e.target.value })}
          />

          <label>Target Market *</label>
          <textarea
            className="field-md"
            value={data.market}
            placeholder="Who are your customers?"
            onChange={(e) => setData({ ...data, market: e.target.value })}
          />

          <label>Revenue Model *</label>
          <textarea
            className="field-md"
            value={data.revenue}
            placeholder="How will you generate revenue?"
            onChange={(e) => setData({ ...data, revenue: e.target.value })}
          />

          <button onClick={submitPitch} disabled={loading}>
            {loading ? "Processing..." : pitchId ? "Update Pitch" : "Submit Pitch"}
          </button>
        </div>

        <div className="card tips">
          <h3>Pitching Tips</h3>
          <p><strong>Pain Points:</strong> Be specific about how the problem hurts the customer (Required for context).</p>
          <p><strong>Problem:</strong> Identify a clear, real-world pain point that your business addresses.</p>
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