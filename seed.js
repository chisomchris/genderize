require("dotenv").config();
const fs = require("fs");
const { connectDB, Profile } = require("./database");
const { uuidv7 } = require("uuidv7");

const seed = async () => {
  await connectDB();
  const data = JSON.parse(
    fs.readFileSync("./utils/seed_profiles.json", "utf-8"),
  );

  const ops = data.map((p) => ({
    updateOne: {
      filter: { name: p.name.toLowerCase().trim() },
      update: { $setOnInsert: { ...p, _id: p.id || uuidv7() } },
      upsert: true,
    },
  }));

  const res = await Profile.bulkWrite(ops);

  console.log(
    `Seeding done. Added: ${res.upsertedCount}, Skipped: ${res.matchedCount}`,
  );
  process.exit();
};

seed();
