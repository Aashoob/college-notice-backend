const Notice = require("../models/Notice");
const PushService = require("../services/pushService");

// Get all notices
const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ isActive: true })
      .sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create notice with push notification
const createNotice = async (req, res) => {
  try {
    const { title, description, priority = "normal" } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description required" });
    }

    // Create notice
    const notice = new Notice({
      title,
      description,
      priority
    });

    await notice.save();
    console.log(`📝 Notice created: ${title}`);

    // Send push notification
    const pushTitle = priority === "urgent" ? `🔴 ${title}` : 
                     priority === "high" ? `⚠️ ${title}` : 
                     `📢 ${title}`;
    
    const pushResult = await PushService.sendPushNotification(
      pushTitle,
      description,
      {
        noticeId: notice._id.toString(),
        title: notice.title,
        createdAt: notice.createdAt
      }
    );

    res.status(201).json({
      success: true,
      notice,
      pushNotification: pushResult
    });

  } catch (error) {
    console.error("❌ Create error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotices,
  createNotice
};