import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/MentorDashboard.css";

export default function MentorDashboard() {

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

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

    const fetchAssignedProfiles = async () => {

      try {

        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const assignmentQuery = query(
          collection(db, "mentorAssignments"),
          where("mentorId", "==", currentUser.uid)
        );

        const assignmentSnapshot = await getDocs(assignmentQuery);

        const profileMap = new Map();

        for (const assignmentDoc of assignmentSnapshot.docs) {

          const assignmentData = assignmentDoc.data();

          const profileRef = doc(db, "profiles", assignmentData.profileId);
          const profileSnap = await getDoc(profileRef);

          if (!profileSnap.exists()) continue;

          const profileData = profileSnap.data();

          let status = assignmentData.status;

          const reviewQuery = query(
            collection(db, "mentorReviews"),
            where("profileId", "==", profileData.userId),
            where("mentorId", "==", currentUser.uid)
          );

          const reviewSnapshot = await getDocs(reviewQuery);

          if (!reviewSnapshot.empty) {
            status = reviewSnapshot.docs[0].data().status;
          }

          const profileId = profileSnap.id;

          if (profileMap.has(profileId)) {

            const existingProfile = profileMap.get(profileId);

            profileMap.set(profileId, {
              ...existingProfile,
              status: "Updated Pitch Submitted"
            });

          } else {

            profileMap.set(profileId, {
              id: profileSnap.id,
              assignmentId: assignmentDoc.id,   // ⭐ Needed for deletion
              ...profileData,
              status
            });

          }

        }

        setProfiles(Array.from(profileMap.values()));

      } catch (error) {
        console.error("Error fetching assigned profiles:", error);
      } finally {
        setLoading(false);
      }

    };

    fetchAssignedProfiles();

  }, []);

  /* ======================================================
     DELETE PROFILE FROM DASHBOARD
  ====================================================== */

  const deleteProfile = async (profile) => {

    try {

      await deleteDoc(doc(db, "mentorAssignments", profile.assignmentId));

      setProfiles(prev =>
        prev.filter(p => p.id !== profile.id)
      );

    } catch (error) {

      console.error("Error deleting profile:", error);

    }

  };

  /* ======================================================
     DOWNLOAD STARTUP REPORT
  ====================================================== */

  const downloadReport = async (profile) => {

    try {

      let report = "";

      report += "=== STARTUP PROFILE DETAILS ===\n";
      report += `Startup Name: ${profile.name}\n`;
      report += `Company Name: ${profile.companyName}\n`;
      report += `Industry: ${profile.industry}\n`;
      report += `Vision: ${profile.vision}\n\n`;

      const pitchQuery = query(
        collection(db, "pitches"),
        where("userId", "==", profile.userId)
      );

      const pitchSnapshot = await getDocs(pitchQuery);

      if (!pitchSnapshot.empty) {

        const pitch = pitchSnapshot.docs[0].data();

        report += "=== PITCH DETAILS ===\n";
        report += `Problem: ${pitch.problem}\n\n`;
        report += `Solution: ${pitch.solution}\n\n`;
        report += `Market: ${pitch.market}\n\n`;
        report += `Revenue: ${pitch.revenue}\n\n`;

      }

      const fundingQuery = query(
        collection(db, "fundingDetails"),
        where("userId", "==", profile.userId)
      );

      const fundingSnapshot = await getDocs(fundingQuery);

      if (!fundingSnapshot.empty) {

        const funding = fundingSnapshot.docs[0].data();

        report += "=== FUNDING DETAILS ===\n";
        report += `Funds Available: ${funding.availableFund || "Not provided"}\n`;
        report += `Funds Required: ${funding.requiredFund || "Not provided"}\n`;
        report += `Equity Offered: ${funding.equityOffered || "Not provided"}\n`;
        report += `Fund Usage: ${funding.fundUsage || "Not provided"}\n`;
        report += `Expected ROI: ${funding.expectedROI || "Not provided"}\n`;
        report += `Interest Rate: ${funding.interestRate || "Not provided"}\n`;
        report += `Valuation Basis: ${funding.valuationBasis || "Not provided"}\n`;

      }

      const blob = new Blob([report], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${profile.name}_startup_report.txt`;
      a.click();

      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error generating report:", error);
    }

  };

  if (loading) return <p className="mentor-loading">Loading...</p>;

  return (

    <div className="mentor-dashboard">

      <h2 className="mentor-title">Mentor Dashboard</h2>

      {profiles.length === 0 ? (

        <p className="mentor-empty">No assigned pitches.</p>

      ) : (

        profiles.map((profile) => (

          <div key={profile.id} className="mentor-card">

            <div onClick={() => navigate(`/mentor/profile/${profile.id}`)}>

              <h3>{profile.name}</h3>

              <p><b>Industry:</b> {profile.industry}</p>

              <p><b>Vision:</b> {profile.vision}</p>

              <p><b>Status:</b> {profile.status}</p>

            </div>

            <div className="mentor-card-actions">

            <button
              className="btn-download"
              onClick={() => downloadReport(profile)}
            >
              Download Startup Report
            </button>

            {/* ⭐ NEW DELETE BUTTON */}

            <button
              className="btn-delete"
              onClick={() => deleteProfile(profile)}
            >
              Delete
            </button>
            </div>

          </div>

        ))

      )}

    </div>

  );

}