const socket = io();

const username = localStorage.getItem('username');
const room = localStorage.getItem('room');
if (!username || !room) {
  window.location.href = 'index.html';
}

document.getElementById('room-title').textContent = `Room: ${room}`;

// Join the room
socket.emit('joinRoom', { username, room });

const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const messagesDiv = document.getElementById('messages');
const usersList = document.getElementById('users');
const roomsList = document.getElementById('rooms');

// Message formatting (basic: bold, italics, links)
function formatMessage(text) {
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // bold
    .replace(/\*(.*?)\*/g, '<i>$1</i>') // italics
    .replace(/(https?:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>'); // links
  return formatted;
}

// Receive message
socket.on('message', msg => {
  const div = document.createElement('div');
  div.classList.add('message');
  
  // Determine if message is sent by current user or received
  if (msg.username === username) {
    div.classList.add('sent');
  } else if (msg.username === 'System') {
    div.classList.add('system');
  } else {
    div.classList.add('received');
  }
  
  div.innerHTML = `
    <div class="meta">${msg.username === username ? 'You' : msg.username} <span>${msg.time}</span></div>
    <div class="text">${formatMessage(msg.text)}</div>
  `;
  
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Update user list
socket.on('roomUsers', ({ room, users }) => {
  usersList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = user === username ? `${user} (You)` : user;
    if (user === username) {
      li.style.fontWeight = '600';
      li.style.color = '#128C7E';
    }
    usersList.appendChild(li);
  });
});

// Update room list
socket.on('roomList', rooms => {
  roomsList.innerHTML = '';
  rooms.forEach(r => {
    const li = document.createElement('li');
    li.textContent = r;
    if (r === room) li.classList.add('active');
    li.onclick = () => {
      if (r !== room) {
        localStorage.setItem('room', r);
        window.location.reload();
      }
    };
    roomsList.appendChild(li);
  });
});

// Send message
messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const msg = messageInput.value.trim();
  if (!msg) return;
  socket.emit('chatMessage', msg);
  messageInput.value = '';
  messageInput.focus();
});

// Handle username error from server
socket.on('usernameError', msg => {
  alert(msg);
  localStorage.removeItem('username');
  window.location.href = 'index.html';
});

// Notification for new messages (if not focused)
let windowFocused = true;
window.onfocus = () => { windowFocused = true; document.title = 'ChatApp'; };
window.onblur = () => { windowFocused = false; };
socket.on('message', msg => {
  if (!windowFocused && msg.username !== username) {
    document.title = 'New message! - ChatApp';
  }
});

// Auto-focus on message input
messageInput.focus(); 