import "../styles/SplashScreen.css";
import { useEffect } from "react";

export default function SplashScreen() {

  useEffect(() => {

    const timer = setTimeout(() => {

      const lastRoute = sessionStorage.getItem("lastRoute");

      if (lastRoute && lastRoute !== "#") {
        window.location.hash = lastRoute;
      } else {
        window.location.hash = "#/login";
      }

    }, 2500);

    return () => clearTimeout(timer);

  }, []);

  return (
    <div className="splash-container">
      <div className="splash-content">
        <img className="splash-logo" src="/LOGO3.png" alt="StartupArena" />
        <h1 className="splash-title">StartupArena</h1>
        <p className="splash-tagline">
          A Platform to transform ideas into reality
        </p>
        <div className="splash-loader">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}