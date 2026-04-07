const Message = require('../models/Message');

const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).limit(150);
    const formatted = messages.map(msg => ({
      id: msg.messageId,
      userName: msg.userName,
      message: msg.message,
      timestamp: msg.createdAt,
      seenBy: msg.seenBy
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Fetch Messages Error:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

const saveMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { messageId, userName, message, seenBy } = req.body;
    if (!messageId || !userName || !message) return res.status(400).json({ message: 'Missing fields' });

    await Message.create({ roomId, messageId, userName, message, seenBy: seenBy || [] });
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Save Message Error:', error);
    res.status(500).json({ message: 'Failed to save message' });
  }
};

const markMessagesSeen = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { messageIds, userName } = req.body;
    if (!messageIds || !messageIds.length || !userName) return res.status(400).json({ message: 'Missing fields' });

    await Message.updateMany(
       { roomId, messageId: { $in: messageIds } },
       { $addToSet: { seenBy: userName } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark Seen Error:', error);
    res.status(500).json({ message: 'Failed to update receipt statuses' });
  }
};

module.exports = { getRoomMessages, saveMessage, markMessagesSeen };