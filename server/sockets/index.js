const Room = require('../models/Room');
const crypto = require('crypto');

module.exports = (io) => {
  const roomUsers = new Map(); // roomId -> Set of users ( {socketId, userId, name} )

  io.on('connection', (socket) => {
    socket.on('join-room', ({ roomId, user }) => {
      socket.join(roomId);

      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Map());
      }
      
      const usersInRoom = roomUsers.get(roomId);
      
      // Deduplicate by userId
      for (let [existingSocketId, existingUser] of usersInRoom.entries()) {
        if (existingUser.userId === user.userId) {
          usersInRoom.delete(existingSocketId);
        }
      }

      usersInRoom.set(socket.id, { socketId: socket.id, ...user });
      io.to(roomId).emit('user-joined', Array.from(usersInRoom.values()));
    });

    socket.on('code-change', ({ roomId, content }) => {
      socket.to(roomId).emit('code-update', content);
      Room.findOneAndUpdate({ roomId }, { content }).exec().catch(err => console.error("Code save err:", err));
    });

    socket.on('typing', ({ roomId, userName }) => {
      socket.to(roomId).emit('typing-indicator', { userName });
    });

    socket.on('send-message', ({ roomId, message, userName }) => {
      io.to(roomId).emit('receive-message', { id: crypto.randomUUID(), userName, message, timestamp: Date.now(), seenBy: [] });
    });

    socket.on('message-seen', ({ roomId, messageIds, userName }) => {
      socket.to(roomId).emit('message-seen-update', { messageIds, userName });
    });

    socket.on('language-change', ({ roomId, language, userName }) => {
      socket.to(roomId).emit('language-updated', { language, userName });
    });

    socket.on('leave-room', ({ roomId }) => {
      leaveRoom(socket, roomId);
    });

    socket.on('disconnecting', () => {
      socket.rooms.forEach(roomId => {
        if (roomId !== socket.id) leaveRoom(socket, roomId);
      });
    });
  });

  function leaveRoom(socket, roomId) {
    socket.leave(roomId);
    if (roomUsers.has(roomId)) {
      const usersInRoom = roomUsers.get(roomId);
      usersInRoom.delete(socket.id);
      io.to(roomId).emit('user-left', Array.from(usersInRoom.values()));
      if (usersInRoom.size === 0) roomUsers.delete(roomId);
    }
  }
};