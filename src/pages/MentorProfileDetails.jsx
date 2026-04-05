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

  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [decision, setDecision] = useState("pending");

  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [reviewId, setReviewId] = useState(null);
  const [reviewDate, setReviewDate] = useState(null);

  const [message, setMessage] = useState("");

  /* ===============================
      NEW STATES FOR FUNDING
  ================================ */
  const [funding, setFunding] = useState(null);
  const [showFundingModal, setShowFundingModal] = useState(false);

  /* helper function */
  const displayValue = (value) => {
    if (value === undefined || value === null || value === "") {
      return "Data not provided by the founder";
    }
    return value;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRef = doc(db, "profiles", id);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
          setLoading(false);
          return;
        }

        const profileData = profileSnap.data();
        setProfile(profileData);

        /* FETCH PITCH */
        const pitchQuery = query(
          collection(db, "pitches"),
          where("userId", "==", profileData.userId)
        );
        const pitchSnapshot = await getDocs(pitchQuery);
        if (!pitchSnapshot.empty) {
          setPitch(pitchSnapshot.docs[0].data());
        }

        /* FETCH TRL */
        const trlDoc = await getDoc(doc(db, "trlLevels", profileData.userId));
        if (trlDoc.exists()) {
          setTrlLevel(trlDoc.data().level);
        }

        /* FETCH MATRIX */
        const matrixDoc = await getDoc(doc(db, "evaluationMatrix", profileData.userId));
        if (matrixDoc.exists()) {
          setMatrix(matrixDoc.data().matrix);
        }

        /* FETCH FUNDING DETAILS */
        const fundingQuery = query(
          collection(db, "fundingDetails"),
          where("userId", "==", profileData.userId)
        );
        const fundingSnapshot = await getDocs(fundingQuery);
        if (!fundingSnapshot.empty) {
          setFunding(fundingSnapshot.docs[0].data());
        }

        /* FETCH EXISTING REVIEW */
        const reviewQuery = query(
          collection(db, "mentorReviews"),
          where("profileId", "==", id),
          where("mentorId", "==", auth.currentUser.uid)
        );
        const reviewSnapshot = await getDocs(reviewQuery);

        if (!reviewSnapshot.empty) {
          const reviewDoc = reviewSnapshot.docs[0];
          setAlreadyReviewed(true);
          setReviewId(reviewDoc.id);
          const reviewData = reviewDoc.data();
          setFeedback(reviewData.feedback);
          setDecision(reviewData.status);
          setReviewDate(reviewData.createdAt);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  /* MATRIX TOGGLE */
  const handleToggle = (key) => {
    setMatrix((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  /* SAVE MATRIX */
  const handleSaveMatrix = async () => {
    if (!profile) return;
    try {
      const matrixRef = doc(db, "evaluationMatrix", profile.userId);
      await updateDoc(matrixRef, {
        matrix: matrix,
        updatedAt: serverTimestamp()
      });
      alert("Evaluation Matrix updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert("Error updating matrix");
    }
  };

  /* SUBMIT / UPDATE REVIEW */
  const handleReviewSubmit = async () => {
    if (!feedback) {
      setMessage("Please enter feedback");
      return;
    }

    try {
      if (alreadyReviewed) {
        const reviewRef = doc(db, "mentorReviews", reviewId);
        await updateDoc(reviewRef, {
          feedback,
          status: decision,
          updatedAt: serverTimestamp()
        });
        setMessage("Review updated successfully!");
      } else {
        const newReview = await addDoc(collection(db, "mentorReviews"), {
          profileId: id,
          mentorId: auth.currentUser.uid,
          feedback,
          status: decision,
          createdAt: serverTimestamp()
        });
        setReviewId(newReview.id);
        setAlreadyReviewed(true);
        setMessage("Review submitted successfully!");
      }
      setShowModal(false);
    } catch (error) {
      console.error(error);
      setMessage("Error submitting review");
    }
  };

  if (loading) return <p className="mentor-loading">Loading...</p>;
  if (!profile) return <p className="mentor-loading">Profile not found</p>;

  return (
    <div className="mentor-details-container">
      <h2>Startup Pitch Details</h2>

      {/* PROFILE */}
      <div className="card">
        <h3>Profile Information</h3>
        <p><b>Startup Name:</b> {profile.name}</p>
        <p><b>Industry:</b> {profile.industry}</p>
        <p><b>USP:</b> {displayValue(profile.usp)}</p>
        <p><b>Mission:</b> {displayValue(profile.mission)}</p>
        <p><b>Vision:</b> {profile.vision}</p>
      </div>

      {/* PITCH */}
      <div className="card">
        <h3>Pitch Information</h3>
        {pitch ? (
          <>
            <p><b>Problem:</b> {pitch.problem}</p>
            <p><b>Solution:</b> {pitch.solution}</p>
            <p><b>Market:</b> {pitch.market}</p>
            <p><b>Revenue:</b> {pitch.revenue}</p>
          </>
        ) : (
          <p className="no-data">Data not provided by founder</p>
        )}
      </div>

      {/* TRL */}
      <div className="card">
        <h3>TRL Level</h3>
        <p className="trl-badge">TRL {trlLevel}</p>
      </div>

      {/* FUNDING SECTION */}
      <div className="card">
        <h3>Funding Information</h3>
        {funding ? (
          <button className="primary-btn" onClick={() => setShowFundingModal(true)}>
            View Funding Details
          </button>
        ) : (
          <p className="no-data">Data not provided by founder</p>
        )}
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
                  <button
                    onClick={() => handleToggle(key)}
                    className={`toggle-btn ${value ? "btn-green" : "btn-red"}`}
                  >
                    {value ? "True" : "False"}
                  </button>
                ) : (
                  <span>{value ? "✔ Yes" : "✖ No"}</span>
                )}
              </div>
            ))}
            <div className="matrix-actions">
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="primary-btn">
                  Edit Matrix
                </button>
              ) : (
                <>
                  <button onClick={handleSaveMatrix} className="primary-btn">Save Changes</button>
                  <button onClick={() => setIsEditing(false)} className="secondary-btn">Cancel</button>
                </>
              )}
            </div>
          </>
        ) : (
          <p className="no-data">Data not provided by founder</p>
        )}
      </div>

      {/* REVIEW */}
      <div className="card">
        <h3>Mentor Review</h3>
        {alreadyReviewed && (
          <>
            <p><b>Status:</b> {decision}</p>
            <p><b>Feedback:</b> {feedback}</p>
            {reviewDate && (
              <p>
                <b>Date:</b> {new Date(reviewDate.seconds * 1000).toLocaleString()}
              </p>
            )}
          </>
        )}
        <button onClick={() => setShowModal(true)} className="primary-btn">
          {alreadyReviewed ? "Edit Review" : "Give Review"}
        </button>
        {message && <p className="message-text">{message}</p>}
      </div>

      {/* REVIEW MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{alreadyReviewed ? "Edit Review" : "Submit Review"}</h3>
            <textarea
              placeholder="Enter your feedback..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="review-textarea"
            />
            <label><b>Status</b></label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="review-select"
            >
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="modal-buttons">
              <button onClick={handleReviewSubmit} className="primary-btn">
                {alreadyReviewed ? "Update Review" : "Submit Review"}
              </button>
              <button onClick={() => setShowModal(false)} className="secondary-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* FUNDING MODAL */}
      {showFundingModal && funding && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Startup Funding Details</h3>
            <p><b>Funds Available:</b> {displayValue(funding.availableFund)}</p>
            <p><b>Funds Required:</b> {displayValue(funding.requiredFund)}</p>
            <p><b>Equity Offered:</b> {displayValue(funding.equityOffered)}%</p>
            <p><b>Fund Usage:</b></p>
            <p>{displayValue(funding.fundUsage)}</p>
            <p><b>Expected ROI:</b> {displayValue(funding.expectedROI)}</p>
            <p><b>Interest Rate:</b> {displayValue(funding.interestRate)}</p>
            <p><b>Valuation Basis:</b></p>
            <p>{displayValue(funding.valuationBasis)}</p>
            <button className="secondary-btn" onClick={() => setShowFundingModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}