const Room = require('../models/Room');
const crypto = require('crypto');

module.exports = (io) => {
  const roomUsers = new Map(); // roomId -> Set of users ( {socketId, userId, name} )
  
  // High-performance State Cache Matrices
  const roomCodeState = new Map(); // roomId -> active RAM code content
  const dirtyRooms = new Set();    // roomIds scheduled for background commit
  
  // Asynchronous Database Flush Loop (Runs every 5000ms)
  // Preserves scaling by guaranteeing no strict 1:1 Mongo update bottlenecks exist!
  setInterval(async () => {
    if (dirtyRooms.size === 0) return;
    
    // Snapshot the batch and instantly free the main set loop to receive simultaneous parallel keystrokes
    const flushBatch = Array.from(dirtyRooms);
    dirtyRooms.clear();
    
    for (const roomId of flushBatch) {
      try {
        const memoryContent = roomCodeState.get(roomId);
        if (memoryContent !== undefined) {
           await Room.findByIdAndUpdate(roomId, { content: memoryContent }).exec();
        }
      } catch (err) {
        console.error(`Scale Flush Warning: DB write failed for ${roomId}:`, err);
      }
    }
  }, 5000);

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
      
      // Hydrate newly connected Engineer with strict live RAM architecture buffer directly
      // Because this fetches from RAM, it prevents stale data if the engineer joined inside the 5-sec flush interval block!
      if (roomCodeState.has(roomId)) {
         socket.emit('sync-memory-state', { content: roomCodeState.get(roomId) });
      }
    });

    socket.on('code-change', ({ roomId, content }) => {
      socket.to(roomId).emit('code-update', content);
      
      // High Performance Scaling: Offload to RAM Cache instead of immediate heavy Mongo write
      roomCodeState.set(roomId, content);
      dirtyRooms.add(roomId);
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

    socket.on('destroy-room', ({ roomId }) => {
      socket.to(roomId).emit('room-destroyed');
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
