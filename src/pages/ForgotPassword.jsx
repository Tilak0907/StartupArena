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

  /* ===============================
     CHECK EMAIL EXISTS IN FIRESTORE
  =============================== */
  const checkEmailExists = async (enteredEmail) => {
    const snapshot = await getDocs(collection(db, "users"));

    let exists = false;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email.toLowerCase() === enteredEmail.toLowerCase()) {
        exists = true;
      }
    });

    return exists;
  };

  /* ===============================
     RESET PASSWORD
  =============================== */
  const resetPassword = async () => {
    if (!email.trim()) {
      toast.error("Please enter your registered email address");
      return;
    }

    try {
      setLoading(true);

      const enteredEmail = email.trim().toLowerCase();

      // ✅ Step 1: Check if email exists in Firestore
      const emailExists = await checkEmailExists(enteredEmail);

      if (!emailExists) {
        toast.error("This email is not registered");
        return;
      }

      // ✅ Step 2: Send Firebase reset email
      await sendPasswordResetEmail(auth, enteredEmail);

      toast.success("Password reset link sent. Check your inbox ");
      setEmail("");

    } catch (err) {
      console.error(err);
      toast.error("Email is not registered. Failed to sent reset link.");
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
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button
          className="primary-btn"
          onClick={resetPassword}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <Link to="/login" className="auth-link">
          Back to Login
        </Link>
      </div>
    </div>
  );
}