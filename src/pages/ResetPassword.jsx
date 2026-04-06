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

  // ✅ MANUAL PARAMETER PARSING (Required for HashRouter)
  // This extracts oobCode regardless of whether it's in the main URL or the hash
  const getOobCode = () => {
    const fullUrl = window.location.href;
    const urlObj = new URL(fullUrl.replace('#/', '')); // Temporary fix to parse hash as standard URL
    return urlObj.searchParams.get("oobCode");
  };

  const oobCode = getOobCode();

  useEffect(() => {
    if (!oobCode) {
      toast.error("Invalid or missing reset code.");
      setVerifying(false);
      return;
    }

    // Verify the code with Firebase
    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        setIsValidCode(true);
        setVerifying(false);
      })
      .catch((err) => {
        console.error("Verification error:", err);
        toast.error("The reset link has expired or already been used.");
        setVerifying(false);
      });
  }, [oobCode]);

  const validatePassword = (password) => {
    const minLength = 8;
    const hasNumber = /\d/;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;
    
    if (password.length < minLength) return "Password must be at least 8 characters.";
    if (!hasNumber.test(password)) return "Password must contain at least one number.";
    if (!hasSpecialChar.test(password)) return "Password must contain a special character.";
    return null;
  };

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
      
      // Give the user a moment to read the success message before redirecting
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Reset error:", err);
      toast.error("Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) return (
    <div className="auth-container">
      <div className="auth-card">
        <p>Verifying reset link...</p>
      </div>
    </div>
  );

  if (!isValidCode) return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Invalid Link</h2>
        <p>This password reset link is invalid or has expired.</p>
        <Link to="/forgot-password" style={{ color: "var(--primary-color)", marginTop: "1rem", display: "block" }}>
          Request a new link
        </Link>
      </div>
    </div>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Set New Password</h2>
        <p className="subtitle">Please follow our security requirements</p>

        <form onSubmit={handleReset}>
          <div className="input-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        <div className="password-requirements">
          <small>• At least 8 characters</small><br />
          <small>• At least 1 number</small><br />
          <small>• At least 1 special character</small>
        </div>
      </div>
    </div>
  );
}