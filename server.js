const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html by default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const users = {};
const rooms = {};

// Helper: format time
function getTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','\"':'&quot;'}[tag]));
}

// REST endpoint for available rooms
app.get('/rooms', (req, res) => {
  res.json(Object.keys(rooms));
});

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    // Sanitize and limit username and room
    username = escapeHtml(username).slice(0, 20);
    room = escapeHtml(room).slice(0, 20);
    // Username uniqueness check
    if (Object.values(users).some(u => u.username === username)) {
      socket.emit('usernameError', 'Username already taken.');
      return;
    }
    // Join room
    socket.join(room);
    users[socket.id] = { username, room };
    if (!rooms[room]) rooms[room] = [];
    if (!rooms[room].includes(username)) rooms[room].push(username);
    // Welcome message
    socket.emit('message', { username: 'System', text: `Welcome to ${room}, ${username}!`, time: getTime() });
    // Broadcast to room
    socket.broadcast.to(room).emit('message', { username: 'System', text: `${username} has joined the chat.`, time: getTime() });
    // Update user and room lists
    io.to(room).emit('roomUsers', { room, users: rooms[room] });
    io.emit('roomList', Object.keys(rooms));
  });

  socket.on('chatMessage', (msg) => {
    const user = users[socket.id];
    if (!user || !msg.trim()) return;
    io.to(user.room).emit('message', { username: user.username, text: msg, time: getTime() });
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      // Remove user from room
      rooms[user.room] = rooms[user.room].filter(u => u !== user.username);
      if (rooms[user.room].length === 0) delete rooms[user.room];
      // Notify others
      socket.broadcast.to(user.room).emit('message', { username: 'System', text: `${user.username} has left the chat.`, time: getTime() });
      io.to(user.room).emit('roomUsers', { room: user.room, users: rooms[user.room] || [] });
      io.emit('roomList', Object.keys(rooms));
      delete users[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 