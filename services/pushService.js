const admin = require("firebase-admin");
const PushToken = require("../models/PushToken");
const path = require("path");

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      require(path.join(__dirname, "../serviceAccountKey.json"))
    ),
  });
}

class PushService {
  static async sendPushNotification(title, body, data = {}) {
    try {
      // Get all saved FCM tokens
      const tokens = await PushToken.find({});
      const fcmTokens = tokens.map(t => t.token).filter(Boolean);

      if (fcmTokens.length === 0) {
        console.log("⚠️ No FCM tokens found");
        return { success: false, message: "No devices registered" };
      }

      console.log(`📨 Sending FCM push to ${fcmTokens.length} devices`);

      const message = {
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          type: "new_notice",
        },
        tokens: fcmTokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      console.log(
        `✅ Push sent: ${response.successCount} success, ${response.failureCount} failed`
      );

      return { success: true, response };
    } catch (error) {
      console.error("❌ FCM push error:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = PushService;