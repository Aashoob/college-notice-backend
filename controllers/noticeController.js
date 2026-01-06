const Notice = require("../models/Notice");
const PushService = require("../services/pushService");

// GET all notices
exports.getNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    return res.status(200).json(notices);
  } catch (error) {
    console.error("❌ Get notices error:", error);
    return res.status(500).json({ error: "Failed to fetch notices" });
  }
};

// CREATE notice + send FCM push
exports.createNotice = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: "Title and description are required",
      });
    }

    // 1️⃣ Save notice
    const notice = await Notice.create({
      title,
      description,
    });

    // 2️⃣ Send FCM push (non-blocking failure safe)
    try {
      await PushService.sendPushNotification(
        title,
        description,
        { noticeId: notice._id.toString() }
      );
    } catch (pushErr) {
      console.error("⚠️ Push failed but notice saved:", pushErr.message);
    }

    // 3️⃣ Respond to client
    return res.status(201).json(notice);
  } catch (error) {
    console.error("❌ Create notice error:", error);
    return res.status(500).json({ error: "Failed to create notice" });
  }
};