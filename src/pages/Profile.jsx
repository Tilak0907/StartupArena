import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";

export default function Profile() {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [vision, setVision] = useState("");
  const [mission, setMission] = useState("");
  const [usp, setUsp] = useState("");
  const [loading, setLoading] = useState(true);
  const [isExistingProfile, setIsExistingProfile] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  
  const navigate = useNavigate();

  /* ── Toast Helper ── */
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  /* -------------------- FETCH PROFILE -------------------- */
  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const profileRef = doc(db, "profiles", auth.currentUser.uid);
        const snap = await getDoc(profileRef);

        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || "");
          setIndustry(data.industry || "");
          setVision(data.vision || "");
          setMission(data.mission || "");
          setUsp(data.usp || "");
          setIsExistingProfile(true);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        showToast("Error loading profile data.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  /* -------------------- SAVE / UPDATE PROFILE -------------------- */
  const saveProfile = async () => {
    // STRICT VALIDATION
    if (
      !name.trim() || 
      !industry.trim() || 
      !vision.trim() || 
      !mission.trim() || 
      !usp.trim()
    ) {
      showToast("All fields are mandatory. Please fill in everything.", "error");
      return;
    }

    try {
      await setDoc(doc(db, "profiles", auth.currentUser.uid), {
        userId: auth.currentUser.uid,
        name: name.trim(),
        industry: industry.trim(),
        vision: vision.trim(),
        mission: mission.trim(),
        usp: usp.trim(),
        updatedAt: new Date(),
      });

      showToast(
        isExistingProfile
          ? "Profile updated successfully!"
          : "Profile created successfully!",
        "success"
      );

      setIsExistingProfile(true);
    } catch (err) {
      console.error("Profile save failed:", err);
      showToast("Failed to save profile. Please try again.", "error");
    }
  };

  /* -------------------- LOADING -------------------- */
  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  /* -------------------- UI -------------------- */
  return (
    <div className="container profile-page">
      {/* ── Toast Notification UI ── */}
      {toast.show && (
        <div className={`toast-container ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="card">
        <h2>Startup Profile</h2>

        {isExistingProfile ? (
          <p className="subtitle">Update your startup details below.</p>
        ) : (
          <p className="subtitle">Please complete your profile to continue.</p>
        )}

        <div className="form-group">
          <label>Startup Name *</label>
          <input
            placeholder="Enter startup name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Industry *</label>
          <input
            placeholder="e.g. FinTech, HealthTech, SaaS"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Unique Selling Proposition (USP) *</label>
          <input
            placeholder="What makes your startup unique?"
            value={usp}
            onChange={(e) => setUsp(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Mission Statement *</label>
          <textarea
            placeholder="What is your startup's immediate goal?"
            value={mission}
            onChange={(e) => setMission(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Vision Statement *</label>
          <textarea
            placeholder="What is your long-term vision?"
            value={vision}
            onChange={(e) => setVision(e.target.value)}
          />
        </div>

        <button className="save-btn" onClick={saveProfile}>
          {isExistingProfile ? "Update Profile" : "Create Profile"}
        </button>
      </div>
    </div>
  );
}