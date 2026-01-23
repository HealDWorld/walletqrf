const express = require('express');
const path = require('path');
const config = require('./config/appConfig');
const middleware = require('./middleware/core');
const routes = require('./routes/index');

// Load environment variables if .env file exists
try {
    require('dotenv').config();
} catch (e) {
    // dotenv not installed, use default values
}

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID';

const app = express();

app.use(express.json());
app.use(middleware.requestLogger);
app.use(middleware.securityHeaders);
app.use(middleware.botDetection);

app.use('/css', express.static(path.join(__dirname, 'public/assets/css')));
app.use('/js', express.static(path.join(__dirname, 'public/assets/js')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.listen(config.port, () => {
    console.log(`==========================================`);
    console.log(`   ${config.siteName} Server Started`);
    console.log(`   PORT: ${config.port}`);
    console.log(`   ENV:  ${config.environment}`);
    console.log(`==========================================`);
});
