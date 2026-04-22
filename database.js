const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // UUID v7
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    gender: { type: String, enum: ["male", "female"] },
    gender_probability: Number,
    age: Number,
    age_group: { type: String, enum: ["child", "teenager", "adult", "senior"] },
    country_id: { type: String, uppercase: true },
    country_name: String,
    country_probability: Number,
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

const Profile = mongoose.model("Profile", profileSchema);

let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
      })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = { connectDB, Profile };
