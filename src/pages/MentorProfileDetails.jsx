import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { db, auth } from "../firebase";
import "../styles/MentorProfileDetails.css";

export default function MentorProfileDetails() {
  const { id } = useParams();

  const [profile, setProfile] = useState(null);
  const [pitch, setPitch] = useState(null);
  const [trlLevel, setTrlLevel] = useState(1);
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Review & Modal States
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [decision, setDecision] = useState("pending");
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [reviewId, setReviewId] = useState(null);
  const [reviewDate, setReviewDate] = useState(null);
  const [message, setMessage] = useState("");

  // Funding States
  const [funding, setFunding] = useState(null);
  const [showFundingModal, setShowFundingModal] = useState(false);

  // Comparison States
  const [pastStartups, setPastStartups] = useState([]);
  const [selectedStartup, setSelectedStartup] = useState(null);

  const displayValue = (value) => value || "Data not provided by the founder";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRef = doc(db, "profiles", id);
        const profileSnap = await getDoc(profileRef);
        if (!profileSnap.exists()) { setLoading(false); return; }

        const profileData = profileSnap.data();
        setProfile(profileData);

        /* FETCH PITCH */
        const pitchSnapshot = await getDocs(query(collection(db, "pitches"), where("userId", "==", profileData.userId)));
        if (!pitchSnapshot.empty) setPitch(pitchSnapshot.docs[0].data());

        /* FETCH TRL */
        const trlDoc = await getDoc(doc(db, "trlLevels", profileData.userId));
        if (trlDoc.exists()) setTrlLevel(trlDoc.data().level);

        /* FETCH MATRIX */
        const matrixDoc = await getDoc(doc(db, "evaluationMatrix", profileData.userId));
        if (matrixDoc.exists()) setMatrix(matrixDoc.data().matrix);

        /* FETCH FUNDING */
        const fundingSnapshot = await getDocs(query(collection(db, "fundingDetails"), where("userId", "==", profileData.userId)));
        if (!fundingSnapshot.empty) setFunding(fundingSnapshot.docs[0].data());

        /* FETCH EXISTING REVIEW */
        const reviewSnapshot = await getDocs(query(collection(db, "mentorReviews"), where("profileId", "==", id), where("mentorId", "==", auth.currentUser.uid)));
        if (!reviewSnapshot.empty) {
          const reviewDoc = reviewSnapshot.docs[0];
          setAlreadyReviewed(true);
          setReviewId(reviewDoc.id);
          setFeedback(reviewDoc.data().feedback);
          setDecision(reviewDoc.data().status);
          setReviewDate(reviewDoc.data().updatedAt);
        }

        /* FETCH SUCCESS STARTUPS LIST */
        const startupsSnap = await getDocs(collection(db, "startups"));
        setPastStartups(startupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

 const findCommonTerms = (str1, str2) => {
  if (!str1 || !str2) return { keywords: "", score: 0, level: "None" };

  const words1 = str1.toLowerCase().split(/\W+/);
  const words2 = str2.toLowerCase().split(/\W+/);

  // 1. High-value industry terms (Weightage: 2 points)
  const businessTerms = [
    'subscription', 'commission', 'marketplace', 'platform', 'revenue',
    'surplus', 'inventory', 'automated', 'scalability', 'freemium'
  ];

  // 2. Filter meaningful words
  const stopWords = ['this', 'that', 'with', 'from', 'your', 'their', 'they', 'them', 'will'];
  const common = words1.filter(word => 
    word.length > 3 && 
    !stopWords.includes(word) && 
    words2.includes(word)
  );

  const uniqueCommon = [...new Set(common)];

  // 3. Calculate Score
  let scoreValue = 0;
  uniqueCommon.forEach(word => {
    scoreValue += businessTerms.includes(word) ? 20 : 10;
  });

  // Cap score at 100%
  const finalScore = Math.min(scoreValue, 100);

  // 4. Determine Match Level
  let level = "Low";
  if (finalScore > 70) level = "High";
  else if (finalScore > 30) level = "Medium";

  return {
    keywords: uniqueCommon.length > 0 ? uniqueCommon.join(", ") : "No common keywords found.",
    score: finalScore,
    level: level
  };
};

  /* ── SUBMIT / UPDATE REVIEW ── */
  const handleReviewSubmit = async () => {
    if (!feedback.trim()) {
      alert("Please provide feedback before submitting.");
      return;
    }

    try {
      const reviewPayload = {
        profileId: id,
        mentorId: auth.currentUser.uid,
        feedback: feedback.trim(),
        status: decision,
        updatedAt: serverTimestamp(),
      };

      if (alreadyReviewed) {
        await updateDoc(doc(db, "mentorReviews", reviewId), reviewPayload);
        setMessage("Review updated successfully!");
      } else {
        const newReview = await addDoc(collection(db, "mentorReviews"), {
          ...reviewPayload,
          createdAt: serverTimestamp(),
        });
        setReviewId(newReview.id);
        setAlreadyReviewed(true);
        setMessage("Review submitted successfully!");
      }

      setShowModal(false); 
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to update review.");
    }
  };

  const handleToggle = (key) => {
    setMatrix((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveMatrix = async () => {
    if (!profile) return;
    try {
      const matrixRef = doc(db, "evaluationMatrix", profile.userId);
      await updateDoc(matrixRef, { matrix, updatedAt: serverTimestamp() });
      alert("Evaluation Matrix updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert("Error updating matrix");
    }
  };

  if (loading) return <p className="mentor-loading">Loading...</p>;
  if (!profile) return <p className="mentor-loading">Profile not found</p>;

  return (
    <div className="mentor-details-container">
      <h2>Startup Pitch Details</h2>

      {/* PROFILE INFO */}
      <div className="card">
        <h3>Profile Information</h3>
        <p><b>Startup Name:</b> {profile.name}</p>
        <p><b>Industry:</b> {profile.industry}</p>
        <p><b>USP:</b> {displayValue(profile.usp)}</p>
        <p><b>Mission:</b> {displayValue(profile.mission)}</p>
        <p><b>Vision:</b> {profile.vision}</p>
      </div>

      {/* PITCH INFO */}
      <div className="card">
        <h3>Pitch Information</h3>
        {pitch ? (
          <>
            <p><b>Customer Pain Points:</b> {displayValue(pitch.painPoints)}</p>
            <p><b>Problem:</b> {displayValue(pitch.problem)}</p>
            <p><b>Solution:</b> {displayValue(pitch.solution)}</p>
            <p><b>Market:</b> {displayValue(pitch.market)}</p>
            <p><b>Revenue:</b> {displayValue(pitch.revenue)}</p>
          </>
        ) : <p className="no-data">Data not provided by founder</p>}
      </div>

      {/* TRL & FUNDING */}
      <div className="card">
        <h3>TRL Level</h3>
        <p className="trl-badge">TRL {trlLevel}</p>
      </div>

      <div className="card">
        <h3>Funding Information</h3>
        {funding ? (
          <button className="primary-btn" onClick={() => setShowFundingModal(true)}>View Funding Details</button>
        ) : <p className="no-data">Data not provided by founder</p>}
      </div>

      {/* MATRIX */}
      <div className="card">
        <h3>Evaluation Matrix</h3>
        {matrix ? (
          <>
            {Object.entries(matrix).map(([key, value]) => (
              <div key={key} className={`matrix-item ${value ? "matrix-true" : "matrix-false"}`}>
                <strong>{key}</strong>
                {isEditing ? (
                  <button onClick={() => handleToggle(key)} className={`toggle-btn ${value ? "btn-green" : "btn-red"}`}>
                    {value ? "True" : "False"}
                  </button>
                ) : <span>{value ? "✔ Yes" : "✖ No"}</span>}
              </div>
            ))}
            <div className="matrix-actions">
              {!isEditing ? <button onClick={() => setIsEditing(true)} className="primary-btn">Edit Matrix</button> : (
                <>
                  <button onClick={handleSaveMatrix} className="primary-btn">Save Changes</button>
                  <button onClick={() => setIsEditing(false)} className="secondary-btn">Cancel</button>
                </>
              )}
            </div>
          </>
        ) : <p className="no-data">Data not provided</p>}
      </div>

      {/* REVIEW SECTION */}
      <div className="card">
        <h3>Mentor Review</h3>
        {alreadyReviewed && (
          <div className="review-display">
            <p><b>Status:</b> {decision}</p>
            <p><b>Feedback:</b> {feedback}</p>
            {reviewDate && <p><b>Date:</b> {new Date(reviewDate.seconds * 1000).toLocaleString()}</p>}
          </div>
        )}
        <button onClick={() => setShowModal(true)} className="primary-btn">{alreadyReviewed ? "Edit Review" : "Give Review"}</button>
        {message && <p className="message-text">{message}</p>}
      </div>

      {/* COMPARISON MODAL */}
      {/* COMPARISON MODAL */}
{showModal && (
  <div className="modal-overlay">
    <div className="modal comparison-modal">
      <div className="modal-header">
        <h3>Compare & Review Pitch</h3>
        {/* Reset on close button click */}
        <button 
          className="close-btn" 
          onClick={() => {
            setShowModal(false);
            setSelectedStartup(null);
          }}
        >
          ×
        </button>
      </div>

      <div className="startup-selector">
        <label><b>Compare with Successful Startup:</b> </label>
        <select 
          onChange={(e) => setSelectedStartup(pastStartups.find(s => s.id === e.target.value))}
          className="review-select"
          defaultValue=""
        >
          <option value="" disabled>-- Choose a Reference --</option>
          {pastStartups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="comparison-grid">
        {/* Left Column: Reference Startup */}
        <div className="comparison-column left-col">
          <h4>{selectedStartup ? `Startup Name : ${selectedStartup.name}` : "Success Case"}</h4>
          <div className="scroll-content">
            {selectedStartup ? (
              <>
                <p><b>Pain Points:</b> {selectedStartup.painPoints}</p>
                <p><b>Problem:</b> {selectedStartup.problem}</p>
                <p><b>Solution:</b> {selectedStartup.solution}</p>
                <p><b>Market:</b> {selectedStartup.market}</p>
                <p><b>Revenue:</b> {selectedStartup.revenue}</p>
              </>
            ) : (
              <p className="hint">Please select a reference startup to start the comparison.</p>
            )}
          </div>
        </div>

        {/* Right Column: Current Founder Pitch */}
        <div className="comparison-column right-col">
          <h4>Current Pitch : ({profile.name})</h4>
          <div className="scroll-content">
            <p><b>Pain Points:</b> {displayValue(pitch?.painPoints)}</p>
            <p><b>Problem:</b> {displayValue(pitch?.problem)}</p>
            <p><b>Solution:</b> {displayValue(pitch?.solution)}</p>
            <p><b>Market:</b> {displayValue(pitch?.market)}</p>
            <p><b>Revenue:</b> {displayValue(pitch?.revenue)}</p>
          </div>
        </div>
      </div>

     
      {/* AI Comparison Logic */}
{selectedStartup && pitch && (
  <div className={`common-highlights-card match-${findCommonTerms(selectedStartup.solution, pitch.solution).level.toLowerCase()}`}>
    <div className="analysis-header">
      <h4>💡 Model Alignment Analysis</h4>
      <span className="match-badge">
        {findCommonTerms(selectedStartup.solution, pitch.solution).score}% Match
      </span>
    </div>
    
    <p><b>Core Business Overlap:</b></p>
    <p className="keywords-list">
      {findCommonTerms(selectedStartup.solution, pitch.solution).keywords}
    </p>

    <div className="mentor-hint">
      {findCommonTerms(selectedStartup.solution, pitch.solution).score >= 50 ? (
        <small>🔥 This startup follows a proven pattern. Focus on their competitive advantage.</small>
      ) : (
        <small>✨ The current model deviates significantly from established market benchmarks</small>
      )}
    </div>
  </div>
)}

      {/* Review Input Section */}
      <div className="review-input-section">
        <label><b>Mentor Feedback</b></label>
        <textarea
          placeholder="Write your review based on the comparison..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="review-textarea"
        />
        <div className="modal-footer">
          <div className="status-group">
            <label>Status: </label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="review-select"
            >
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="btn-group">
            <button onClick={handleReviewSubmit} className="primary-btn">
              {alreadyReviewed ? "Update Review" : "Submit Review"}
            </button>
            {/* ✅ Reset on Cancel button click */}
            <button 
              onClick={() => {
                setShowModal(false);
                setSelectedStartup(null);
              }} 
              className="secondary-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* FUNDING MODAL */}
      {showFundingModal && funding && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
                <h3>Startup Funding Details</h3>

            </div>
            <p><b>Funds Available:</b> {displayValue(funding.availableFund)}</p>
            <p><b>Funds Required:</b> {displayValue(funding.requiredFund)}</p>
            <p><b>Equity Offered:</b> {displayValue(funding.equityOffered)}%</p>
            <p><b>Fund Usage:</b> {displayValue(funding.fundUsage)}</p>
            <p><b>Expected ROI:</b> {displayValue(funding.expectedROI)}</p>
            <p><b>Interest Rate:</b> {displayValue(funding.interestRate)}</p>
            <p><b>Valuation Basis:</b> {displayValue(funding.valuationBasis)}</p>
            <div className="modal-footer">
                <button className="secondary-btn" onClick={() => setShowFundingModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}