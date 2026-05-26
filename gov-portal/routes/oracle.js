const express = require('express');
const router = express.Router();

// GET /api/oracle/eth-inr
router.get('/eth-inr', (req, res) => {
    try {
        // Base rate around 175000 INR per ETH, with slight randomization for realism
        const baseRate = 175000;
        const variance = (Math.random() - 0.5) * 2000; // +/- 1000 INR
        const rate = Math.round(baseRate + variance);

        res.json({
            rate,
            source: 'Mock RBI Exchange Rate Feed',
            lastUpdated: new Date().toISOString(),
            pair: 'ETH/INR'
        });
    } catch (err) {
        console.error('Oracle error:', err);
        res.status(500).json({ error: 'Internal server error fetching exchange rate' });
    }
});

module.exports = router;
