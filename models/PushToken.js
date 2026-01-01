import mongoose from "mongoose";

const pushTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
});

export default mongoose.model("PushToken", pushTokenSchema);