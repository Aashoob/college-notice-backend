// Load environment variables
require("dotenv").config();

// ========== IMPORTS ==========
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Models
const Notice = require("./models/Notice");
const PushToken = require("./models/PushToken");

// FCM Push Service
const PushService = require("./services/pushService");
const noticeRoutes = require("./routes/noticeRoutes");
// ========== APP INIT ==========
const app = express();

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());

// ========== ROUTES ==========

// Health check
app.get("/", (req, res) => {
  res.send("🎓 GDC Sumbal Notices API 🚀");
});
// Notice routes
app.use("/api/notices", noticeRoutes);

// Save FCM token from app
app.post("/api/save-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    await PushToken.findOneAndUpdate(
      { token },
      { token, lastActive: new Date() },
      { upsert: true, new: true }
    );

    console.log("📲 FCM token saved:", token.substring(0, 20) + "...");

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Token save error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new notice + send push
app.post("/api/notices", async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description required" });
    }

    const notice = new Notice({
      title,
      description,
    });

    await notice.save();
    console.log(`📝 Notice created: ${title}`);

    // 🔥 Send FCM push
    await PushService.sendPushNotification(
      `New Notice: ${title}`,
      description,
      {
        noticeId: notice._id.toString(),
        createdAt: notice.createdAt.toISOString(),
      }
    );

    res.status(201).json({
      success: true,
      notice,
    });
  } catch (error) {
    console.error("❌ Create notice error:", error);
    res.status(500).json({ message: "Failed to create notice" });
  }
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

// Test push manually
app.post("/api/test-push", async (req, res) => {
  try {
    const result = await PushService.sendPushNotification(
      "Test Push ✅",
      "This is a test notification from backend",
      { type: "test" }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug info
app.get("/api/debug", async (req, res) => {
  const tokenCount = await PushToken.countDocuments();
  const noticeCount = await Notice.countDocuments();

  res.json({
    status: "running",
    pushProvider: "FCM",
    registeredDevices: tokenCount,
    totalNotices: noticeCount,
  });
});

// ========== MONGODB ==========
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ========== SERVER START ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔔 Push notifications: FCM`);
});