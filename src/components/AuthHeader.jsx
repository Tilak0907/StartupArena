import logo from "../assets/logo.png"; // adjust path if needed
import "../styles/AuthHeader.css";

export default function AuthHeader() {
  return (
    <div className="auth-header">
      <img src={logo} alt="StartupArena Logo" className="auth-logo" />
      <h1 className="auth-title">StartupArena</h1>
    </div>
  );
}
