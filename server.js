// Load environment variables
require("dotenv").config();

// ========== IMPORTS ==========
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { Expo } = require("expo-server-sdk"); // <-- ADD THIS LINE

// Import models
const Notice = require("./models/Notice");
const PushToken = require("./models/PushToken");

// Initialize Expo
const expo = new Expo(); // <-- ADD THIS LINE

// App init
const app = express();

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());

// ========== PUSH FUNCTION ==========
async function sendPushNotification(title, body, data = {}) {
  try {
    // Get all saved tokens
    const tokens = await PushToken.find({});
    const validTokens = tokens.map(t => t.token);
    
    if (validTokens.length === 0) {
      console.log("⚠️ No devices registered for push");
      return { success: false, sent: 0, message: "No devices" };
    }

    console.log(`📤 Sending push to ${validTokens.length} devices...`);

    // Create messages
    const messages = [];
    for (let token of validTokens) {
      // Check if token is valid
      if (!Expo.isExpoPushToken(token)) {
        console.log(`Invalid token: ${token}`);
        continue;
      }

      messages.push({
        to: token,
        sound: 'default',
        title: title,
        body: body.length > 100 ? body.substring(0, 100) + '...' : body,
        data: { ...data, type: 'new_notice' }
      });
    }

    // Send in chunks
    const chunks = expo.chunkPushNotifications(messages);
    let sentCount = 0;

    for (let chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
        sentCount += chunk.length;
      } catch (error) {
        console.error('Error sending chunk:', error);
      }
    }

    console.log(`✅ Push sent to ${sentCount} devices`);
    return { 
      success: true, 
      sent: sentCount, 
      totalDevices: validTokens.length 
    };
    
  } catch (error) {
    console.error('❌ Push error:', error);
    return { success: false, error: error.message };
  }
}

// ========== ROUTES ==========

// Save push token from mobile app
app.post("/api/save-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    // Validate token
    if (!Expo.isExpoPushToken(token)) {
      return res.status(400).json({ message: "Invalid Expo push token" });
    }

    // Save to database (update if exists)
    await PushToken.findOneAndUpdate(
      { token },
      { token, lastActive: new Date() },
      { upsert: true, new: true }
    );

    console.log("📲 Push token saved:", token.substring(0, 20) + "...");
    
    // Send welcome notification
    await sendPushNotification(
      "Welcome to GDC Sumbal!",
      "You'll receive notifications for new college notices.",
      { type: "welcome" }
    );

    res.json({ success: true, message: "Token saved" });
    
  } catch (err) {
    console.error("❌ Token save error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create new notice WITH PUSH NOTIFICATION
app.post("/api/notices", async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 1. Create notice
    const notice = new Notice({
      title,
      description,
    });

    await notice.save();
    console.log(`📝 Notice created: ${title}`);

    // 2. Send push notification
    const pushResult = await sendPushNotification(
      `New Notice: ${title}`,
      description,
      { 
        noticeId: notice._id.toString(),
        createdAt: notice.createdAt 
      }
    );

    // 3. Return response
    res.status(201).json({
      success: true,
      notice,
      pushNotification: pushResult
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

// Test push endpoint
app.post("/api/test-push", async (req, res) => {
  try {
    const result = await sendPushNotification(
      "Test Push ✅",
      "This is a test notification from GDC Sumbal backend!",
      { type: "test" }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("🎓 GDC Sumbal Notices API 🚀");
});

// Debug endpoint
app.get("/api/debug", async (req, res) => {
  const tokenCount = await PushToken.countDocuments();
  const noticeCount = await Notice.countDocuments();
  
  res.json({
    status: "running",
    pushEnabled: true,
    registeredDevices: tokenCount,
    totalNotices: noticeCount
  });
});

// ========== MONGODB CONNECTION ==========
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ========== SERVER START ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Push notifications: ENABLED`);
  console.log(`🔗 Test push: POST http://localhost:${PORT}/api/test-push`);
});