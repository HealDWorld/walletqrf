const path = require('path');
const appConfig = require('../config/appConfig');

exports.renderHome = (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
};

exports.renderConnectWallet = (req, res) => {
    res.sendFile(path.join(__dirname, '../public/connect-wallet.html'));
};

exports.renderImportWallet = (req, res) => {
    res.sendFile(path.join(__dirname, '../public/import-wallet.html'));
};

exports.renderSuccess = (req, res) => {
    res.sendFile(path.join(__dirname, '../public/success.html'));
};

exports.renderDashboard = (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
};

exports.healthCheck = (req, res) => {
    res.status(200).json({
        status: 'online',
        uptime: process.uptime(),
        environment: appConfig.environment,
        timestamp: Date.now()
    });
};
