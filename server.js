const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// keep a short in-memory list of recent orders so displays can sync on reconnect
const RECENT_MAX = 60;
const orders = [];

io.on('connection', (socket) => {
  console.log('Client connected', socket.id);

  // send current recent orders to the client so displays immediately show current state
  socket.emit('init-orders', orders.slice().reverse());

  socket.on('ready-order', (payload) => {
    // payload: { order: 'A123', note: '' }
    const now = Date.now();
    const id = 'o' + now + Math.floor(Math.random() * 900 + 100);
    const entry = {
      id,
      order: String(payload.order || '').trim(),
      note: payload.note || '',
      ts: now
    };
    // push to front
    orders.unshift(entry);
    // limit buffer
    if (orders.length > RECENT_MAX) orders.pop();

    // broadcast the canonical entry (with id + ts)
    io.emit('ready-order', entry);
  });

  // propagate a remove-order event so displays can remove a shown order
  socket.on('remove-order', (payload) => {
    // payload: { id: 'o123' } or { order: 'A123' }
    let removedId = null;
    if (payload && payload.id) {
      const idx = orders.findIndex(o => o.id === payload.id);
      if (idx !== -1) { removedId = orders[idx].id; orders.splice(idx,1); }
    } else if (payload && payload.order) {
      // fallback: match by order string (may remove multiple)
      const idx = orders.findIndex(o => o.order === String(payload.order).trim());
      if (idx !== -1) { removedId = orders[idx].id; orders.splice(idx,1); }
    }

    // broadcast removal to clients; include id when available
    io.emit('remove-order', { id: removedId, order: payload.order });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
