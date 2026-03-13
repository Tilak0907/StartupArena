const { RandomForestClassifier } = require("ml-random-forest");
const { mapPitchToFeatures } = require("./attributeMapper");

/* =========================================================
   SYNTHETIC FALLBACK DATA
   Used if dataset is too small
   (10 FEATURES: 5 structured + 5 TF-IDF)
========================================================= */

const fallbackTraining = [

  [3,3,3,3,3,0.5,0.4,0.3,0.3,0.2],
  [3,3,3,2,2,0.4,0.4,0.3,0.2,0.2],
  [3,2,3,3,2,0.4,0.3,0.3,0.2,0.2],
  [2,3,3,3,2,0.4,0.3,0.2,0.2,0.2],
  [3,3,2,2,2,0.3,0.3,0.2,0.2,0.2],
  [2,3,3,2,2,0.3,0.3,0.2,0.2,0.1],

  [2,2,2,2,2,0.2,0.2,0.2,0.1,0.1],
  [2,2,2,1,1,0.2,0.2,0.1,0.1,0.1],

  [1,1,1,1,1,0.1,0.1,0.1,0.1,0.1],
  [1,1,1,0,0,0.1,0.1,0.05,0.05,0.05],
  [0,1,1,1,0,0.1,0.05,0.05,0.05,0.05],
  [1,0,1,1,0,0.1,0.05,0.05,0.05,0.05],
  [0,0,1,1,0,0.05,0.05,0.05,0.05,0.05],
  [1,0,0,1,0,0.05,0.05,0.05,0.05,0.05],
  [0,1,0,1,0,0.05,0.05,0.05,0.05,0.05],
  [0,0,0,1,0,0.05,0.05,0.05,0.05,0.05],
  [0,0,0,0,0,0.01,0.01,0.01,0.01,0.01]

];

const fallbackLabels = [
  1,1,1,1,1,1,
  1,1,
  0,0,0,0,0,0,0,0,
  0
];

/* =========================================================
   RANDOM FOREST FUNCTION
========================================================= */

async function runRandomForest(currentFeatures, previousPitches = []) {

  const trainingData = [];
  const labels = [];

  /* =========================================================
     BUILD DATASET FROM FIRESTORE
  ========================================================= */

  for (const pitch of previousPitches) {

    const features = await mapPitchToFeatures(pitch, previousPitches);

    // Ensure feature length is correct
    if (features.length === 10) {

      trainingData.push(features);
      labels.push(pitch.successLabel || 0);

    }

  }

  /* =========================================================
     FALLBACK DATA IF DATASET SMALL
  ========================================================= */

  if (trainingData.length < 10) {

    console.log("Using fallback synthetic training data");

    fallbackTraining.forEach(row => trainingData.push(row));
    fallbackLabels.forEach(label => labels.push(label));

  }

  /* =========================================================
     TRAIN RANDOM FOREST
  ========================================================= */

  const rf = new RandomForestClassifier({

    nEstimators: 40,
    maxFeatures: 0.8,
    replacement: true,
    seed: 7

  });

  rf.train(trainingData, labels);

  /* =========================================================
     DEBUG FEATURE VECTOR
  ========================================================= */

  console.log("Current Pitch Features:", currentFeatures);

  /* =========================================================
     PREDICT CURRENT PITCH
  ========================================================= */

  const predictionValue = rf.predict([currentFeatures])[0];

  /* =========================================================
     STRUCTURED FEATURE SCORE
  ========================================================= */

  const structuredFeatures = currentFeatures.slice(0,5);

  const structuredSum =
    structuredFeatures.reduce((a,b)=>a+b,0);

  const structuredProbability =
    structuredSum / 15; // max possible = 15

  /* =========================================================
     TF-IDF SCORE
  ========================================================= */

  const tfidfFeatures = currentFeatures.slice(5);

  const tfidfAvg =
    tfidfFeatures.reduce((a,b)=>a+b,0) /
    tfidfFeatures.length;

  /* =========================================================
     FINAL PROBABILITY
  ========================================================= */

  const probability = Math.min(

    1,

    (structuredProbability * 0.85) +
    (tfidfAvg * 0.15)

  );

  /* =========================================================
     FINAL RESULT
  ========================================================= */

  const prediction =
    predictionValue === 1
      ? "Successful"
      : "Needs Improvement";

  return {

    prediction,
    probability

  };

}

module.exports = { runRandomForest };