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
  
  // Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

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

  const showToast = (message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

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
        setDocId(snapshot.docs[0].id);
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
      showToast("Please login first");
      return;
    }

    // ✅ MANDATORY FIELDS VALIDATION
    if (!availableFund || !requiredFund || !equity || !fundUsage || !roi) {
      showToast("Please fill all mandatory fields: Available Funds, Required Funds, Equity, Fund Usage, and ROI.");
      return;
    }

    const fundingData = {
      userId: auth.currentUser.uid,
      availableFund: Number(availableFund),
      requiredFund: Number(requiredFund),
      equityOffered: Number(equity),
      fundUsage,
      expectedROI: roi,
      interestRate: interestRate || "", // Optional
      valuationBasis: valuationBasis || "", // Optional
      updatedAt: serverTimestamp()
    };

    try {
      if (docId) {
        await updateDoc(doc(db, "fundingDetails", docId), fundingData);
        showToast("Updated successfully", "success");
      } else {
        const newDoc = await addDoc(collection(db, "fundingDetails"), {
          ...fundingData,
          createdAt: serverTimestamp()
        });
        setDocId(newDoc.id);
        showToast("Saved successfully", "success");
      }
    } catch (error) {
      console.error(error);
      showToast("Error saving data");
    }
  };

  return (
    <div className="funding-page">
      {/* TOAST NOTIFICATION UI */}
      {toast.show && (
        <div className={`toast-container ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="funding-layout">
        <div className="funding-card">
          <h2>Startup Funding Details</h2>
          <p className="subtitle">Provide your funding information for investor evaluation</p>

          <form onSubmit={handleSubmit}>
            <label>Funds Available *</label>
            <input
              type="number"
              value={availableFund}
              onChange={(e) => setAvailableFund(e.target.value)}
              placeholder="Enter amount"
            />

            <label>Funds Required *</label>
            <input
              type="number"
              value={requiredFund}
              onChange={(e) => setRequiredFund(e.target.value)}
              placeholder="Enter amount"
            />

            <label>Equity (%) *</label>
            <input
              type="number"
              value={equity}
              onChange={(e) => setEquity(e.target.value)}
              placeholder="e.g. 10"
            />

            <label>Fund Usage *</label>
            <textarea
              value={fundUsage}
              onChange={(e) => setFundUsage(e.target.value)}
              placeholder="Describe how funds will be used"
            />

            <label>ROI (Expected) *</label>
            <input
              value={roi}
              onChange={(e) => setRoi(e.target.value)}
              placeholder="e.g. 20% in 2 years"
            />

            <label>Interest Rate (Optional)</label>
            <input
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="If applicable"
            />

            <label>Valuation Basis (Optional)</label>
            <textarea
              value={valuationBasis}
              onChange={(e) => setValuationBasis(e.target.value)}
              placeholder="How did you calculate your valuation?"
            />

            <button type="submit">
              {docId ? "Update" : "Save"}
            </button>
          </form>
        </div>

        <aside className="funding-agencies-panel">
          <h3 className="funding-heading">Funding Agencies In India</h3>
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