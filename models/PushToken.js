const mongoose = require("mongoose");

const pushTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ✅ Explicitly mark token type
    type: {
      type: String,
      enum: ["fcm"],
      required: true,
      default: "fcm",
    },

    deviceId: {
      type: String,
      default: "unknown",
    },

    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ✅ Auto-delete tokens inactive for 90 days
pushTokenSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

module.exports = mongoose.model("PushToken", pushTokenSchema);