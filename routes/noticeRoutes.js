const express = require("express");
const router = express.Router();

const {
  getNotices,
  createNotice,
} = require("../controllers/noticeController");

const PushService = require("../services/pushService");

// GET /api/notices
router.get("/", getNotices);

// POST /api/notices
router.post("/", createNotice);

// POST /api/notices/test-push
router.post("/test-push", async (req, res) => {
  try {
    const result = await PushService.sendPushNotification(
      "Test Notification",
      "FCM is working 🎉",
      { source: "test-route" }
    );

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("❌ Test push error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;