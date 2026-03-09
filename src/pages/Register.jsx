import { useState } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/Register.css";

export default function Register() {

  const [name, setName] = useState(""); // ✅ NEW
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("founder");
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  /* ===============================
     PASSWORD RULE CHECK
  =============================== */

  const checkPasswordRules = (pwd) => {
    const rules = {
      length: pwd.length >= 8,
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
    return rules;
  };

  /* ===============================
     REAL-TIME VALIDATION
  =============================== */

  const validateField = (field, value) => {

    let newErrors = { ...errors };

    if (field === "name") {
      if (!value) newErrors.name = "Name is required";
      else newErrors.name = "";
    }

    if (field === "email") {
      if (!value) newErrors.email = "Email is required";
      else newErrors.email = "";
    }

    if (field === "password") {

      const rules = checkPasswordRules(value);

      if (!value) newErrors.password = "Password is required";
      else if (!rules.length)
        newErrors.password = "Must be at least 8 characters";
      else if (!rules.number)
        newErrors.password = "Must include at least 1 number";
      else if (!rules.special)
        newErrors.password = "Must include at least 1 special character";
      else newErrors.password = "";
    }

    if (field === "confirmPassword") {

      if (!value)
        newErrors.confirmPassword = "Please confirm your password";
      else if (value !== password)
        newErrors.confirmPassword = "Passwords do not match";
      else newErrors.confirmPassword = "";

    }

    setErrors(newErrors);
  };

  /* ===============================
     REGISTER FUNCTION
  =============================== */

  const register = async () => {

    validateField("name", name);
    validateField("email", email);
    validateField("password", password);
    validateField("confirmPassword", confirmPassword);

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      errors.name ||
      errors.email ||
      errors.password ||
      errors.confirmPassword
    ) {
      return;
    }

    try {

      setLoading(true);

      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      /* ✅ Save user data with NAME */
      await setDoc(doc(db, "users", userCred.user.uid), {
        name: name,          // ⭐ NEW FIELD
        email: email,
        role: role,
        createdAt: new Date(),
      });

      /* 🔒 Logout immediately after register */
      await signOut(auth);

      toast.success("Account created successfully 🎉 Please login.");

      navigate("/login", { replace: true });

    } catch (authError) {

      if (authError.code === "auth/email-already-in-use") {
        toast.error("This email is already registered");
      } else if (authError.code === "auth/invalid-email") {
        toast.error("Invalid email address");
      } else {
        toast.error("Registration failed. Please try again");
      }

    } finally {

      setLoading(false);

    }

  };

  const passwordRules = checkPasswordRules(password);

  return (

    <div className="register-page">

      <div className="register-card">

        <h2 className="register-title">Create your account</h2>

        <p className="register-subtitle">
          Join StartupArena and evaluate your startup readiness
        </p>

        {/* Name */}
        <div className="form-group">

          <label>Name</label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              validateField("name", e.target.value);
            }}
          />

          {errors.name && (
            <p className="input-error">{errors.name}</p>
          )}

        </div>

        {/* Email */}
        <div className="form-group">

          <label>Email</label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateField("email", e.target.value);
            }}
          />

          {errors.email && (
            <p className="input-error">{errors.email}</p>
          )}

        </div>

        {/* Password */}
        <div className="form-group">

          <label>Password</label>

          <div className="password-field">

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validateField("password", e.target.value);
              }}
            />

            <span
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>

          </div>

          <div className="password-hint">

            <p className={passwordRules.length ? "valid" : "invalid"}>
              • Minimum 8 characters
            </p>

            <p className={passwordRules.number ? "valid" : "invalid"}>
              • At least 1 number
            </p>

            <p className={passwordRules.special ? "valid" : "invalid"}>
              • At least 1 special character
            </p>

          </div>

          {errors.password && (
            <p className="input-error">{errors.password}</p>
          )}

        </div>

        {/* Confirm Password */}
        <div className="form-group">

          <label>Confirm Password</label>

          <div className="password-field">

            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                validateField("confirmPassword", e.target.value);
              }}
            />

            <span
              className="password-toggle"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </span>

          </div>

          {errors.confirmPassword && (
            <p className="input-error">
              {errors.confirmPassword}
            </p>
          )}

        </div>

        {/* Role */}
        <div className="form-group">

          <label>Role</label>

          <select onChange={(e) => setRole(e.target.value)}>
            <option value="founder">Founder</option>
            <option value="mentor">Mentor</option>
          </select>

        </div>

        <p className="role-note">
          Choose <b>Founder</b> to submit ideas or <b>Mentor</b> to review startups.
        </p>

        {/* Submit */}
        <button
          className="register-btn"
          onClick={register}
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>

      </div>

    </div>

  );

}