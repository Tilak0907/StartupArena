const { RandomForestClassifier } = require("ml-random-forest");
const { mapPitchToFeatures } = require("./attributeMapper");

/* =========================================================
   SYNTHETIC FALLBACK DATA
   Used only if Firestore dataset is too small
========================================================= */

const fallbackTraining = [
  [2,2,2,2],
  [2,2,2,1],
  [2,1,2,2],
  [1,2,2,2],
  [2,2,1,1],
  [1,2,2,1],
  [2,1,1,2],
  [1,1,2,2],
  [1,1,1,1],
  [1,1,1,0],
  [0,1,1,1],
  [1,0,1,1],
  [0,0,1,1],
  [1,0,0,1],
  [0,1,0,1],
  [0,0,0,1],
  [0,0,0,0]
];

const fallbackLabels = [
  1,1,1,1,
  1,1,1,1,
  0,0,0,0,
  0,0,0,0,
  0
];

/* =========================================================
   RANDOM FOREST FUNCTION
========================================================= */

async function runRandomForest(currentFeatures, previousPitches = []) {

  const trainingData = [];
  const labels = [];

  /* =========================================================
     BUILD DATASET FROM FIRESTORE PITCHES
  ========================================================= */

  for (const pitch of previousPitches) {

    const features = await mapPitchToFeatures(pitch, previousPitches);

    trainingData.push(features);

    labels.push(pitch.successLabel || 0);

  }

  /* =========================================================
     FALLBACK IF DATASET TOO SMALL
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
    nEstimators: 20,
    maxFeatures: 0.8,
    replacement: true,
    seed: 3
  });

  rf.train(trainingData, labels);

  /* =========================================================
     PREDICT CURRENT PITCH
  ========================================================= */

  const prediction = rf.predict([currentFeatures])[0];

  const sum = currentFeatures.reduce((a,b) => a+b,0);

  const probability = Math.min(1, sum / (currentFeatures.length * 2));

  return {
    prediction: prediction === 1 ? "Successful" : "Needs Improvement",
    probability
  };

}

module.exports = { runRandomForest };