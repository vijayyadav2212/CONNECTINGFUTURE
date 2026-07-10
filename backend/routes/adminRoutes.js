const express = require('express');
const router = express.Router();
const { dbQuery } = require('../config/db');
const { checkJwt } = require('../middlewares/authMiddleware');
const { sendAlumniApprovalEmail } = require('../services/userService');

// PUT approve/reject alumni by auth0_id
router.put('/alumni/:auth0Id/approval', checkJwt, async (req, res) => {
  try {
    const { auth0Id } = req.params;
    const { status, reason } = req.body || {};
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const normalizedStatus = String(status).toLowerCase();
    const approvedAt = normalizedStatus === 'approved' ? new Date() : null;

    const sql = `
      UPDATE users 
      SET approval_status = ?, approval_reason = ?, approved_at = ?
      WHERE auth0_id = ?
      RETURNING *
    `;
    const { rows } = await dbQuery(sql, [normalizedStatus, reason || null, approvedAt, auth0Id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];

    // Send email notifications asynchronously
    sendAlumniApprovalEmail({
      to: user.email,
      name: user.name,
      status: user.approval_status,
      reason: user.approval_reason
    }).catch(err => console.warn('Failed to send approval email:', err.message));

    return res.json({ message: `User status updated to ${normalizedStatus}`, user });
  } catch (error) {
    console.error('Error in alumni approval route:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// PUT approve/reject alumni by database ID
router.put('/users/:id/approval', checkJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const { approval_status, reason } = req.body || {};
    if (!approval_status) return res.status(400).json({ error: 'Approval status is required' });

    const normalizedStatus = String(approval_status).toLowerCase();
    const approvedAt = normalizedStatus === 'approved' ? new Date() : null;

    const sql = `
      UPDATE users 
      SET approval_status = ?, approval_reason = ?, approved_at = ?
      WHERE id = ?
      RETURNING *
    `;
    const { rows } = await dbQuery(sql, [normalizedStatus, reason || null, approvedAt, parseInt(id, 10)]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];

    // Send email notifications
    sendAlumniApprovalEmail({
      to: user.email,
      name: user.name,
      status: user.approval_status,
      reason: user.approval_reason
    }).catch(err => console.warn('Failed to send approval email:', err.message));

    return res.json({ message: `User status updated to ${normalizedStatus}`, user });
  } catch (error) {
    console.error('Error in user approval route by ID:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
