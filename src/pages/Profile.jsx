import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";

export default function Profile() {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [vision, setVision] = useState("");
  const [loading, setLoading] = useState(true);
  const [isExistingProfile, setIsExistingProfile] = useState(false);
  const navigate = useNavigate();

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
          setIsExistingProfile(true); // ✅ profile already exists
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  /* -------------------- SAVE / UPDATE PROFILE -------------------- */
  const saveProfile = async () => {
    if (!name || !industry || !vision) {
      alert("Please fill all fields");
      return;
    }

    try {
      await setDoc(doc(db, "profiles", auth.currentUser.uid), {
        userId: auth.currentUser.uid,
        name,
        industry,
        vision,
        updatedAt: new Date(),
      });

      alert(
        isExistingProfile
          ? "Profile updated successfully!"
          : "Profile created successfully!"
      );

      setIsExistingProfile(true);
    } catch (err) {
      console.error("Profile save failed:", err);
      alert("Failed to save profile");
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
      <div className="card">
       
        <h2>Startup Profile</h2>

        {isExistingProfile && (
          <p className="subtitle">
            You can update your startup profile anytime.
          </p>
        )}

        <label>Startup Name</label>
        <input
          placeholder="Enter startup name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label>Industry</label>
        <input
          placeholder="e.g. FinTech, HealthTech, SaaS"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        />

        <label>Vision / Mission</label>
        <textarea
          placeholder="What is your long-term vision?"
          value={vision}
          onChange={(e) => setVision(e.target.value)}
        />

        <button onClick={saveProfile}>
          {isExistingProfile ? "Update Profile" : "Create Profile"}
        </button>
      </div>
    </div>
  );
}
