// models/Message.js
const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  url: String, width: Number, height: Number, bytes: Number, publicId: String,
}, { _id: false });

const MessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', index: true },
  clientMessageId: { type: String, index: true },
  senderId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  text:   { type: String, default: '' },
  images: { type: [ImageSchema], default: [] },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

MessageSchema.index({ conversationId: 1, createdAt: -1 });

MessageSchema.pre('validate', function(next){
  if (!this.text && (!this.images || this.images.length === 0)) {
    return next(new Error('Message must have text or images.'));
  }
  next();
});
const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
