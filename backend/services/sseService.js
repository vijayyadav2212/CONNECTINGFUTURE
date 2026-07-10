const sseClients = new Set();

function addSseClient(res) {
  sseClients.add(res);
}

function removeSseClient(res) {
  sseClients.delete(res);
}

function broadcastSse(event, data) {
  const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch (err) {
      // Clean up dead connections
      sseClients.delete(res);
    }
  }
}

module.exports = {
  addSseClient,
  removeSseClient,
  broadcastSse
};
