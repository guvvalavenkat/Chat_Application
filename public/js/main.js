document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const roomInput = document.getElementById('room');
  const roomList = document.getElementById('roomList');

  // Fetch available rooms from the server
  fetch('/rooms')
    .then(res => res.json())
    .then(rooms => {
      roomList.innerHTML = '';
      rooms.forEach(room => {
        const div = document.createElement('div');
        div.textContent = room;
        div.onclick = () => {
          roomInput.value = room;
        };
        roomList.appendChild(div);
      });
    });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const room = roomInput.value.trim();
    if (!username || !room) return;
    // Store username and room in localStorage
    localStorage.setItem('username', username);
    localStorage.setItem('room', room);
    window.location.href = 'chat.html';
  });
}); 