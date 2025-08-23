// models/Conversation.js
const mongoose = require("mongoose");
const ConversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
  pairKey: { type: String, unique: true, index: true },
  lastMessageAt: { type: Date, default: Date.now, index: true },
  lastMessageText: { type: String, default: '' },
  unread: { type: Map, of: Number, default: {} }, // userId -> count
}, { timestamps: true });

ConversationSchema.pre('validate', function(next) {
  if (this.participants?.length === 2) {
    const [a,b] = this.participants.map(id => id.toString()).sort();
    this.pairKey = `${a}_${b}`;
  }
  next();
});
const Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = Conversation;