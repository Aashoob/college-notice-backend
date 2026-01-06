const admin = require("firebase-admin");
const PushToken = require("../models/PushToken");

// 🔥 Firebase Admin init (keep yours – it is OK)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

class PushService {
  static async sendPushNotification(title, body, data = {}) {
    try {
      // ✅ Get ONLY FCM tokens
      const tokens = await PushToken.find({ type: "fcm" }).lean();

      if (!tokens.length) {
        console.log("⚠️ No FCM tokens found");
        return { success: false, message: "No devices registered" };
      }

      console.log(`📤 Sending push to ${tokens.length} devices`);

      const results = [];

      for (const t of tokens) {
        try {
          const response = await admin.messaging().send({
            token: t.token,
            notification: {
              title,
              body,
            },
            data: {
              ...data,
              type: "new_notice",
            },
            android: {
              priority: "high",
            },
          });

          results.push({ token: t.token, success: true, response });
        } catch (err) {
          console.error("❌ Push failed for token:", t.token);
          console.error(err.message);

          // 🗑️ Auto-delete invalid tokens
          if (
            err.code === "messaging/registration-token-not-registered" ||
            err.code === "messaging/invalid-registration-token"
          ) {
            await PushToken.deleteOne({ token: t.token });
            console.log("🗑️ Removed invalid FCM token");
          }

          results.push({ token: t.token, success: false, error: err.message });
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error("❌ PushService error:", error);
      throw error;
    }
  }
}

module.exports = PushService;