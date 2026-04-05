import { Link } from "react-router-dom";
import "../styles/Footer.css";
import logo from "../assets/LOGO3.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Top Section */}
        <div className="footer-top">
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="footer-logo-wrapper">
              <img src={logo} alt="StartupArena Logo" className="footer-logo" />
              <span className="footer-brand-name">StartupArena</span>
            </div>
            <p className="footer-tagline">
              A Platform to Transform Ideas into Reality.
            </p>

            {/* Support Email */}
            <div className="footer-support">
              <span className="footer-support-label">Need help? Send an email to : </span>
              <a
                href="mailto:startuparenaplatform@gmail.com"
                className="footer-support-email"
              >
                startuparenaplatform@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider"></div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} StartupArena. All rights reserved.
          </p>
          <div className="footer-badges">
            <span className="footer-badge">Developed By Tilakaraaj Dhanaraj</span>
          </div>
        </div>
      </div>

      {/* Decorative gradient */}
      <div className="footer-gradient"></div>
    </footer>
  );
}