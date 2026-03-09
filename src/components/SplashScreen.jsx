import "../styles/SplashScreen.css";
//import logo from "../assets/LOGO3.png";

export default function SplashScreen() {
  return (
   <div className="splash-container">
  <div className="splash-content">
    <img className="splash-logo" src="/LOGO3.png" alt="StartupArena" />
    <h1 className="splash-title">StartupArena</h1>
    <p className="splash-tagline">A Platform to transform ideas into reality</p>
    <div className="splash-loader">
      <span /><span /><span />
    </div>
  </div>
</div>
  );
}