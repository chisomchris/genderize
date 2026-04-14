const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    gender: String,
    gender_probability: Number,
    sample_size: Number,
    age: Number,
    age_group: String,
    country_id: String,
    country_probability: Number,
    created_at: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    toJSON: { virtuals: false },
    toObject: { virtuals: false },
  },
);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

const Profile = mongoose.model("Profile", profileSchema);

module.exports = { connectDB, Profile };
