const express = require('express');
const router = express.Router();
const {
  getDonations,
  createDonation,
  getDonationById,
  updateDonation,
  deleteDonation,
  getDonationsAnalytics
} = require('../controllers/donationController');

router.get('/', getDonations);
router.post('/', createDonation);
router.get('/analytics/summary', getDonationsAnalytics);
router.get('/:id', getDonationById);
router.put('/:id', updateDonation);
router.delete('/:id', deleteDonation);

module.exports = router;
