const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '// Write your code here' },
  language: { type: String, default: 'javascript' },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);