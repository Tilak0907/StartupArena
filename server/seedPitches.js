const admin = require("firebase-admin");
const serviceAccount = require("./firebaseKey.json");

const seedPitches = require("./seedPitches.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/* =====================================
   DATA FOR GENERATING EXTRA PITCHES
===================================== */

const problems = [
  "Businesses struggle with inefficient manual operations and outdated systems.",
  "Students lack personalized learning support and analytics.",
  "Hospitals face delays due to manual record management.",
  "Farmers experience crop loss due to lack of predictive insights.",
  "Retail stores struggle with inventory tracking.",
  "Remote teams lack productivity monitoring tools.",
  "Restaurants waste food due to inaccurate demand forecasting.",
  "Small businesses lack financial analytics tools.",
  "Manufacturing plants face downtime due to lack of predictive maintenance.",
  "Logistics companies struggle with delivery route optimization."
];

const solutions = [
  "AI powered cloud platform with automation and analytics dashboard.",
  "Machine learning system that predicts trends and optimizes operations.",
  "Digital SaaS platform with real-time analytics and workflow automation.",
  "Cloud based application for intelligent decision support.",
  "Smart automation platform using machine learning algorithms.",
  "AI powered monitoring system with predictive analytics.",
  "Web platform with analytics dashboard and automation tools.",
  "Intelligent SaaS platform improving operational efficiency."
];

const markets = [
  "Small and medium enterprises worldwide.",
  "Millions of students globally.",
  "Hospitals and healthcare providers internationally.",
  "Farmers in emerging agricultural markets.",
  "Retail businesses operating nationwide.",
  "Remote teams and startups globally.",
  "Restaurants and food chains worldwide.",
  "Manufacturing companies across global markets.",
  "Logistics companies operating internationally."
];

const revenues = [
  "Subscription based SaaS pricing model.",
  "Monthly and yearly subscription plans.",
  "Freemium model with premium enterprise features.",
  "Transaction based platform commission.",
  "Enterprise licensing and yearly contracts.",
  "Subscription plus usage based pricing.",
  "Advertising and premium subscription model.",
  "Commission on successful transactions."
];

/* =====================================
   GENERATE ADDITIONAL PITCHES
===================================== */

function generateExtraPitches(count = 100) {

  const generated = [];

  for (let i = 0; i < count; i++) {

    const pitch = {

      problem: problems[Math.floor(Math.random() * problems.length)],

      solution: solutions[Math.floor(Math.random() * solutions.length)],

      market: markets[Math.floor(Math.random() * markets.length)],

      revenue: revenues[Math.floor(Math.random() * revenues.length)],

      userId: "generated_seed_" + i,

      successLabel: Math.random() > 0.3 ? 1 : 0
    };

    generated.push(pitch);

  }

  return generated;

}

/* =====================================
   SEED DATABASE
===================================== */

async function seedData() {

  try {

    console.log("Generating additional pitches...");

    const generatedPitches = generateExtraPitches(100);

    const allPitches = [...seedPitches, ...generatedPitches];

    for (const pitch of allPitches) {

      await db.collection("pitches").add({
        ...pitch,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log("Inserted pitch:", pitch.userId);

    }

    console.log("All pitches inserted successfully!");
    console.log("Total pitches inserted:", allPitches.length);

    process.exit();

  } catch (error) {

    console.error("Error inserting data:", error);
    process.exit(1);

  }

}

seedData();