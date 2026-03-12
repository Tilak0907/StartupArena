import { useEffect, useState } from "react";
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

export default function MentorReview() {

  const [mentors, setMentors] = useState([]);
  const [submittedMentors, setSubmittedMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState("");
  const [profileId, setProfileId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [hasPitch,setHasPitch] = useState(false);

  const navigate = useNavigate();

  /* ===============================
     1️⃣ Set founder profileId (UID)
  =============================== */

  useEffect(() => {

    const currentUser = auth.currentUser;

    if (currentUser) {
      setProfileId(currentUser.uid);
    }

  }, []);

  /* ===============================
     2️⃣ Fetch mentors list
  =============================== */

  useEffect(() => {

    const fetchMentors = async () => {

      const snapshot = await getDocs(collection(db, "users"));

      const mentorList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(user => user.role === "mentor");

      setMentors(mentorList);

    };

    fetchMentors();

  }, []);

/* Check if pitch has been submitted */

useEffect(() => {

  const checkPitch = async () => {

    const pitchQuery = query(
      collection(db, "pitches"),
      where("userId", "==", auth.currentUser.uid)
    );

    const snapshot = await getDocs(pitchQuery);

    if (!snapshot.empty) {
      setHasPitch(true);
    }

  };

  checkPitch();

}, []);


  /* ===============================
     3️⃣ Fetch mentors already submitted
  =============================== */

  useEffect(() => {

    if (!profileId) return;

    const fetchSubmittedMentors = async () => {

      const q = query(
        collection(db, "mentorAssignments"),
        where("founderId", "==", profileId)
      );

      const snapshot = await getDocs(q);

      const mentorNames = await Promise.all(

        snapshot.docs.map(async (docSnap) => {

          const data = docSnap.data();

          const mentorDoc = await getDoc(
            doc(db, "users", data.mentorId)
          );

          if (mentorDoc.exists()) {
            return mentorDoc.data().name;
          }

          return "Unknown Mentor";

        })

      );

      setSubmittedMentors(mentorNames);

    };

    fetchSubmittedMentors();

  }, [profileId]);

  /* ===============================
     4️⃣ Fetch mentor reviews
  =============================== */

  useEffect(() => {

    if (!profileId) return;

    const fetchReviews = async () => {

      const reviewQuery = query(
        collection(db, "mentorReviews"),
        where("founderId", "==", profileId)
      );

      const reviewSnapshot = await getDocs(reviewQuery);

      const reviewList = await Promise.all(

        reviewSnapshot.docs.map(async (docSnap) => {

          const reviewData = docSnap.data();

          let mentorName = "Unknown Mentor";

          if (reviewData.mentorId) {

            const mentorDoc = await getDoc(
              doc(db, "users", reviewData.mentorId)
            );

            if (mentorDoc.exists()) {
              mentorName = mentorDoc.data().name;
            }

          }

          return {
            id: docSnap.id,
            mentorName,
            ...reviewData
          };

        })

      );

      setReviews(reviewList);

    };

    fetchReviews();

  }, [profileId]);

  /* ===============================
     5️⃣ Assign mentor
  =============================== */

  const handleSubmit = async () => {

    if (!selectedMentor) {
      setMessage("Please select a mentor");
      return;
    }

    try {

      setLoading(true);
      setMessage("");

      const response = await fetch(
        "https://startuparena.onrender.com/api/mentor/assign",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
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

  /* ===============================
     6️⃣ Redirect to chat
  =============================== */

  const startChat = () => {
    navigate("/chat");
  };

  return (

    <div className="container">

      {/* Submit Pitch */}

      <div className="card">

        <h2>Submit Pitch to Mentor</h2>

        <select
          value={selectedMentor}
          onChange={(e) => setSelectedMentor(e.target.value)}
        >

          <option value="" disabled>Select Mentor</option>

          {mentors
            .filter(m => m.name && m.name.trim() !== "")
            .map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))
          }

        </select>

        <button onClick={handleSubmit} disabled={loading || !hasPitch}>
          {loading ? "Submitting..." : "Submit to Mentor"}
        </button>

        {!hasPitch &&(
          <p>you must submit your pitch</p>
        )}

        {message && (
          <p style={{ marginTop: "10px", color: "green" }}>
            {message}
          </p>
        )}

      </div>

      {/* Already Submitted */}

      <div className="card">

        <h3>Already Submitted to These Mentors</h3>

        {submittedMentors.length === 0 ? (
          <p>No mentors yet.</p>
        ) : (

          submittedMentors.map((name, index) => (
            <p key={index}>{name}</p>
          ))

        )}

      </div>

      {/* Mentor Reviews */}

      <div className="card">

        <h3>Mentor Reviews</h3>

        {reviews.length === 0 ? (
          <p>No reviews received yet.</p>
        ) : (

          reviews.map((review) => (

            <div
              key={review.id}
              className="review-card"
              onClick={() => setSelectedReview(review)}
            >

              <p><b>Mentor:</b> {review.mentorName}</p>

              <p>
                <b>Status:</b>{" "}
                <span
                  style={{
                    color:
                      review.status === "approved"
                        ? "green"
                        : review.status === "rejected"
                        ? "red"
                        : "orange"
                  }}
                >
                  {review.status}
                </span>
              </p>

              <p><b>Click to view review</b></p>

            </div>

          ))

        )}

      </div>

      {/* Review Modal */}

      {selectedReview && (

        <div className="review-modal">

          <div className="review-modal-content">

            <h3>Mentor Feedback</h3>

            <p><b>Mentor:</b> {selectedReview.mentorName}</p>

            <p><b>Status:</b> {selectedReview.status}</p>

            <p><b>Feedback:</b></p>

            <p>{selectedReview.feedback}</p>

            {selectedReview.createdAt && (
              <p style={{ fontSize: "13px", color: "#777" }}>
                <b>Reviewed on:</b>{" "}
                {new Date(
                  selectedReview.createdAt.seconds * 1000
                ).toLocaleString()}
              </p>
            )}

            <br />

            <button onClick={startChat}>
              Ask Mentor (Start Chat)
            </button>

            <button
              onClick={() => setSelectedReview(null)}
              style={{ marginLeft: "10px" }}
            >
              Close
            </button>

          </div>

        </div>

      )}

    </div>

  );

}