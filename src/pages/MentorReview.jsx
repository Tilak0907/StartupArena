import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/MentorReview.css";

/* ── Custom Searchable Mentor Dropdown ── */
function MentorDropdown({ mentors, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [panelStyle, setPanelStyle] = useState({});
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);

  const filtered = mentors
    .filter(m => m.name && m.name.trim() !== "")
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(m => {
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        (m.expertise || "").toLowerCase().includes(q)
      );
    });

  const selected = mentors.find(m => m.id === value);

  const updatePanelPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
    });
  };

  const handleToggle = () => {
    if (!open) updatePanelPosition();
    setOpen(prev => !prev);
  };

  useEffect(() => {
    if (!open) return;
    const reposition = () => updatePanelPosition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 30);
    }
  }, [open]);

  const handleSelect = (mentor) => {
    onChange(mentor.id);
    setOpen(false);
    setSearch("");
  };

  const panel = open ? createPortal(
    <div className="mentor-dropdown-panel" style={panelStyle} ref={panelRef}>
      <div className="dd-search-wrapper">
        <svg className="dd-search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          ref={searchRef}
          className="dd-search-input"
          type="text"
          placeholder="Search by name or expertise…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="dd-search-clear" onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      <div className="dd-list">
        {filtered.length === 0 ? (
          <div className="dd-empty">No mentors found</div>
        ) : (
          filtered.map(m => (
            <button
              key={m.id}
              type="button"
              className={`dd-item ${value === m.id ? "selected" : ""}`}
              onClick={() => handleSelect(m)}
            >
              <span className="dd-item-name">{m.name}</span>
              <span className="dd-item-expertise">{m.expertise || "Not Specified"}</span>
              {value === m.id && (
                <svg className="dd-item-check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))
        )}
      </div>

      <div className="dd-footer">
        {filtered.length} mentor{filtered.length !== 1 ? "s" : ""}
        {search ? " found" : " available"}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="mentor-dropdown">
      <button
        ref={triggerRef}
        type="button"
        className={`mentor-dropdown-trigger ${open ? "open" : ""}`}
        onClick={handleToggle}
      >
        <span className="mentor-dropdown-value">
          {selected ? (
            <>
              <span className="dd-name">{selected.name}</span>
              <span className="dd-sep">—</span>
              <span className="dd-expertise">{selected.expertise || "Not Specified"}</span>
            </>
          ) : (
            <span className="dd-placeholder">Select Mentor</span>
          )}
        </span>
        <svg
          className={`dd-chevron ${open ? "rotated" : ""}`}
          width="14" height="14" viewBox="0 0 14 14" fill="none"
        >
          <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {panel}
    </div>
  );
}

/* ── Main Component ── */
export default function MentorReview() {
  const [mentors, setMentors] = useState([]);
  const [submittedMentors, setSubmittedMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState("");
  const [profileId, setProfileId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [hasPitch, setHasPitch] = useState(false);
  const [pitchUpdatedAt, setPitchUpdatedAt] = useState(null);
  const [assignments, setAssignments] = useState([]);
  
  // State for Profile Completion (checks the 'profiles' collection)
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setProfileId(currentUser.uid);
      checkProfileStatus(currentUser.uid);
    }
  }, []);

  // UPDATED: Function to check the 'profiles' collection
  const checkProfileStatus = async (uid) => {
    try {
      // Fetches document from the 'profiles' collection using the User UID
      const profileDoc = await getDoc(doc(db, "profiles", uid));
      if (profileDoc.exists()) {
        // If the document exists, we consider the profile details submitted
        setIsProfileComplete(true);
      } else {
        setIsProfileComplete(false);
      }
    } catch (error) {
      console.error("Error checking profile status in 'profiles' collection:", error);
      setIsProfileComplete(false);
    }
  };

  useEffect(() => {
    const fetchMentors = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const mentorList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.role === "mentor");
      setMentors(mentorList);
    };
    fetchMentors();
  }, []);

  useEffect(() => {
    const checkPitch = async () => {
      if (!auth.currentUser) return;
      const pitchQuery = query(
        collection(db, "pitches"),
        where("userId", "==", auth.currentUser.uid)
      );
      const snapshot = await getDocs(pitchQuery);
      if (!snapshot.empty) {
        setHasPitch(true);
        const pitchData = snapshot.docs[0].data();
        if (pitchData.updatedAt) {
          setPitchUpdatedAt(pitchData.updatedAt.seconds);
        }
      }
    };
    checkPitch();
  }, []);

  useEffect(() => {
    if (!profileId) return;
    const fetchSubmittedMentors = async () => {
      const q = query(
        collection(db, "mentorAssignments"),
        where("profileId", "==", profileId)
      );
      const snapshot = await getDocs(q);
      const assignmentList = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setAssignments(assignmentList);

      const mentorNames = await Promise.all(
        assignmentList.map(async (data) => {
          const mentorDoc = await getDoc(doc(db, "users", data.mentorId));
          if (mentorDoc.exists()) return mentorDoc.data().name;
          return "Unknown Mentor";
        })
      );
      const uniqueMentors = [...new Set(mentorNames)];
      setSubmittedMentors(uniqueMentors);
    };
    fetchSubmittedMentors();
  }, [profileId]);

  useEffect(() => {
    if (!profileId) return;
    const fetchReviews = async () => {
      const reviewQuery = query(
        collection(db, "mentorReviews"),
        where("profileId", "==", profileId)
      );
      const reviewSnapshot = await getDocs(reviewQuery);
      const reviewList = await Promise.all(
        reviewSnapshot.docs.map(async (docSnap) => {
          const reviewData = docSnap.data();
          let mentorName = "Unknown Mentor";
          if (reviewData.mentorId) {
            const mentorDoc = await getDoc(doc(db, "users", reviewData.mentorId));
            if (mentorDoc.exists()) mentorName = mentorDoc.data().name;
          }
          return { id: docSnap.id, mentorName, ...reviewData };
        })
      );
      setReviews(reviewList);
    };
    fetchReviews();
  }, [profileId]);

  const handleSubmit = async () => {
    if (!selectedMentor) {
      setMessage("Please select a mentor");
      return;
    }

    // Constraint: Check if profile details exist in the 'profiles' collection
    if (!isProfileComplete) {
      setMessage("Please submit your profile details before submitting a pitch.");
      return;
    }

    const existingAssignment = assignments.find(a => a.mentorId === selectedMentor);
    if (existingAssignment && pitchUpdatedAt) {
      const assignedTime = existingAssignment.createdAt?.seconds;
      if (assignedTime && pitchUpdatedAt <= assignedTime) {
        setMessage("You have already submitted this pitch to this mentor.");
        return;
      }
    }

    try {
      setLoading(true);
      setMessage("");
      const response = await fetch(
        "https://startuparena.onrender.com/api/mentor/assign",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId,
            mentorId: selectedMentor,
            founderId: auth.currentUser.uid
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || "Error submitting pitch");
      } else {
        setMessage("Pitch submitted successfully!");
        setSelectedMentor("");
      }
    } catch (error) {
      console.error(error);
      setMessage("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startChat = () => navigate("/chat");

  return (
    <div className="container">
      <div className="card">
        <h2>Submit Pitch to Mentor</h2>
        <p>The mentor names are displayed with their field of expertise</p>

        <MentorDropdown
          mentors={mentors}
          value={selectedMentor}
          onChange={setSelectedMentor}
        />

        <button 
          onClick={handleSubmit} 
          disabled={loading || !hasPitch || !isProfileComplete}
        >
          {loading ? "Submitting..." : "Submit to Mentor"}
        </button>

        {!hasPitch && (
          <p className="error-notice" style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "10px" }}>
            ❌ You must submit your pitch first.
          </p>
        )}

        {!isProfileComplete && (
          <p className="error-notice" style={{ color: "#e67e22", fontSize: "0.85rem", marginTop: "5px" }}>
            ⚠️ Please submit your profile details to enable submission.
          </p>
        )}

        {message && (
          <p style={{ 
            marginTop: "10px", 
            color: message.includes("successfully") ? "green" : "red" 
          }}>
            {message}
          </p>
        )}
      </div>

      <div className="submitted-mentors-card">
        <h3 className="submitted-mentors-title">
          Already Submitted to These Mentors
        </h3>
        {submittedMentors.length === 0 ? (
          <div className="submitted-mentors-empty">
            <span className="submitted-mentors-empty-icon">🧑‍💼</span>
            <p>No mentors assigned yet.</p>
          </div>
        ) : (
          <div className="submitted-mentors-list">
            {submittedMentors.map((name, index) => (
              <div key={index} className="submitted-mentor-chip">
                <div className="submitted-mentor-avatar">
                  {name.charAt(0).toUpperCase()}
                </div>
                <span className="submitted-mentor-name">{name}</span>
                <span className="submitted-mentor-badge">Submitted</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mentor-reviews">
        <h3 className="mentor-title">Mentor Reviews</h3>
        {reviews.length === 0 ? (
          <p className="mentor-empty">No reviews received yet.</p>
        ) : (
          <div className="mentor-list">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="mentor-item"
                onClick={() => setSelectedReview(review)}
              >
                <div className="mentor-item-header">
                  <span className="mentor-name">{review.mentorName}</span>
                  <span className={`mentor-status ${review.status}`}>
                    {review.status}
                  </span>
                </div>
                <p className="mentor-action-text">Click to view review</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReview && (
        <div className="mentor-modal">
          <div className="mentor-modal-box">
            <h3 className="mentor-modal-title">Mentor Feedback</h3>
            <p><b>Mentor:</b> {selectedReview.mentorName}</p>
            <p>
              <b>Status:</b>{" "}
              <span className={`mentor-status ${selectedReview.status}`}>
                {selectedReview.status}
              </span>
            </p>
            <p className="feedback-label">Feedback:</p>
            <p className="feedback-text">{selectedReview.feedback}</p>
            {selectedReview.createdAt && (
              <p className="review-date">
                Reviewed on:{" "}
                {new Date(selectedReview.createdAt.seconds * 1000).toLocaleString()}
              </p>
            )}
            <div className="mentor-modal-actions">
              <button className="btn-primary" onClick={startChat}>
                Ask Mentor (Start Chat)
              </button>
              <button className="btn-secondary" onClick={() => setSelectedReview(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}