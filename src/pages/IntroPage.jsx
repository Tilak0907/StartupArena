import { useNavigate } from "react-router-dom";
import "../styles/IntroPage.css";

export default function IntroPage() {

  const navigate = useNavigate();

  return (

    <div className="intro-page">

      <h1>Welcome to StartupArena</h1>

      <p>
        StartupArena is a platform where founders can submit startup ideas
        and receive AI-based evaluation. Mentors can review the startup
        proposals and provide guidance to help founders improve their ideas.
      </p>

      <ul>
        <li>Submit startup pitch</li>
        <li>AI-based startup evaluation</li>
        <li>Mentor review and feedback</li>
        <li>Startup analytics and insights</li>
        <li>Funding readiness assessment</li>
      </ul>

      <button
        onClick={() => navigate("/login")}
      >
        Continue to Login
      </button>

    </div>

  );

}