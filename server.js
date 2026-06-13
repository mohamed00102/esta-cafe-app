const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Serve static files from the current directory
app.use(express.static(__dirname));

io.on('connection', (socket) => {
  console.log('📱 A device connected:', socket.id);

  // Listen for data updates from any device
  socket.on('sync-data', (payload) => {
    // payload should contain { key: 'resta_key', data: ... }
    // Broadcast this update to ALL OTHER connected devices
    socket.broadcast.emit('sync-data', payload);
  });

  socket.on('disconnect', () => {
    console.log('❌ Device disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on all network interfaces`);
  console.log(`🌍 Local testing URL: http://localhost:${PORT}`);
  console.log(`📱 Mobile testing URL: http://192.168.1.181:${PORT} (ensure devices are on the same Wi-Fi)`);
});
