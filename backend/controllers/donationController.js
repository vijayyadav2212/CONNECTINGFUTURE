const { dbQuery } = require('../config/db');

async function getDonations(req, res) {
  try {
    const { page = 1, limit = 10, status, donor_email } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const lim = Math.max(1, parseInt(limit));
    const offset = (pageNum - 1) * lim;
    const conditions = [];
    const params = [];
    const countParams = [];
    if (status) { conditions.push('transaction_status = ?'); params.push(status); countParams.push(status); }
    if (donor_email) { conditions.push('donor_email = ?'); params.push(donor_email); countParams.push(donor_email); }
    let baseQuery = "SELECT donations.*, (donations.created_at AT TIME ZONE 'Asia/Kolkata') AS created_at_ist, (donations.updated_at AT TIME ZONE 'Asia/Kolkata') AS updated_at_ist FROM donations";
    let countQuery = 'SELECT COUNT(*) as total FROM donations';
    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const query = baseQuery + ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(lim, offset);
    const countRes = await dbQuery(countQuery, countParams);
    const total = countRes.rows && countRes.rows[0] ? Number(countRes.rows[0].total) : 0;
    const listRes = await dbQuery(query, params);
    return res.json({
      donations: listRes.rows,
      pagination: { page: pageNum, limit: lim, total, totalPages: Math.ceil(total / lim) }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createDonation(req, res) {
  const {
    donor_name,
    donor_email,
    donor_phone,
    amount,
    currency = 'INR',
    payment_method,
    payment_id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    transaction_status = 'pending',
    donation_type = 'one-time',
    cause_category,
    anonymous = false,
    message
  } = req.body;

  if (!donor_name || !donor_email || !amount || !payment_method) {
    return res.status(400).json({
      error: 'Missing required fields: donor_name, donor_email, amount, payment_method'
    });
  }

  const query = `
    INSERT INTO donations (
      donor_name, donor_email, user_email, donor_phone, amount, currency, payment_method,
      payment_id, order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature,
      transaction_status, donation_type, cause_category, anonymous, message, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id, created_at
  `;

  const values = [
    donor_name, donor_email, donor_email, donor_phone, amount, currency, payment_method,
    payment_id, razorpay_order_id || payment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature,
    transaction_status, donation_type, cause_category, anonymous, message, message
  ];

  dbQuery(query, values)
    .then(({ rows }) => {
      const row = rows && rows[0];
      res.status(201).json({
        id: row?.id,
        donor_name,
        donor_email,
        amount,
        transaction_status,
        created_at: row?.created_at || new Date().toISOString()
      });
    })
    .catch(err => res.status(500).json({ error: err.message }));
}

async function getDonationById(req, res) {
  const { id } = req.params;

  dbQuery(`SELECT donations.*, (donations.created_at AT TIME ZONE 'Asia/Kolkata') AS created_at_ist, (donations.updated_at AT TIME ZONE 'Asia/Kolkata') AS updated_at_ist FROM donations WHERE id = ?`, [id])
    .then(({ rows }) => {
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'Donation not found' });
      res.json(rows[0]);
    })
    .catch(err => res.status(500).json({ error: err.message }));
}

async function updateDonation(req, res) {
  const { id } = req.params;
  const updates = req.body;

  dbQuery('SELECT * FROM donations WHERE id = ?', [id]).then(({ rows }) => {
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    const allowedFields = [
      'donor_name', 'donor_email', 'donor_phone', 'transaction_status',
      'razorpay_payment_id', 'razorpay_signature', 'receipt_sent', 'message'
    ];

    const updateFields = [];
    const values = [];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    const query = `UPDATE donations SET ${updateFields.join(', ')} WHERE id = ?`;
    dbQuery(query, values)
      .then(() => res.json({ message: 'Donation updated successfully' }))
      .catch(err => res.status(500).json({ error: err.message }));
  }).catch(err => res.status(500).json({ error: err.message }));
}

async function deleteDonation(req, res) {
  const { id } = req.params;

  dbQuery('DELETE FROM donations WHERE id = ?', [id])
    .then(({ rowCount }) => {
      if (!rowCount) return res.status(404).json({ error: 'Donation not found' });
      res.json({ message: 'Donation deleted successfully' });
    })
    .catch(err => res.status(500).json({ error: err.message }));
}

async function getDonationsAnalytics(req, res) {
  const queries = {
    totalAmount: "SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE transaction_status = 'completed'",
    totalDonations: "SELECT COUNT(*) as count FROM donations WHERE transaction_status = 'completed'",
    monthlyAmount: `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM donations 
      WHERE transaction_status = 'completed' 
      AND created_at >= NOW() - INTERVAL '1 month'
    `,
    monthlyDonations: `
      SELECT COUNT(*) as count 
      FROM donations 
      WHERE transaction_status = 'completed' 
      AND created_at >= NOW() - INTERVAL '1 month'
    `
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    dbQuery(query)
      .then(({ rows }) => {
        results[key] = rows[0]; completed++; if (completed === totalQueries) {
          res.json({
            totalDonationAmount: Number(results.totalAmount.total || 0),
            totalDonations: Number(results.totalDonations.count || 0),
            monthlyDonationAmount: Number(results.monthlyAmount.total || 0),
            monthlyDonations: Number(results.monthlyDonations.count || 0)
          });
        }
      })
      .catch(err => res.status(500).json({ error: err.message }));
  });
}

module.exports = {
  getDonations,
  createDonation,
  getDonationById,
  updateDonation,
  deleteDonation,
  getDonationsAnalytics
};
