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

  /* ─── CHECK EMAIL EXISTS (In Firestore) ─── */
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
      return false;
    }
  };

  /* ─── RESET PASSWORD (Default Flow) ─── */
  const resetPassword = async () => {
    const rawEmail = email.trim();
    
    if (!rawEmail) {
      toast.error("Please enter your registered email address");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Optional Firestore check 
      // (Kept this so users get a clear message if they aren't registered)
      const emailExists = await checkEmailExists(rawEmail);

      if (!emailExists) {
        toast.error("This email is not registered in our database.");
        setLoading(false);
        return;
      }

      // Step 2: Send Default Reset Email
      // Note: We removed 'actionCodeSettings'. Firebase will now use its default page.
      await sendPasswordResetEmail(auth, rawEmail);

      toast.success("Reset link sent! Please check your email inbox.");
      setEmail("");

    } catch (err) {
      console.error("Reset Error:", err);
      
      if (err.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please try again in 15-30 minutes.");
      } else if (err.code === "auth/user-not-found") {
        toast.error("No account found with this email in our system.");
      } else {
        toast.error("Failed to send reset link. Please try again later.");
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
          Enter your email to receive a secure password reset link
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
          {loading ? "Sending..." : "Send Reset Link"}
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