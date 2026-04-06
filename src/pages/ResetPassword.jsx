import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "../firebase";
import { toast } from "react-toastify";
import "../styles/ForgotPassword.css"; // Reusing styles or create ResetPassword.css

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidCode, setIsValidCode] = useState(false);
  const [verifying, setVerifying] = useState(true);

  const oobCode = searchParams.get("oobCode");

  // 1. Verify the code from the URL is valid on mount
  useEffect(() => {
    if (!oobCode) {
      toast.error("Invalid or missing reset code.");
      setVerifying(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        setIsValidCode(true);
        setVerifying(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("The reset link has expired or already been used.");
        setVerifying(false);
      });
  }, [oobCode]);

  // 2. Custom Password Validation Logic
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
      toast.success("Password updated successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) return <div className="auth-container"><p>Verifying link...</p></div>;
  if (!isValidCode) return (
    <div className="auth-container">
      <div className="auth-card">
        <p>Invalid Link</p>
        <Link to="/forgot-password">Request a new link</Link>
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