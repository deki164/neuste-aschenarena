/* Raum-Adapter: gleiche Schnittstelle wie die Artifact-Raumfunktion (join, emit, on, onPeers, leave),
   aber über den WebSocket-Relay dieses Servers. */
(function (root) {
  function relayUrl() {
    var base = '';
    try { base = localStorage.getItem('relayUrl') || ''; } catch (e) {}
    if (!base) base = root.location && /^https?:/.test(root.location.protocol) ? root.location.origin : '';
    if (!base) return null;
    return base.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws';
  }
  function join(name) {
    return new Promise(function (resolve, reject) {
      var url = relayUrl();
      if (!url) { reject({ code: 'no-server' }); return; }
      var ws = new root.WebSocket(url), handlers = {}, peerCbs = [], done = false;
      var api = {
        emit: function (topic, data) { try { if (ws.readyState === 1) ws.send(JSON.stringify({ t: 'msg', topic: topic, data: data })); } catch (e) {} return Promise.resolve(); },
        on: function (topic, fn) { (handlers[topic] = handlers[topic] || []).push(fn); },
        onPeers: function (fn) { peerCbs.push(fn); },
        leave: function () { try { ws.close(); } catch (e) {} }
      };
      var timer = setTimeout(function () { if (!done) { done = true; try { ws.close(); } catch (e) {} reject({ code: 'timeout' }); } }, 60000);
      ws.onopen = function () { ws.send(JSON.stringify({ t: 'join', room: name })); };
      ws.onerror = function () { if (!done) { done = true; clearTimeout(timer); reject({ code: 'ws-error' }); } };
      ws.onclose = function () {
        if (!done) { done = true; clearTimeout(timer); reject({ code: 'closed' }); return; }
        peerCbs.forEach(function (f) { f({ joined: [], left: [{ peer: 'relay' }, { peer: api.hostId }] }); });
      };
      ws.onmessage = function (ev) {
        var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (m.t === 'welcome') { if (!done) { done = true; clearTimeout(timer); resolve(api); } }
        else if (m.t === 'full') { if (!done) { done = true; clearTimeout(timer); reject({ code: 'full' }); } }
        else if (m.t === 'msg') { var hs = handlers[m.topic] || []; for (var i = 0; i < hs.length; i++) { try { hs[i]({ data: m.data, peer: m.from, isMe: false }); } catch (e) {} } }
        else if (m.t === 'left') { peerCbs.forEach(function (f) { f({ joined: [], left: [{ peer: m.id }] }); }); }
        else if (m.t === 'joined') { peerCbs.forEach(function (f) { f({ joined: [{ peer: m.id }], left: [] }); }); }
      };
    });
  }
  root.RelayRoom = { join: join, available: function () { return !!relayUrl(); } };
})(typeof window !== 'undefined' ? window : globalThis);
