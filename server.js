// Load environment variables
require("dotenv").config();

// Imports
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// App init
const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= MONGODB CONNECTION =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ================= NOTICE SCHEMA & MODEL =================
const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Notice = mongoose.model("Notice", noticeSchema);

// ================= ROUTES =================

// Test route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// Get all notices
app.get("/api/notices", async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notices" });
  }
});

// Create a new notice
app.post("/api/notices", async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const notice = new Notice({
      title,
      description,
    });

    await notice.save();
    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: "Failed to create notice" });
  }
});

// ================= SERVER START =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});