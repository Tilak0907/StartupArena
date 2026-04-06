import { HashRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase"; // Ensure db is imported
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* Pages & Components Imports... (Keep your current imports exactly as they are) */
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Pitch from "./pages/Pitch";
import Evaluation from "./pages/Evaluation";
import Feedback from "./pages/Feedback";
import Analytics from "./pages/Analytics";
import MentorReview from "./pages/MentorReview";
import Matrix from "./pages/EvaluationMatrix";
import TRL from "./pages/Trl";
import Chat from "./pages/ChatPage";
import MentorDashboard from "./pages/MentorDashboard";
import MentorProfileDetails from "./pages/MentorProfileDetails";
import MentorChatList from "./pages/MentorChatList";
import MentorChatPage from "./pages/MentorChatPage";
import Funding from "./pages/Funding";
import IntroPage from "./pages/IntroPage";
import ResetPassword from "./pages/ResetPassword";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SplashScreen from "./components/SplashScreen";

function Layout() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // ✅ Track user role
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        // ✅ Fetch the role from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role); // Assumes your field is named 'role'
          }
        } catch (error) {
          console.error("Error fetching role:", error);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return null;

  const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/intro"];
  const isAuthPage = authRoutes.includes(location.pathname);

  // Helper to determine the "Home" based on role
  const getHomeRedirect = () => {
    if (role === "mentor") return "/mentor-dashboard";
    return "/";
  };

  return (
    <>
      {user && !isAuthPage && <Navbar userRole={role} />}

      <Routes>
        <Route path="/intro" element={<IntroPage />} />

        {/* ================= Auth Routes ================= */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to={getHomeRedirect()} replace />}
        />
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to={getHomeRedirect()} replace />}
        />
        <Route
          path="/forgot-password"
          element={!user ? <ForgotPassword /> : <Navigate to={getHomeRedirect()} replace />}
        />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ================= Founder Protected Routes ================= */}
        {/* Only allow access if user is founder. If mentor, redirect to mentor dashboard. */}
        <Route
          path="/"
          element={
            user ? (role === "founder" ? <Dashboard /> : <Navigate to="/mentor-dashboard" replace />) : <Navigate to="/login" />
          }
        />
        
        {/* Apply the same logic to other founder pages */}
        <Route path="/profile" element={user && role === "founder" ? <Profile /> : <Navigate to={user ? "/mentor-dashboard" : "/login"} replace />} />
        <Route path="/pitch" element={user && role === "founder" ? <Pitch /> : <Navigate to={user ? "/mentor-dashboard" : "/login"} replace />} />
        <Route path="/evaluation" element={user && role === "founder" ? <Evaluation /> : <Navigate to={user ? "/mentor-dashboard" : "/login"} replace />} />
        <Route path="/feedback" element={user && role === "founder" ? <Feedback /> : <Navigate to={user ? "/mentor-dashboard" : "/login"} replace />} />
        <Route path="/analytics" element={user && role === "founder" ? <Analytics /> : <Navigate to={user ? "/mentor-dashboard" : "/login"} replace />} />
        <Route path="/matrix" element={user && role === "founder" ? <Matrix /> : <Navigate to={user ? "/mentor-dashboard" : "/login"} replace />} />
        <Route path="/funding" element={user && role === "founder" ? <Funding /> : <Navigate to={user ? "/mentor-dashboard" : "/login"} replace />} />
        <Route path="/trl" element={user && role === "founder" ? <TRL /> : <Navigate to={user ? "/mentor-dashboard" : "/login"} replace />} />
        <Route path="/mentor" element={user && role === "founder" ? <MentorReview /> : <Navigate to={user ? "/mentor-dashboard" : "/login"} replace />} />
        <Route path="/chat" element={user && role === "founder" ? <Chat /> : <Navigate to={user ? "/mentor-dashboard" : "/login"} replace />} />

        {/* ================= Mentor Protected Routes ================= */}
        <Route
          path="/mentor-dashboard"
          element={
            user ? (role === "mentor" ? <MentorDashboard /> : <Navigate to="/" replace />) : <Navigate to="/login" />
          }
        />
        <Route path="/mentor/profile/:id" element={user && role === "mentor" ? <MentorProfileDetails /> : <Navigate to={user ? "/" : "/login"} replace />} />
        <Route path="/mentor/chats" element={user && role === "mentor" ? <MentorChatList /> : <Navigate to={user ? "/" : "/login"} replace />} />
        <Route path="/mentor/chat/:chatId" element={user && role === "mentor" ? <MentorChatPage /> : <Navigate to={user ? "/" : "/login"} replace />} />

        {/* CATCH-ALL */}
        <Route 
          path="*" 
          element={<Navigate to={user ? getHomeRedirect() : "/login"} replace />} 
        />
      </Routes>

      {user && !isAuthPage && <Footer />}
    </>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const isResetLink = window.location.hash.includes("reset-password");

    const timer = setTimeout(() => {
      setShowSplash(false);
      if (isResetLink) return;

      const introSeen = localStorage.getItem("introSeen");
      if (!introSeen) {
        localStorage.setItem("introSeen", "true");
        window.location.hash = "#/intro";
      } else {
        if (!window.location.hash || window.location.hash === "#/" || window.location.hash === "") {
          window.location.hash = "#/login";
        }
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <HashRouter>
      <Layout />
      <ToastContainer position="top-right" autoClose={3000} />
    </HashRouter>
  );
}