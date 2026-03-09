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

export default function Funding() {

  const [availableFund, setAvailableFund] = useState("");
  const [requiredFund, setRequiredFund] = useState("");
  const [equity, setEquity] = useState("");
  const [fundUsage, setFundUsage] = useState("");

  const [roi, setRoi] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [valuationBasis, setValuationBasis] = useState("");

  const [docId, setDocId] = useState(null);

  /* ======================================================
     LOAD EXISTING DATA
  ====================================================== */

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

  /* ======================================================
     SAVE OR UPDATE
  ====================================================== */

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

      fundUsage: fundUsage,

      expectedROI: roi,

      interestRate: interestRate,

      valuationBasis: valuationBasis,

      updatedAt: serverTimestamp()

    };

    try {

      /* UPDATE EXISTING */

      if (docId) {

        await updateDoc(
          doc(db, "fundingDetails", docId),
          fundingData
        );

        alert("Funding details updated successfully");

      }

      /* CREATE NEW */

      else {

        const newDoc = await addDoc(
          collection(db, "fundingDetails"),
          {
            ...fundingData,
            createdAt: serverTimestamp()
          }
        );

        setDocId(newDoc.id);

        alert("Funding details saved successfully");

      }

    } catch (error) {

      console.error("Funding save error:", error);
      alert("Error saving funding details");

    }

  };

  return (

    <div className="funding-page">

      <div className="funding-card">

        <h2>Startup Funding Details</h2>

        <p className="subtitle">
          Provide your funding information for investor evaluation
        </p>

        <form onSubmit={handleSubmit}>

          {/* AVAILABLE FUND */}

          <label>Funds Currently Available</label>

          <input
            type="number"
            placeholder="Enter amount in ₹"
            value={availableFund}
            onChange={(e) => setAvailableFund(e.target.value)}
            required
          />

          {/* REQUIRED FUND */}

          <label>Funds Required</label>

          <input
            type="number"
            placeholder="Enter amount needed in ₹"
            value={requiredFund}
            onChange={(e) => setRequiredFund(e.target.value)}
            required
          />

          {/* EQUITY */}

          <label>Equity Offered to Investors (%)</label>

          <input
            type="number"
            placeholder="Example: 10%"
            value={equity}
            onChange={(e) => setEquity(e.target.value)}
            required
          />

          {/* FUND USAGE */}

          <label>How will the funds be used?</label>

          <textarea
            placeholder="Example: product development, marketing, hiring..."
            value={fundUsage}
            onChange={(e) => setFundUsage(e.target.value)}
            required
          />

          {/* ROI */}

          <label>Expected Return on Investment (ROI)</label>

          <input
            type="text"
            placeholder="Example: 3x return in 5 years"
            value={roi}
            onChange={(e) => setRoi(e.target.value)}
          />

          {/* INTEREST RATE */}

          <label>Interest Rate (if debt funding)</label>

          <input
            type="text"
            placeholder="Example: 8%"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
          />

          {/* VALUATION */}

          <label>Valuation Basis</label>

          <textarea
            placeholder="Explain how your startup valuation is calculated"
            value={valuationBasis}
            onChange={(e) => setValuationBasis(e.target.value)}
          />

          <button type="submit">

            {docId ? "Update Funding Details" : "Save Funding Details"}

          </button>

        </form>

      </div>

    </div>

  );

}