import { HashRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* ===============================
   Pages
=============================== */
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

/* ===============================
   Components
=============================== */
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SplashScreen from "./components/SplashScreen";

/* ===============================
   Layout Component
=============================== */
function Layout() {

  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();

  }, []);

  if (loading) return null;

  const authRoutes = ["/login", "/register", "/forgot-password"];
  const isAuthPage = authRoutes.includes(location.pathname);

  return (
    <>
      {user && !isAuthPage && <Navbar />}

      <Routes>

        {/* INTRO PAGE */}
        <Route path="/intro" element={<IntroPage />} />

        {/* ================= Auth Routes ================= */}

        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />

        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/" />}
        />

        <Route
          path="/forgot-password"
          element={!user ? <ForgotPassword /> : <Navigate to="/" />}
        />

        {/* ================= Protected Routes ================= */}

        <Route
          path="/"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />

        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" />}
        />

        <Route
          path="/pitch"
          element={user ? <Pitch /> : <Navigate to="/login" />}
        />

        <Route
          path="/evaluation"
          element={user ? <Evaluation /> : <Navigate to="/login" />}
        />

        <Route
          path="/feedback"
          element={user ? <Feedback /> : <Navigate to="/login" />}
        />

        <Route
          path="/analytics"
          element={user ? <Analytics /> : <Navigate to="/login" />}
        />

        <Route
          path="/matrix"
          element={user ? <Matrix /> : <Navigate to="/login" />}
        />

        <Route
          path="/funding"
          element={user ? <Funding /> : <Navigate to="/login" />}
        />

        <Route
          path="/trl"
          element={user ? <TRL /> : <Navigate to="/login" />}
        />

        <Route
          path="/mentor"
          element={user ? <MentorReview /> : <Navigate to="/login" />}
        />

        <Route
          path="/chat"
          element={user ? <Chat /> : <Navigate to="/login" />}
        />

        {/* ================= Mentor Routes ================= */}

        <Route
          path="/mentor-dashboard"
          element={user ? <MentorDashboard /> : <Navigate to="/login" />}
        />

        <Route
          path="/mentor/profile/:id"
          element={user ? <MentorProfileDetails /> : <Navigate to="/login" />}
        />

        <Route
          path="/mentor/chats"
          element={user ? <MentorChatList /> : <Navigate to="/login" />}
        />

        <Route
          path="/mentor/chat/:chatId"
          element={user ? <MentorChatPage /> : <Navigate to="/login" />}
        />

      </Routes>

      {user && !isAuthPage && <Footer />}
    </>
  );
}

/* ===============================
   App Root with Splash Screen
=============================== */
export default function App() {

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {

    /* Save current route before splash */
    const currentRoute = window.location.hash;
    sessionStorage.setItem("lastRoute", currentRoute);

    const timer = setTimeout(() => {

      setShowSplash(false);

      const introSeen = localStorage.getItem("introSeen");
      const lastRoute = sessionStorage.getItem("lastRoute");

      if (!introSeen) {

        localStorage.setItem("introSeen", "true");
        window.location.hash = "#/intro";

      } else if (lastRoute && lastRoute !== "#") {

        window.location.hash = lastRoute;

      } else {

        window.location.hash = "#/login";

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