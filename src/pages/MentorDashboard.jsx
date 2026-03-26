import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
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

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */

const AVATAR_COUNT = 6;

const avatarFor = (name = "") => ({
  index:  name.charCodeAt(0) % AVATAR_COUNT,
  letter: name[0]?.toUpperCase() || "?",
});

const statusClass = (s = "") => {
  const l = s.toLowerCase();
  if (l.includes("updated") || l.includes("submitted")) return "updated";
  if (l.includes("approved")) return "approved";
  if (l.includes("rejected")) return "rejected";
  if (l.includes("reviewed")) return "reviewed";
  return "pending";
};

const statusLabel = (s = "") => s || "Pending";

const FILTERS = [
  "All",
  "Pending",
  "Reviewed",
  "Approved",
  "Rejected",
  "Updated Pitch Submitted",
];

/* ══════════════════════════════════════
   SKELETON CARD
══════════════════════════════════════ */
function SkeletonCard() {
  return (
    <div className="md-skel">
      <div className="md-skel-row">
        <div className="md-skel-line md-skel-avatar" />
        <div className="md-skel-col">
          <div className="md-skel-line md-skel-w60" />
          <div className="md-skel-line md-skel-w40" />
        </div>
      </div>
      <div className="md-skel-line md-skel-w100" />
      <div className="md-skel-line md-skel-w80"  />
      <div className="md-skel-btn-row">
        <div className="md-skel-line md-skel-btn md-skel-btn--wide" />
        <div className="md-skel-line md-skel-btn md-skel-btn--sm"   />
        <div className="md-skel-line md-skel-btn md-skel-btn--xs"   />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function MentorDashboard() {
  const [profiles, setProfiles]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [viewMode, setViewMode]         = useState("grid");
  const [toDelete, setToDelete]         = useState(null);
  const navigate = useNavigate();

  /* ── Current user email ── */
 const [userEmail, setUserEmail] = useState("");

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      setUserEmail(user.email);
    } else {
      setUserEmail("");
    }
  });

  return () => unsubscribe();
}, []);

  /* ── Visit tracking ── */
  useEffect(() => {
    const alreadyTracked = sessionStorage.getItem("visitTracked");
    if (!alreadyTracked) {
      fetch("https://startuparena.onrender.com/track-visit", { method: "POST" });
      sessionStorage.setItem("visitTracked", "true");
    }
  }, []);

  /* ── Fetch assigned profiles ── */
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
          const profileRef  = doc(db, "profiles", assignmentData.profileId);
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
            profileMap.set(profileId, {
              ...profileMap.get(profileId),
              status: "Updated Pitch Submitted",
            });
          } else {
            profileMap.set(profileId, {
              id:           profileSnap.id,
              assignmentId: assignmentDoc.id,
              ...profileData,
              status,
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

  /* ── Delete ── */
  const confirmDelete = (e, profile) => {
    e.stopPropagation();
    setToDelete(profile);
  };

  const deleteProfile = async () => {
    if (!toDelete) return;
    try {
      await deleteDoc(doc(db, "mentorAssignments", toDelete.assignmentId));
      setProfiles(prev => prev.filter(p => p.id !== toDelete.id));
    } catch (error) {
      console.error("Error deleting profile:", error);
    } finally {
      setToDelete(null);
    }
  };

  /* ── Download report ── */
  const downloadReport = async (e, profile) => {
    e.stopPropagation();
    try {
      let report = "";
      report += "=== STARTUP PROFILE DETAILS ===\n";
      report += `Startup Name: ${profile.name}\n`;
      report += `Company Name: ${profile.companyName}\n`;
      report += `Industry: ${profile.industry}\n`;
      report += `Vision: ${profile.vision}\n\n`;

      const pitchSnapshot = await getDocs(
        query(collection(db, "pitches"), where("userId", "==", profile.userId))
      );
      if (!pitchSnapshot.empty) {
        const pitch = pitchSnapshot.docs[0].data();
        report += "=== PITCH DETAILS ===\n";
        report += `Problem: ${pitch.problem}\n\nSolution: ${pitch.solution}\n\nMarket: ${pitch.market}\n\nRevenue: ${pitch.revenue}\n\n`;
      }

      const fundingSnapshot = await getDocs(
        query(collection(db, "fundingDetails"), where("userId", "==", profile.userId))
      );
      if (!fundingSnapshot.empty) {
        const funding = fundingSnapshot.docs[0].data();
        report += "=== FUNDING DETAILS ===\n";
        report += `Funds Available: ${funding.availableFund  || "Not provided"}\n`;
        report += `Funds Required: ${funding.requiredFund    || "Not provided"}\n`;
        report += `Equity Offered: ${funding.equityOffered   || "Not provided"}\n`;
        report += `Fund Usage: ${funding.fundUsage           || "Not provided"}\n`;
        report += `Expected ROI: ${funding.expectedROI       || "Not provided"}\n`;
        report += `Interest Rate: ${funding.interestRate     || "Not provided"}\n`;
        report += `Valuation Basis: ${funding.valuationBasis || "Not provided"}\n`;
      }

      const blob = new Blob([report], { type: "text/plain" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${profile.name}_startup_report.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  /* ── Derived data ── */
  const filtered = profiles.filter(p => {
    const matchSearch =
      (p.name        || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.industry    || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.companyName || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filterStatus === "All" ||
      (p.status || "").toLowerCase().includes(filterStatus.toLowerCase());
    return matchSearch && matchFilter;
  });

  const stats = {
    total:    profiles.length,
    reviewed: profiles.filter(p => ["reviewed", "approved"].includes(statusClass(p.status))).length,
    updated:  profiles.filter(p => statusClass(p.status) === "updated").length,
  };

  /* ── Card renderer ── */
  const renderCard = (profile) => {
    const av = avatarFor(profile.name);
    const sc = statusClass(profile.status);

    return (
      <div
        key={profile.id}
        className="md-card"
        onClick={() => navigate(`/mentor/profile/${profile.id}`)}
      >
        <div className="md-card-top">
          <div className={`md-card-avatar md-card-avatar--${av.index}`}>
            {av.letter}
          </div>
          <div className="md-card-meta">
            <div className="md-card-name">{profile.name}</div>
          </div>
          <span className={`md-status-pill ${sc}`}>{statusLabel(profile.status)}</span>
        </div>

        <div className="md-card-body">
          <p className="md-card-vision">
            {profile.vision || "No vision statement provided."}
          </p>
          <div className="md-card-tags">
            {profile.industry && (
              <span className="md-tag">{profile.industry}</span>
            )}
          </div>
        </div>

        <div className="md-card-divider" />

        <div className="md-card-actions" onClick={e => e.stopPropagation()}>
          <button
            className="md-btn md-btn-primary"
            onClick={() => navigate(`/mentor/profile/${profile.id}`)}
          >
            View Profile
          </button>

          <button
            className="md-btn md-btn-ghost"
            title="Download Report"
            onClick={(e) => downloadReport(e, profile)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Report
          </button>

          <button
            className="md-btn md-btn-danger"
            title="Remove"
            onClick={(e) => confirmDelete(e, profile)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  return (
    <div className="md-root">
      <div className="md-blob md-blob-1" />
      <div className="md-blob md-blob-2" />

      <div className="md-wrap">

        {/* ── NAV ── */}
        <nav className="md-nav">
          <div className="md-nav-brand">
            <div className="md-nav-brand-dot" />
            StartupArena
          </div>

          {/* ── LOGIN STATUS ── */}
          <div className="md-nav-right">
            <span className="md-nav-badge">Mentor Portal</span>
          </div>
        </nav>

          

        {/* ── HEADER ── */}
       <div className="md-header-top">
  <h1>Mentor <span>Dashboard</span></h1>
  <div className="md-login-status">
    <span className="md-login-label">Logged in</span>
    <span className="md-login-email">{userEmail}</span>
  </div>
</div>

        {/* ── STATS ── */}
        <div className="md-stats">
          <div className="md-stat">
            <span className="md-stat-val md-stat-val--total">{stats.total}</span>
            <span className="md-stat-label">Total Assigned</span>
          </div>
          <div className="md-stat">
            <span className="md-stat-val md-stat-val--reviewed">{stats.reviewed}</span>
            <span className="md-stat-label">Reviewed</span>
          </div>
          <div className="md-stat">
            <span className="md-stat-val md-stat-val--updated">{stats.updated}</span>
            <span className="md-stat-label">Pitch Updated</span>
          </div>
        </div>

        {/* ── TOOLBAR ── */}
        <div className="md-toolbar">
          <div className="md-search-wrap">
            <span className="md-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              className="md-search"
              placeholder="Search startups…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── CARDS ── */}
        {loading ? (
          <div className="md-grid">
            {[1, 2, 3, 4, 5, 6].map(n => <SkeletonCard key={n} />)}
          </div>
        ) : (
          <div className={viewMode === "grid" ? "md-grid" : "md-list"}>
            {filtered.length === 0 ? (
              <div className="md-empty">
                <div className="md-empty-icon">🔍</div>
                <h3>No pitches found</h3>
                <p>
                  {search || filterStatus !== "All"
                    ? "Try adjusting your search."
                    : "You have no assigned pitches yet."}
                </p>
              </div>
            ) : (
              filtered.map(p => renderCard(p))
            )}
          </div>
        )}
      </div>

      {/* ── DELETE CONFIRM MODAL ── */}
      {toDelete && (
        <div className="md-modal-bg" onClick={() => setToDelete(null)}>
          <div className="md-modal" onClick={e => e.stopPropagation()}>
            <h3>Remove Startup?</h3>
            <p>
              This will remove <strong>{toDelete.name}</strong> from your
              dashboard.
            </p>
            <div className="md-modal-btns">
              <button className="md-btn md-btn-ghost"  onClick={() => setToDelete(null)}>Cancel</button>
              <button className="md-btn md-btn-danger" onClick={deleteProfile}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}