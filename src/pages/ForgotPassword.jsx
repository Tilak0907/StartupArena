import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  /* ─── CHECK EMAIL EXISTS ─── */
  const checkEmailExists = async (enteredEmail) => {
    try {
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(usersRef);
      
      let found = false;
      const normalizedEntered = enteredEmail.toLowerCase().trim();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email && data.email.toLowerCase().trim() === normalizedEntered) {
          found = true;
        }
      });
      
      return found;
    } catch (error) {
      console.error("Firestore Check Error:", error);
      // If this fails, check if your Firestore rules allow 'read' for the 'users' collection
      return false;
    }
  };

  /* ─── RESET PASSWORD ─── */
  const resetPassword = async () => {
    const rawEmail = email.trim();
    
    if (!rawEmail) {
      toast.error("Please enter your registered email address");
      return;
    }

    // ✅ CRITICAL: This must match your HashRouter setup
    // Use "http://localhost:5173/#/reset-password" for local testing
    // Use "https://startuparena-platform.onrender.com/#/reset-password" for production
    const actionCodeSettings = {
      url: "https://startuparena-platform.onrender.com/#/reset-password",
      handleCodeInApp: true,
    };

    try {
      setLoading(true);

      const emailExists = await checkEmailExists(rawEmail);

      if (!emailExists) {
        toast.error("This email is not registered in our database.");
        setLoading(false);
        return;
      }

      // ✅ Pass actionCodeSettings as the second argument
      await sendPasswordResetEmail(auth, rawEmail, actionCodeSettings);

      toast.success("Password reset link sent! Please check your inbox.");
      setEmail("");

    } catch (err) {
      console.error("Reset Error:", err);
      // If it reaches here, Firebase Auth itself rejected the request
      toast.error("Failed to send reset link. Ensure this email is also in Firebase Auth.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        <p className="subtitle">
          Enter your registered email to receive a reset link
        </p>

        <div className="input-group">
          <label>Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && resetPassword()}
          />
        </div>

        <button
          className="primary-btn"
          onClick={resetPassword}
          disabled={loading}
        >
          {loading ? "Verifying..." : "Send Reset Link"}
        </button>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}