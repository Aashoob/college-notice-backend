const Notice = require("../models/Notice");
const PushService = require("../services/pushService");

exports.createNotice = async (req, res, skipResponse = false) => {
  try {
    const notice = await Notice.create(req.body);

    // 🔥 SEND FCM PUSH HERE
    await PushService.sendPushNotification(
      notice.title,
      notice.description,
      { noticeId: notice._id }
    );

    if (!skipResponse) {
      return res.status(201).json(notice);
    }

    return res.status(201).json(notice);
  } catch (error) {
    console.error("❌ Create notice error:", error);
    if (!skipResponse) {
      return res.status(500).json({ error: "Failed to create notice" });
    }
    throw error;
  }
};