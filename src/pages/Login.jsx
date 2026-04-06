import { useState } from "react";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/login.css";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /* ===============================
     FIELD VALIDATION
  =============================== */

  const validateFields = () => {

    if (!email.trim()) {
      toast.error("Email is required");
      return false;
    }

    if (!password.trim()) {
      toast.error("Password is required");
      return false;
    }

    return true;

  };

  /* ===============================
     LOGIN FUNCTION
  =============================== */

  const login = async () => {

    if (!validateFields()) return;

    try {

      setLoading(true);

      const enteredEmail = email.trim().toLowerCase();

      /* 🔐 Set session persistence
         User logs out when tab closes */

      await setPersistence(auth, browserSessionPersistence);

      // Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        enteredEmail,
        password
      );

      const uid = userCredential.user.uid;

      // Fetch user role from Firestore
      const userDoc = await getDoc(doc(db, "users", uid));

      if (!userDoc.exists()) {
        toast.error("User data not found");
        return;
      }

      const userData = userDoc.data();

      localStorage.setItem("role", userData.role);

      toast.success("Login successful");

      if (userData.role === "mentor") {
        navigate("/mentor-dashboard",{replace:true});
      } else {
        navigate("/");
      }

    } catch (err) {

      console.error(err);
      toast.error("Invalid email or password");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="login-wrapper">

      <div className="login-card">

        <button
  className="intro-btn"
  onClick={() => window.location.hash = "#/intro"}
>
  Learn About StartupArena
</button>

        <h2>Welcome</h2>

        <p className="subtitle">
          Login to continue to <strong>StartupArena</strong>
        </p>

        {/* Email */}
        <div className="input-group">

          <label>Email</label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

        </div>

        {/* Password */}
        <div className="input-group password-group">

          <label>Password</label>

          <div className="password-wrapper">

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>

          </div>

        </div>

        <div className="auth-actions">

          <button
            onClick={login}
            className="primary-btn"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <Link className="auth-link" to="/forgot-password">
            Forgot password?
          </Link>

          <p className="switch-auth">
            Don’t have an account?{" "}
            <Link to="/register">Register</Link>
          </p>

        </div>

      </div>

    </div>

  );

}