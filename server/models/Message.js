const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  messageId: { type: String, required: true, unique: true },
  userName: { type: String, required: true },
  message: { type: String, required: true },
  seenBy: { type: [String], default: [] }
}, { timestamps: true });

messageSchema.index({ roomId: 1, createdAt: 1 });
module.exports = mongoose.model('Message', messageSchema);