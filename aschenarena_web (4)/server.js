// Statischer Webserver + minimaler WebSocket-Relay (ohne Abhängigkeiten).
// Clients treten Räumen bei; jede Nachricht geht an alle anderen im selben Raum.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const rooms = new Map();
let nextId = 1;

const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/health') { res.writeHead(200); res.end('ok'); return; }
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUB, p));
  if (!file.startsWith(PUB)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Nicht gefunden'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

function frame(opcode, payload) {
  const len = payload.length;
  let head;
  if (len < 126) head = Buffer.from([0x80 | opcode, len]);
  else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x80 | opcode; head[1] = 126; head.writeUInt16BE(len, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x80 | opcode; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
  return Buffer.concat([head, payload]);
}
function sendText(c, obj) {
  if (c.socket.destroyed) return;
  try { c.socket.write(frame(1, Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj)))); } catch (e) {}
}

function onMessage(c, text) {
  let m; try { m = JSON.parse(text); } catch (e) { return; }
  if (m.t === 'join' && !c.room) {
    const name = String(m.room || '').slice(0, 40);
    if (!name) return;
    let r = rooms.get(name); if (!r) { r = new Set(); rooms.set(name, r); }
    if (r.size >= 4) { sendText(c, { t: 'full' }); return; }
    c.room = name; c.id = nextId++;
    r.forEach(o => sendText(o, { t: 'joined', id: c.id }));
    r.add(c);
    sendText(c, { t: 'welcome', id: c.id, peers: [...r].filter(o => o !== c).map(o => o.id) });
  } else if (m.t === 'msg' && c.room) {
    const r = rooms.get(c.room); if (!r) return;
    const out = JSON.stringify({ t: 'msg', topic: String(m.topic || '').slice(0, 8), data: m.data, from: c.id });
    r.forEach(o => { if (o !== c) sendText(o, out); });
  }
}

function drop(c) {
  if (c.closed) return; c.closed = true;
  if (c.room) {
    const r = rooms.get(c.room);
    if (r) { r.delete(c); r.forEach(o => sendText(o, { t: 'left', id: c.id })); if (!r.size) rooms.delete(c.room); }
  }
  try { c.socket.destroy(); } catch (e) {}
}

server.on('upgrade', (req, socket) => {
  if (!req.url.startsWith('/ws') || !req.headers['sec-websocket-key']) { socket.destroy(); return; }
  const accept = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  socket.setNoDelay(true);
  const c = { socket, room: null, id: 0, closed: false };
  let buf = Buffer.alloc(0), frag = [];
  socket.on('data', chunk => {
    buf = Buffer.concat([buf, chunk]);
    for (;;) {
      if (buf.length < 2) return;
      const fin = (buf[0] & 0x80) !== 0, op = buf[0] & 0x0f, masked = (buf[1] & 0x80) !== 0;
      let len = buf[1] & 0x7f, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      if (len > 200000) { drop(c); return; }
      if (buf.length < off + (masked ? 4 : 0) + len) return;
      let payload;
      if (masked) {
        const mask = buf.subarray(off, off + 4); off += 4;
        payload = Buffer.from(buf.subarray(off, off + len));
        for (let i = 0; i < len; i++) payload[i] ^= mask[i & 3];
      } else payload = Buffer.from(buf.subarray(off, off + len));
      buf = buf.subarray(off + len);
      if (op === 8) { try { socket.write(frame(8, Buffer.alloc(0))); } catch (e) {} drop(c); return; }
      if (op === 9) { socket.write(frame(10, payload)); continue; }
      if (op === 10) continue;
      if (op === 1 || op === 2 || op === 0) {
        frag.push(payload);
        if (fin) { const t = Buffer.concat(frag).toString('utf8'); frag = []; onMessage(c, t); }
      }
    }
  });
  socket.on('close', () => drop(c));
  socket.on('error', () => drop(c));
  c.timer = setInterval(() => { if (c.closed) clearInterval(c.timer); else try { socket.write(frame(9, Buffer.alloc(0))); } catch (e) {} }, 25000);
});

server.listen(PORT, () => console.log('Aschenarena laeuft auf Port ' + PORT));
