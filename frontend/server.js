const fs = require('fs');
const https = require('https');
const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = 8000;

// Serve static files
app.use(express.static(__dirname));

// HTTPS options
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

// Shared world state persisted to disk
const WORLD_STATE_PATH = path.join(__dirname, 'world-state.json');
const worldState = new Map();
let sharedXrMode = 'VR';
const socketToClientId = new Map();

let saveTimer = null;

function loadWorldState() {
  if (!fs.existsSync(WORLD_STATE_PATH)) return;
  try {
    const raw = fs.readFileSync(WORLD_STATE_PATH, 'utf8');
    if (!raw.trim()) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.objects)) {
      data.objects.forEach(obj => {
        if (obj && obj.id && obj.source) {
          worldState.set(obj.id, obj);
        }
      });
    }
    if (data.xrMode === 'VR' || data.xrMode === 'AR') {
      sharedXrMode = data.xrMode;
    }
  } catch (err) {
    console.error('Failed to load world state:', err);
  }
}

function scheduleSaveWorldState() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const payload = {
      xrMode: sharedXrMode,
      objects: Array.from(worldState.values())
    };
    try {
      fs.writeFileSync(WORLD_STATE_PATH, JSON.stringify(payload, null, 2));
    } catch (err) {
      console.error('Failed to save world state:', err);
    }
  }, 150);
}

function broadcast(message, excludeSocket) {
  const payload = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client !== excludeSocket) {
      client.send(payload);
    }
  });
}

// Load persisted world state before accepting connections
loadWorldState();

// Start HTTPS + WebSocket server
const server = https.createServer(options, app);
const wss = new WebSocket.Server({ server });

wss.on('connection', socket => {
  // Send current world state on connect
  socket.send(JSON.stringify({
    type: 'init',
    objects: Array.from(worldState.values()),
    xrMode: sharedXrMode
  }));

  socket.on('message', data => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (err) {
      return;
    }

    if (!msg || !msg.type) return;
    if (msg.senderId) {
      socketToClientId.set(socket, msg.senderId);
    }

    if (msg.type === 'create' && msg.object && msg.object.id) {
      if (!msg.object.source && msg.object.base64) {
        msg.object.source = { type: 'base64', value: msg.object.base64 };
        delete msg.object.base64;
      }
      if (!msg.object.source) return;

      worldState.set(msg.object.id, msg.object);
      scheduleSaveWorldState();
      broadcast({
        type: 'create',
        object: msg.object,
        senderId: msg.senderId
      }, socket);
      return;
    }

    if (msg.type === 'xr-mode' && (msg.mode === 'VR' || msg.mode === 'AR')) {
      sharedXrMode = msg.mode;
      scheduleSaveWorldState();
      broadcast({
        type: 'xr-mode',
        mode: sharedXrMode,
        senderId: msg.senderId
      }, socket);
      return;
    }

    if (msg.type === 'replace' && msg.id && msg.source) {
      const existing = worldState.get(msg.id);
      if (existing) {
        existing.source = msg.source;
        if (typeof msg.isLoading === 'boolean') {
          existing.isLoading = msg.isLoading;
        }
        scheduleSaveWorldState();
        broadcast({
          type: 'replace',
          id: msg.id,
          source: msg.source,
          isLoading: msg.isLoading,
          senderId: msg.senderId
        }, socket);
      }
      return;
    }

    if (msg.type === 'update' && msg.id && msg.transform) {
      const existing = worldState.get(msg.id);
      if (existing) {
        existing.transform = msg.transform;
        scheduleSaveWorldState();
        broadcast({
          type: 'update',
          id: msg.id,
          transform: msg.transform,
          senderId: msg.senderId
        }, socket);
      }
      return;
    }

    if (msg.type === 'user-state' && msg.position) {
      broadcast({
        type: 'user-state',
        position: msg.position,
        senderId: msg.senderId
      }, socket);
      return;
    }

    if (msg.type === 'user-leave' && msg.senderId) {
      socketToClientId.delete(socket);
      broadcast({
        type: 'user-leave',
        senderId: msg.senderId
      }, socket);
      return;
    }


  socket.on('close', () => {
    const senderId = socketToClientId.get(socket);
    if (senderId) {
      socketToClientId.delete(socket);
      broadcast({ type: 'user-leave', senderId });
    }
  });
    if (msg.type === 'delete' && msg.id) {
      if (worldState.delete(msg.id)) {
        scheduleSaveWorldState();
        broadcast({
          type: 'delete',
          id: msg.id,
          senderId: msg.senderId
        }, socket);
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS server running at https://0.0.0.0:${PORT}`);
});
