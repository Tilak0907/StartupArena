import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  /* =============================================
      CHECK EMAIL EXISTS (Case-Insensitive Manual Check)
  ============================================== */
  const checkEmailExists = async (enteredEmail) => {
    try {
      const usersRef = collection(db, "users");
      
      // We fetch the documents. Note: If your user base is massive (>10k), 
      // you MUST standardize emails to lowercase on signup to use 'where' queries.
      const querySnapshot = await getDocs(usersRef);
      
      let found = false;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email && data.email.toLowerCase().trim() === enteredEmail.toLowerCase().trim()) {
          found = true;
        }
      });
      
      return found;
    } catch (error) {
      console.error("Firestore Check Error:", error);
      // If this errors, it's likely your Firebase Security Rules blocking the read.
      toast.error("Database access denied. Check your Security Rules.");
      return false;
    }
  };

  /* ===============================
      RESET PASSWORD
  =============================== */
  const resetPassword = async () => {
    const rawEmail = email.trim();
    
    if (!rawEmail) {
      toast.error("Please enter your registered email address");
      return;
    }

    try {
      setLoading(true);

      // ✅ Step 1: Check if email exists in Firestore
      const emailExists = await checkEmailExists(rawEmail);

      if (!emailExists) {
        toast.error("This email is not registered in our database.");
        return;
      }

      // ✅ Step 2: Send Firebase reset email 
      // (Firebase Auth is also case-sensitive for some configurations)
      await sendPasswordResetEmail(auth, rawEmail);

      toast.success("Password reset link sent! Please check your inbox.");
      setEmail("");

    } catch (err) {
      console.error("Reset Error:", err);
      if (err.code === "auth/user-not-found") {
        toast.error("User not found in Authentication records.");
      } else {
        toast.error("Failed to send reset link. Try again later.");
      }
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
            onKeyPress={(e) => e.key === 'Enter' && resetPassword()}
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