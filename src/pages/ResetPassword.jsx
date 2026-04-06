import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "../firebase";
import { toast } from "react-toastify";
import "../styles/ForgotPassword.css"; 

export default function ResetPassword() {
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidCode, setIsValidCode] = useState(false);
  const [verifying, setVerifying] = useState(true);

  /* ─── OPTIMIZED PARAMETER PARSING FOR HASHROUTER ─── */
  const getOobCode = () => {
    // HashRouter URLs look like: domain.com/#/reset-password?oobCode=XYZ
    const fullHash = window.location.hash; 
    if (!fullHash.includes("?")) return null;

    // Split by '?' and parse the second half
    const queryString = fullHash.split("?")[1];
    const params = new URLSearchParams(queryString);
    return params.get("oobCode");
  };

  const oobCode = getOobCode();

  useEffect(() => {
    // 1. If no code is found, stop verifying immediately
    if (!oobCode) {
      console.error("No oobCode found in the HashRouter URL.");
      setVerifying(false);
      return;
    }

    // 2. Verify the code with Firebase Authentication
    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        setIsValidCode(true);
        setVerifying(false);
      })
      .catch((err) => {
        console.error("Firebase Verification Error:", err);
        setVerifying(false);
      });
  }, [oobCode]);

  /* ─── PASSWORD VALIDATION ─── */
  const validatePassword = (password) => {
    const minLength = 8;
    const hasNumber = /\d/;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;
    
    if (password.length < minLength) return "Password must be at least 8 characters.";
    if (!hasNumber.test(password)) return "Password must contain at least one number.";
    if (!hasSpecialChar.test(password)) return "Password must contain a special character.";
    return null;
  };

  /* ─── FORM SUBMISSION ─── */
  const handleReset = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const error = validatePassword(newPassword);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setLoading(true);
      await confirmPasswordReset(auth, oobCode, newPassword);
      toast.success("Password updated successfully!");
      
      // Navigate to login after a short delay
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Reset Submission Error:", err);
      toast.error("Failed to update password. Link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── RENDER STATES ─── */

  // State 1: Verifying the link
  if (verifying) return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="loader-inline"></div>
        <p>Verifying your security link...</p>
      </div>
    </div>
  );

  // State 2: Link is invalid or expired
  if (!isValidCode) return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 style={{ color: "#ff4d4d" }}>Invalid Link</h2>
        <p>This password reset link is invalid, expired, or has already been used.</p>
        <Link to="/forgot-password" title="Request new link" className="auth-link-btn">
          Request a New Link
        </Link>
      </div>
    </div>
  );

  // State 3: Link is valid, show form
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Set New Password</h2>
        <p className="subtitle">Enter a strong password to secure your account.</p>

        <form onSubmit={handleReset}>
          <div className="input-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <div className="password-requirements">
          <p>Password requirements:</p>
          <ul>
            <li>At least 8 characters long</li>
            <li>Contains at least one number</li>
            <li>Contains a special character (!@#$)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}