require("dotenv").config();
const express = require("express");
const { connectDB, Profile } = require("./database");
const { uuidv7 } = require("uuidv7");
const parseNLQ = require("./utils/queryParser");
const buildMongoQuery = require("./utils/queryBuilder");
const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/", (req, res) => {
  res.status(200).send("Welcome to Gender Classification API");
});

app.get("/api", (req, res) => {
  res.status(200).json({
    status: "success",
    message:
      "Gender Classification API is operational. Use /api/classify?name=<name> to begin.",
  });
});

app.get("/api/profiles", async (req, res) => {
  try {
    await connectDB();
    let {
      sort_by = "created_at",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    limit = Math.min(parseInt(limit), 50);

    const mongoQuery = buildMongoQuery(req.query);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const profiles = await Profile.find(mongoQuery)
      .sort({ [sort_by]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    const total = await Profile.countDocuments(mongoQuery);

    res.json({
      status: "success",
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      data: profiles,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// 2. INTELLIGENT SEARCH
app.get("/api/profiles/search", async (req, res) => {
  try {
    await connectDB();
    let { q, page = 1, limit = 10 } = req.query;
    limit = Math.min(parseInt(limit), 50);

    if (!q)
      return res
        .status(400)
        .json({ status: "error", message: "Query parameter 'q' is required" });

    const nlqFilters = parseNLQ(q);
    if (!nlqFilters)
      return res
        .status(400)
        .json({ status: "error", message: "Unable to interpret query" });

    const mongoQuery = buildMongoQuery(nlqFilters);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const profiles = await Profile.find(mongoQuery).skip(skip).limit(limit);
    const total = await Profile.countDocuments(mongoQuery);

    res.json({
      status: "success",
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      data: profiles,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

app.get("/api/profiles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await Profile.findById(id);

    if (!profile) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: profile,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

app.post("/api/profiles", async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      status: "error",
      message: "Request body is missing or empty",
    });
  }
  let { name } = req.body;

  if (typeof name === "string") {
    name = name.trim().toLowerCase();
  }

  if (!name || name === "") {
    return res
      .status(400)
      .json({ status: "error", message: "Name parameter is required" });
  }
  if (typeof name !== "string" || !isNaN(name)) {
    return res.status(422).json({
      status: "error",
      message: "Name must be a valid string and cannot be a number",
    });
  }

  try {
    const existingProfile = await Profile.findOne({ name });
    if (existingProfile) {
      return res.status(200).json({
        status: "success",
        message: "Profile already exists",
        data: {
          id: existingProfile._id,
          name: existingProfile.name,
          gender: existingProfile.gender,
          gender_probability: existingProfile.gender_probability,
          sample_size: existingProfile.sample_size,
          age: existingProfile.age,
          age_group: existingProfile.age_group,
          country_id: existingProfile.country_id,
          country_probability: existingProfile.country_probability,
          created_at: existingProfile.created_at,
        },
      });
    }

    const [genderRes, ageRes, nationRes] = await Promise.all([
      fetch(`https://api.genderize.io/?name=${encodeURIComponent(name)}`),
      fetch(`https://api.agify.io/?name=${encodeURIComponent(name)}`),
      fetch(`https://api.nationalize.io/?name=${encodeURIComponent(name)}`),
    ]);

    const [genderData, ageData, nationData] = await Promise.all([
      genderRes.json(),
      ageRes.json(),
      nationRes.json(),
    ]);

    if (!genderData.gender || genderData.count === 0) {
      return res
        .status(502)
        .json({ status: "error", message: "No gender prediction available" });
    }
    if (ageData.age === null) {
      return res
        .status(502)
        .json({ status: "error", message: "No age prediction available" });
    }
    if (!nationData.country || nationData.country.length === 0) {
      return res
        .status(502)
        .json({ status: "error", message: "No country data available" });
    }

    const topCountry = nationData.country.reduce((prev, curr) =>
      prev.probability > curr.probability ? prev : curr,
    );

    const profileData = {
      _id: uuidv7(),
      name: name,
      gender: genderData.gender,
      gender_probability: genderData.probability,
      sample_size: genderData.count,
      age: ageData.age,
      age_group: require("./utils/getAgeGroup")(ageData.age),
      country_id: topCountry.country_id,
      country_probability: topCountry.probability,
      created_at: new Date().toISOString(),
    };

    const newProfile = await Profile.create(profileData);

    return res.status(201).json({
      status: "success",
      data: {
        id: newProfile._id,
        name: newProfile.name,
        gender: newProfile.gender,
        gender_probability: newProfile.gender_probability,
        sample_size: newProfile.sample_size,
        age: newProfile.age,
        age_group: newProfile.age_group,
        country_id: newProfile.country_id,
        country_probability: newProfile.country_probability,
        created_at: newProfile.created_at,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

app.delete("/api/profiles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProfile = await Profile.findByIdAndDelete(id);
    if (!deletedProfile) {
      return res.status(404).json({
        status: "error",
        message: `Profile with ID ${id} not found`,
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error occurred during deletion",
    });
  }
});

app.get("/api/classify", async (req, res) => {
  const { name } = req.query;
  if (name === undefined || name === "") {
    return res.status(400).json({
      status: "error",
      message: "Name parameter is required",
    });
  }
  if (typeof name !== "string" || Array.isArray(name) || !isNaN(name)) {
    return res.status(422).json({
      status: "error",
      message: "Name must be a valid string and cannot be a number",
    });
  }

  try {
    const response = await fetch(
      `https://api.genderize.io/?name=${encodeURIComponent(name)}`,
    );
    const rawData = await response.json();
    if (rawData.gender === null || rawData.count === 0) {
      return res.status(500).json({
        status: "error",
        message: "No prediction available for the provided name",
      });
    }

    res.json({
      status: "success",
      data: {
        name: rawData.name,
        gender: rawData.gender,
        probability: rawData.probability,
        sample_size: rawData.count,
        is_confident: rawData.probability >= 0.7 && rawData.count >= 100,
        processed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(502).json({
      status: "error",
      message: "Failed to fetch or process classification data",
    });
  }
});

// Not Found (404) Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `The requested ${req.method} method for ${req.originalUrl} does not exist.`,
  });
});

// server.js
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server stabilized and running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server due to DB connection:", error);
  }
};

startServer();
