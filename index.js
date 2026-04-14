const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/api", (req, res) => {
  res.status(200).json({
    status: "success",
    message:
      "Gender Classification API is operational. Use /api/classify?name=<name> to begin.",
  });
});

app.get("/api/classify", async (req, res) => {
  const { name } = req.query;

  // 1. Missing or empty name (400)
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
    message: `The requested endpoint ${req.originalUrl} does not exist.`,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
