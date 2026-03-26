import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "../styles/Navbar.css";
import logo from "../assets/LOGO3.png";
import NotificationBell from "../components/NotificationBell";

export default function Navbar() {

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {

        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        } else {
          setRole(null);
        }

      } catch (error) {
        console.error("Error fetching role:", error);
      }

      setLoading(false);

    });

    return () => unsubscribe();

  }, []);

  const handleLogout = async () => {

    try {

      await signOut(auth);
      setRole(null);
      sessionStorage.removeItem("visitTracked");
      navigate("/login");

    } catch (error) {

      console.error("Logout error:", error);

    }

  };

  if (loading) return null;

  return (

    <nav className="navbar">

      {/* LEFT SIDE */}
    <div className="navbar-left">
  <img
    src={logo}
    alt="StartupArena"
    className="navbar-logo"
  />
  <span className="navbar-title">
    StartupArena
  </span>
</div>

      {/* HAMBURGER */}

      <div
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </div>

      {/* RIGHT SIDE MENU */}

      <div className={`navbar-right ${menuOpen ? "active" : ""}`}>

        {role === "founder" && (
          <>
            <NavItem to="/" label="Dashboard" closeMenu={() => setMenuOpen(false)} />
            <NavItem to="/pitch" label="Pitch" closeMenu={() => setMenuOpen(false)} />
            <NavItem to="/analytics" label="Analytics" closeMenu={() => setMenuOpen(false)} />
            <NavItem to="/evaluation" label="Evaluation" closeMenu={() => setMenuOpen(false)} />
            <NavItem to="/feedback" label="Feedback" closeMenu={() => setMenuOpen(false)} />
            <NavItem to="/matrix" label="Matrix" closeMenu={() => setMenuOpen(false)} />
            <NavItem to="/trl" label="TRL" closeMenu={() => setMenuOpen(false)} />
             <NavItem to="/funding" label="Funding" closeMenu={() => setMenuOpen(false)} />
            <NavItem to="/mentor" label="Mentor" closeMenu={() => setMenuOpen(false)} />
            <NavItem to="/chat" label="Chat" closeMenu={() => setMenuOpen(false)} />
            <NavItem to="/profile" label="Profile" closeMenu={() => setMenuOpen(false)} />
          </>
        )}

        {role === "mentor" && (
          <>
            <NavItem to="/mentor-dashboard" label="Dashboard" closeMenu={() => setMenuOpen(false)} />
            <NavItem to="/mentor/chats" label="Chats" closeMenu={() => setMenuOpen(false)} />
          </>
        )}

        {/* 🔔 Notification Bell */}

        {role && (
          <div className="navbar-notification">
            <NotificationBell />
          </div>
        )}

        {/* Logout */}

        {role && (
          <button
            className="logout-btn"
            onClick={() => {
              handleLogout();
              setMenuOpen(false);
            }}
          >
            Logout
          </button>
        )}

      </div>

    </nav>

  );

}

/* ===============================
Reusable Nav Item
=============================== */

function NavItem({ to, label, closeMenu }) {

  return (

    <Link
      to={to}
      className="nav-link"
      onClick={closeMenu}
    >
      {label}
    </Link>

  );

}