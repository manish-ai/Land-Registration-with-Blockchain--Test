const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// GET /api/bank/account/:aadharNumber
router.get('/account/:aadharNumber', (req, res) => {
    try {
        const { aadharNumber } = req.params;
        const db = req.app.locals.db;

        const account = db.prepare(
            'SELECT account_number, ifsc, bank_name, holder_name, aadhar_linked, balance, account_type, branch, is_active FROM bank_accounts WHERE aadhar_linked = ? AND is_active = 1 LIMIT 1'
        ).get(aadharNumber);

        if (!account) {
            return res.json({
                found: false,
                message: 'No bank account linked to this Aadhar'
            });
        }

        res.json({
            found: true,
            account_number: account.account_number,
            ifsc: account.ifsc,
            bank_name: account.bank_name,
            holder_name: account.holder_name,
            balance: account.balance,
            account_type: account.account_type,
            branch: account.branch,
            is_active: account.is_active
        });
    } catch (err) {
        console.error('Bank account lookup error:', err);
        res.status(500).json({ found: false, message: 'Internal server error during bank lookup' });
    }
});

// POST /api/bank/process-payment
router.post('/process-payment', (req, res) => {
    try {
        const { buyerAadhar, sellerAadhar, amount, landPID, blockchainTxHash } = req.body;
        const db = req.app.locals.db;

        if (!buyerAadhar || !sellerAadhar || !amount || !landPID) {
            return res.status(400).json({
                success: false,
                message: 'buyerAadhar, sellerAadhar, amount, and landPID are all required'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than zero'
            });
        }

        // Find buyer's active bank account
        const buyerAccount = db.prepare(
            'SELECT * FROM bank_accounts WHERE aadhar_linked = ? AND is_active = 1 LIMIT 1'
        ).get(buyerAadhar);

        if (!buyerAccount) {
            return res.status(404).json({
                success: false,
                message: 'No active bank account found for buyer'
            });
        }

        // Find seller's active bank account
        const sellerAccount = db.prepare(
            'SELECT * FROM bank_accounts WHERE aadhar_linked = ? AND is_active = 1 LIMIT 1'
        ).get(sellerAadhar);

        if (!sellerAccount) {
            return res.status(404).json({
                success: false,
                message: 'No active bank account found for seller'
            });
        }

        // Validate buyer has sufficient balance
        if (buyerAccount.balance < amount) {
            const transactionId = 'TXN-' + uuidv4().substring(0, 8).toUpperCase();
            db.prepare(
                'INSERT INTO transactions (transaction_id, buyer_aadhar, seller_aadhar, amount, land_pid, buyer_account, seller_account, status, blockchain_tx_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).run(transactionId, buyerAadhar, sellerAadhar, amount, landPID, buyerAccount.account_number, sellerAccount.account_number, 'FAILED', blockchainTxHash || null);

            return res.status(400).json({
                success: false,
                transactionId,
                message: 'Insufficient balance in buyer account',
                buyerBalance: buyerAccount.balance,
                requiredAmount: amount
            });
        }

        // Process payment in a transaction
        const transactionId = 'TXN-' + uuidv4().substring(0, 8).toUpperCase();

        const processPayment = db.transaction(() => {
            // Deduct from buyer
            db.prepare('UPDATE bank_accounts SET balance = balance - ? WHERE id = ?').run(amount, buyerAccount.id);

            // Credit seller
            db.prepare('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?').run(amount, sellerAccount.id);

            // Log transaction
            db.prepare(
                'INSERT INTO transactions (transaction_id, buyer_aadhar, seller_aadhar, amount, land_pid, buyer_account, seller_account, status, blockchain_tx_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).run(transactionId, buyerAadhar, sellerAadhar, amount, landPID, buyerAccount.account_number, sellerAccount.account_number, 'SUCCESS', blockchainTxHash || null);
        });

        processPayment();

        // Get updated balances
        const updatedBuyer = db.prepare('SELECT balance FROM bank_accounts WHERE id = ?').get(buyerAccount.id);
        const updatedSeller = db.prepare('SELECT balance FROM bank_accounts WHERE id = ?').get(sellerAccount.id);

        res.json({
            success: true,
            transactionId,
            buyerNewBalance: updatedBuyer.balance,
            sellerNewBalance: updatedSeller.balance,
            receipt: {
                transactionId,
                buyerAadhar,
                sellerAadhar,
                amount,
                landPID,
                buyerAccount: buyerAccount.account_number,
                buyerBank: buyerAccount.bank_name,
                sellerAccount: sellerAccount.account_number,
                sellerBank: sellerAccount.bank_name,
                status: 'SUCCESS',
                timestamp: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Payment processing error:', err);
        res.status(500).json({ success: false, message: 'Internal server error during payment processing' });
    }
});

module.exports = router;
