const { Expo } = require("expo-server-sdk");
const PushToken = require("../models/PushToken");

const expo = new Expo();

class PushService {
  static async sendPushNotification(title, body, data = {}) {
    try {
      // Get all saved tokens
      const tokens = await PushToken.find({});
      const validTokens = tokens.map(t => t.token).filter(token => Expo.isExpoPushToken(token));
      
      if (validTokens.length === 0) {
        console.log("⚠️ No devices to notify");
        return { success: false, message: "No devices registered" };
      }

      console.log(`📤 Sending to ${validTokens.length} devices...`);

      // Create messages
      const messages = validTokens.map(token => ({
        to: token,
        sound: "default",
        title,
        body: body.length > 100 ? body.substring(0, 100) + "..." : body,
        data: {
          ...data,
          type: "new_notice",
          sentAt: new Date().toISOString()
        }
      }));

      // Send in chunks
      const chunks = expo.chunkPushNotifications(messages);
      let sentCount = 0;

      for (const chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
          sentCount += chunk.length;
        } catch (error) {
          console.error("❌ Error sending chunk:", error);
        }
      }

      console.log(`✅ Sent to ${sentCount} devices`);
      return { 
        success: true, 
        sent: sentCount, 
        total: validTokens.length 
      };
      
    } catch (error) {
      console.error("❌ Push error:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = PushService;