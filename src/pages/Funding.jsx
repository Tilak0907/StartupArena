import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";
import "../styles/Funding.css";

export default function Funding() {

  const [availableFund, setAvailableFund] = useState("");
  const [requiredFund, setRequiredFund] = useState("");
  const [equity, setEquity] = useState("");
  const [fundUsage, setFundUsage] = useState("");

  const [roi, setRoi] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [valuationBasis, setValuationBasis] = useState("");

  const [docId, setDocId] = useState(null);

  /* ✅ FUNDING AGENCIES LIST */
  const FUNDING_AGENCIES = [
    { name: "Startup India", url: "https://www.startupindia.gov.in/" },
    { name: "SIDBI", url: "https://www.sidbi.in/" },
    { name: "DPIIT Seed Fund", url: "https://seedfund.startupindia.gov.in/" },
    { name: "NABARD", url: "https://www.nabard.org/" },
    { name: "Atal Innovation Mission", url: "https://aim.gov.in/" },
    { name: "Sequoia Capital India", url: "https://www.sequoiacap.com/india/" },
    { name: "Accel India", url: "https://www.accel.com/" },
    { name: "Nexus Venture Partners", url: "https://nexusvp.com/" },
    { name: "Indian Angel Network", url: "https://www.indianangelnetwork.com/" },
    { name: "Mumbai Angels", url: "https://www.mumbaiangels.com/" },
    { name: "T-Hub", url: "https://t-hub.co/" },
    { name: "SINE IIT Bombay", url: "https://www.sineiitb.org/" }
  ];

  useEffect(() => {
    const loadFunding = async () => {
      if (!auth.currentUser) return;

      const q = query(
        collection(db, "fundingDetails"),
        where("userId", "==", auth.currentUser.uid)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const id = snapshot.docs[0].id;

        setDocId(id);
        setAvailableFund(data.availableFund || "");
        setRequiredFund(data.requiredFund || "");
        setEquity(data.equityOffered || "");
        setFundUsage(data.fundUsage || "");
        setRoi(data.expectedROI || "");
        setInterestRate(data.interestRate || "");
        setValuationBasis(data.valuationBasis || "");
      }
    };

    loadFunding();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert("Please login first");
      return;
    }

    const fundingData = {
      userId: auth.currentUser.uid,
      availableFund: Number(availableFund),
      requiredFund: Number(requiredFund),
      equityOffered: Number(equity),
      fundUsage,
      expectedROI: roi,
      interestRate,
      valuationBasis,
      updatedAt: serverTimestamp()
    };

    try {
      if (docId) {
        await updateDoc(doc(db, "fundingDetails", docId), fundingData);
        alert("Updated successfully");
      } else {
        const newDoc = await addDoc(collection(db, "fundingDetails"), {
          ...fundingData,
          createdAt: serverTimestamp()
        });
        setDocId(newDoc.id);
        alert("Saved successfully");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving");
    }
  };

  return (
    <div className="funding-page">

      {/* NEW LAYOUT WRAPPER */}
      <div className="funding-layout">

        {/* LEFT SIDE FORM */}
        <div className="funding-card">
          <h2>Startup Funding Details</h2>
          <p className="subtitle">
            Provide your funding information for investor evaluation
          </p>

          <form onSubmit={handleSubmit}>
            <label>Funds Available</label>
            <input
              type="number"
              value={availableFund}
              onChange={(e) => setAvailableFund(e.target.value)}
              required
            />

            <label>Funds Required</label>
            <input
              type="number"
              value={requiredFund}
              onChange={(e) => setRequiredFund(e.target.value)}
              required
            />

            <label>Equity (%)</label>
            <input
              type="number"
              value={equity}
              onChange={(e) => setEquity(e.target.value)}
              required
            />

            <label>Fund Usage</label>
            <textarea
              value={fundUsage}
              onChange={(e) => setFundUsage(e.target.value)}
              required
            />

            <label>ROI</label>
            <input
              value={roi}
              onChange={(e) => setRoi(e.target.value)}
            />

            <label>Interest Rate</label>
            <input
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
            />

            <label>Valuation Basis</label>
            <textarea
              value={valuationBasis}
              onChange={(e) => setValuationBasis(e.target.value)}
            />

            <button type="submit">
              {docId ? "Update" : "Save"}
            </button>
          </form>
        </div>

        {/* RIGHT SIDE PANEL */}
        <aside className="funding-agencies-panel">
          <h3 className = "funding-heading">Funding Agencies In India</h3>

          <div className="agency-list">
            {FUNDING_AGENCIES.map((a, i) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="agency-item"
              >
                {a.name}
              </a>
            ))}
          </div>
        </aside>

      </div>
    </div>
  );
}