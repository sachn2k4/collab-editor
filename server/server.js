const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const corsOptions = {
  origin: true,
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

require('./sockets')(io);

// Deployment Path Resolution
if (process.env.NODE_ENV === 'production') {
  // Serve frontend build output
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // Catch-all route to serve React index.html for unknown routes
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
} else {
  app.get('/', (req, res) => res.send('API is running...'));
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));