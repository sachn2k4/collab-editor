const Room = require('../models/Room');
const Message = require('../models/Message');
const Version = require('../models/Version');
const { v4: uuidv4 } = require('uuid');

const createRoom = async (req, res) => {
  try {
    const { name, language } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    
    
    const room = await Room.create({
      name,
      owner: req.user._id,
      language: language || 'javascript',
    });
    
    res.status(201).json(room);
  } catch (error) {
    console.error('Create Room Error:', error);
    res.status(500).json({ message: 'Failed to create room' });
  }
};

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    console.error('Get Rooms Error:', error);
    res.status(500).json({ message: 'Failed to fetch rooms' });
  }
};

const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId).populate('owner', 'name email');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    console.error('Get Room By ID Error:', error);
    res.status(500).json({ message: 'Failed to fetch room details' });
  }
};

const saveVersion = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Code content is required to save' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    room.content = content;
    await room.save();

    const version = await Version.create({
      room: room._id,
      content,
      author: req.user._id,
    });

    res.status(201).json(version);
  } catch (error) {
    console.error('Save Version Error:', error);
    res.status(500).json({ message: 'Failed to save version' });
  }
};

const getVersions = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const versions = await Version.find({ room: room._id }).populate('author', 'name').sort({ createdAt: -1 });
    res.json(versions);
  } catch (error) {
    console.error('Get Versions Error:', error);
    res.status(500).json({ message: 'Failed to fetch version history' });
  }
};


const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    
    // Ensure only owner can delete
    if (room.owner.toString() !== req.user._id.toString()) {
       return res.status(403).json({ message: 'Not authorized to delete this room' });
    }
    
    await Room.findByIdAndDelete(req.params.roomId);
    await Message.deleteMany({ roomId: req.params.roomId });
    await Version.deleteMany({ room: room._id });
    
    res.json({ success: true, message: 'Room destroyed successfully' });
  } catch (error) {
    console.error('Delete Room Error:', error);
    res.status(500).json({ message: 'Failed to delete room' });
  }
};

module.exports = { createRoom, getRooms, getRoomById, saveVersion, getVersions, deleteRoom };