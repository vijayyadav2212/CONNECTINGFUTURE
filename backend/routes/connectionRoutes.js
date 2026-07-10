const express = require('express');
const router = express.Router();
const {
  createConnectionRequest,
  respondConnectionRequest,
  getConnections,
  removeConnection
} = require('../controllers/connectionController');

router.post('/request', createConnectionRequest);
router.post('/respond', respondConnectionRequest);
router.get('/', getConnections);
router.post('/remove', removeConnection);

module.exports = router;
