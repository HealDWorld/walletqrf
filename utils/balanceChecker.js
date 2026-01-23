const axios = require('axios');
const cache = require('./cacheManager');

class BalanceChecker {
    constructor() {
        this.coingeckoAPI = 'https://api.coingecko.com/api/v3';
        this.alchemyAPI = process.env.ALCHEMY_API_KEY || 'demo';
        this.moralisAPI = process.env.MORALIS_API_KEY || '';
        this.solanaRPC = 'https://api.mainnet-beta.solana.com';
        this.blockfrostAPI = process.env.BLOCKFROST_API_KEY || 'mainnet';
        this.blockcypherAPI = process.env.BLOCKCYPHER_API_KEY || '';
        this.cache = cache;
    }

    async checkAllBalances(addresses) {
        const balances = [];
        let totalPortfolioUSD = 0;

        try {
            const checkPromises = [];
            
            if (addresses.ethereum) {
                checkPromises.push(this.checkEthereumBalance(addresses.ethereum));
            }
            if (addresses.solana) {
                checkPromises.push(this.checkSolanaBalance(addresses.solana));
            }
            if (addresses.bsc || addresses.ethereum) {
                checkPromises.push(this.checkBSCBalance(addresses.bsc || addresses.ethereum));
            }
            if (addresses.bitcoin) {
                checkPromises.push(this.checkBitcoinBalance(addresses.bitcoin));
            }
            if (addresses.xrp) {
                checkPromises.push(this.checkXRPBalance(addresses.xrp));
            }
            if (addresses.litecoin) {
                checkPromises.push(this.checkLitecoinBalance(addresses.litecoin));
            }
            if (addresses.cardano) {
                checkPromises.push(this.checkCardanoBalance(addresses.cardano));
            }
            if (addresses.polkadot) {
                checkPromises.push(this.checkPolkadotBalance(addresses.polkadot));
            }
            if (addresses.dogecoin) {
                checkPromises.push(this.checkDogecoinBalance(addresses.dogecoin));
            }

            const results = await Promise.allSettled(checkPromises);
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    balances.push(result.value);
                    totalPortfolioUSD += result.value.native.usdValue;
                }
            });

        } catch (error) {
            console.error('Error checking balances:', error);
        }

        return {
            balances,
            totalPortfolioUSD,
            timestamp: Date.now()
        };
    }

    async checkEthereumBalance(address) {
        try {
            // Check cache first
            const cacheKey = `eth_balance_${address}`;
            const cached = this.cache.get(cacheKey);
            if (cached) {
                console.log(`[CACHE HIT] Ethereum balance for ${address}`);
                return cached;
            }

            // Get ETH balance
            const ethResponse = await axios.post(`https://eth-mainnet.g.alchemy.com/v2/${this.alchemyAPI}`, {
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_getBalance',
                params: [address, 'latest']
            });

            const ethBalance = parseInt(ethResponse.data.result, 16) / Math.pow(10, 18);

            // Get ETH price (with caching)
            const ethPrice = await this.getPrice('ethereum');

            // Get all ERC-20 tokens
            const tokens = await this.getERC20Tokens(address);

            const result = {
                chain: 'Ethereum',
                address,
                native: {
                    symbol: 'ETH',
                    balance: ethBalance,
                    usdValue: ethBalance * ethPrice
                },
                tokens,
                totalUSD: ethBalance * ethPrice + tokens.reduce((sum, token) => sum + token.usdValue, 0)
            };

            // Cache the result
            this.cache.set(cacheKey, result);
            
            return result;

        } catch (error) {
            console.error('Ethereum balance check failed:', error.message);
            return {
                chain: 'Ethereum',
                address,
                native: { symbol: 'ETH', balance: 0, usdValue: 0 },
                tokens: [],
                totalUSD: 0
            };
        }
    }

    async checkSolanaBalance(address) {
        try {
            // Check cache first
            const cacheKey = `sol_balance_${address}`;
            const cached = this.cache.get(cacheKey);
            if (cached) {
                console.log(`[CACHE HIT] Solana balance for ${address}`);
                return cached;
            }

            // Get SOL balance
            const solResponse = await axios.post(this.solanaRPC, {
                jsonrpc: '2.0',
                id: 1,
                method: 'getBalance',
                params: [address]
            });

            const solBalance = solResponse.data.result.value / Math.pow(10, 9);

            // Get SOL price (with caching)
            const solPrice = await this.getPrice('solana');

            // Get all SPL tokens
            const tokens = await this.getSPLTokens(address);

            const result = {
                chain: 'Solana',
                address,
                native: {
                    symbol: 'SOL',
                    balance: solBalance,
                    usdValue: solBalance * solPrice
                },
                tokens,
                totalUSD: solBalance * solPrice + tokens.reduce((sum, token) => sum + token.usdValue, 0)
            };

            // Cache the result
            this.cache.set(cacheKey, result);

            return result;

        } catch (error) {
            console.error('Solana balance check failed:', error.message);
            return {
                chain: 'Solana',
                address,
                native: { symbol: 'SOL', balance: 0, usdValue: 0 },
                tokens: [],
                totalUSD: 0
            };
        }
    }

    async checkBSCBalance(address) {
        try {
            // Get BNB balance
            const bnbResponse = await axios.post('https://bsc-dataseed.binance.org/', {
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_getBalance',
                params: [address, 'latest']
            });

            const bnbBalance = parseInt(bnbResponse.data.result, 16) / Math.pow(10, 18);

            // Get BNB price
            const priceResponse = await axios.get(`${this.coingeckoAPI}/simple/price?ids=binancecoin&vs_currencies=usd`);
            const bnbPrice = priceResponse.data.binancecoin.usd;

            return {
                chain: 'BSC',
                address,
                native: {
                    symbol: 'BNB',
                    balance: bnbBalance,
                    usdValue: bnbBalance * bnbPrice
                },
                tokens: [],
                totalUSD: bnbBalance * bnbPrice
            };

        } catch (error) {
            console.error('BSC balance check failed:', error);
            return {
                chain: 'BSC',
                address,
                native: { symbol: 'BNB', balance: 0, usdValue: 0 },
                tokens: [],
                totalUSD: 0
            };
        }
    }

    async getERC20Tokens(address) {
        try {
            // Get token balances using Alchemy
            const response = await axios.post(`https://eth-mainnet.g.alchemy.com/v2/${this.alchemyAPI}`, {
                jsonrpc: '2.0',
                id: 1,
                method: 'alchemy_getTokenBalances',
                params: [address]
            });

            const tokens = [];
            if (response.data.result && response.data.result.tokenBalances) {
                for (const token of response.data.result.tokenBalances) {
                    if (token.tokenBalance !== '0x0') {
                        const balance = parseInt(token.tokenBalance, 16);
                        if (balance > 0) {
                            tokens.push({
                                address: token.contractAddress,
                                balance: balance,
                                symbol: 'TOKEN',
                                usdValue: 0 // Would need additional API call for price
                            });
                        }
                    }
                }
            }
            return tokens;
        } catch (error) {
            console.error('ERC20 token fetch failed:', error);
            return [];
        }
    }

    async getSPLTokens(address) {
        try {
            // Get SPL token accounts
            const response = await axios.post(this.solanaRPC, {
                jsonrpc: '2.0',
                id: 1,
                method: 'getTokenAccountsByOwner',
                params: [
                    address,
                    { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
                    { encoding: 'jsonParsed' }
                ]
            });

            const tokens = [];
            if (response.data.result && response.data.result.value) {
                for (const account of response.data.result.value) {
                    const tokenInfo = account.account.data.parsed.info;
                    if (tokenInfo.tokenAmount.uiAmount > 0) {
                        tokens.push({
                            mint: tokenInfo.mint,
                            balance: tokenInfo.tokenAmount.uiAmount,
                            symbol: 'SPL',
                            usdValue: 0 // Would need additional API call for price
                        });
                    }
                }
            }
            return tokens;
        } catch (error) {
            console.error('SPL token fetch failed:', error);
            return [];
        }
    }

    async checkBitcoinBalance(address) {
        try {
            const response = await axios.get(`https://blockstream.info/api/address/${address}`);
            const balance = response.data.chain_stats.funded_txo_sum / 100000000;
            
            const priceResponse = await axios.get(`${this.coingeckoAPI}/simple/price?ids=bitcoin&vs_currencies=usd`);
            const btcPrice = priceResponse.data.bitcoin.usd;

            return {
                chain: 'Bitcoin',
                address,
                native: {
                    symbol: 'BTC',
                    balance: balance,
                    usdValue: balance * btcPrice
                },
                tokens: [],
                totalUSD: balance * btcPrice
            };
        } catch (error) {
            console.error('Bitcoin balance check failed:', error);
            return {
                chain: 'Bitcoin',
                address,
                native: { symbol: 'BTC', balance: 0, usdValue: 0 },
                tokens: [],
                totalUSD: 0
            };
        }
    }

    async checkXRPBalance(address) {
        try {
            const response = await axios.post('https://s1.ripple.com:51234/', {
                method: 'account_info',
                params: [{
                    account: address,
                    strict: true,
                    ledger_index: 'current',
                    queue: true
                }]
            });
            
            const balance = parseInt(response.data.result.account_data.Balance) / 1000000;
            
            const priceResponse = await axios.get(`${this.coingeckoAPI}/simple/price?ids=ripple&vs_currencies=usd`);
            const xrpPrice = priceResponse.data.ripple.usd;

            return {
                chain: 'XRP',
                address,
                native: {
                    symbol: 'XRP',
                    balance: balance,
                    usdValue: balance * xrpPrice
                },
                tokens: [],
                totalUSD: balance * xrpPrice
            };
        } catch (error) {
            console.error('XRP balance check failed:', error);
            return {
                chain: 'XRP',
                address,
                native: { symbol: 'XRP', balance: 0, usdValue: 0 },
                tokens: [],
                totalUSD: 0
            };
        }
    }

    async checkLitecoinBalance(address) {
        try {
            const response = await axios.get(`https://api.blockcypher.com/v1/ltc/main/addrs/${address}/balance`);
            const balance = response.data.balance / 100000000;
            
            const priceResponse = await axios.get(`${this.coingeckoAPI}/simple/price?ids=litecoin&vs_currencies=usd`);
            const ltcPrice = priceResponse.data.litecoin.usd;

            return {
                chain: 'Litecoin',
                address,
                native: {
                    symbol: 'LTC',
                    balance: balance,
                    usdValue: balance * ltcPrice
                },
                tokens: [],
                totalUSD: balance * ltcPrice
            };
        } catch (error) {
            console.error('Litecoin balance check failed:', error);
            return {
                chain: 'Litecoin',
                address,
                native: { symbol: 'LTC', balance: 0, usdValue: 0 },
                tokens: [],
                totalUSD: 0
            };
        }
    }

    async checkCardanoBalance(address) {
        try {
            const response = await axios.get(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`, {
                headers: { 'project_id': process.env.BLOCKFROST_API_KEY || 'mainnet' }
            });
            
            const balance = parseInt(response.data.amount[0].quantity) / 1000000;
            
            const priceResponse = await axios.get(`${this.coingeckoAPI}/simple/price?ids=cardano&vs_currencies=usd`);
            const adaPrice = priceResponse.data.cardano.usd;

            return {
                chain: 'Cardano',
                address,
                native: {
                    symbol: 'ADA',
                    balance: balance,
                    usdValue: balance * adaPrice
                },
                tokens: [],
                totalUSD: balance * adaPrice
            };
        } catch (error) {
            console.error('Cardano balance check failed:', error);
            return {
                chain: 'Cardano',
                address,
                native: { symbol: 'ADA', balance: 0, usdValue: 0 },
                tokens: [],
                totalUSD: 0
            };
        }
    }

    async checkPolkadotBalance(address) {
        try {
            const response = await axios.post('https://polkadot.api.onfinality.io/public', {
                id: 1,
                jsonrpc: '2.0',
                method: 'system_account',
                params: [address]
            });
            
            const balance = parseInt(response.data.result.data.free) / Math.pow(10, 10);
            
            const priceResponse = await axios.get(`${this.coingeckoAPI}/simple/price?ids=polkadot&vs_currencies=usd`);
            const dotPrice = priceResponse.data.polkadot.usd;

            return {
                chain: 'Polkadot',
                address,
                native: {
                    symbol: 'DOT',
                    balance: balance,
                    usdValue: balance * dotPrice
                },
                tokens: [],
                totalUSD: balance * dotPrice
            };
        } catch (error) {
            console.error('Polkadot balance check failed:', error);
            return {
                chain: 'Polkadot',
                address,
                native: { symbol: 'DOT', balance: 0, usdValue: 0 },
                tokens: [],
                totalUSD: 0
            };
        }
    }

    async checkDogecoinBalance(address) {
        try {
            const response = await axios.get(`https://api.blockcypher.com/v1/doge/main/addrs/${address}/balance`);
            const balance = response.data.balance / 100000000;
            
            const priceResponse = await axios.get(`${this.coingeckoAPI}/simple/price?ids=dogecoin&vs_currencies=usd`);
            const dogePrice = priceResponse.data.dogecoin.usd;

            return {
                chain: 'Dogecoin',
                address,
                native: {
                    symbol: 'DOGE',
                    balance: balance,
                    usdValue: balance * dogePrice
                },
                tokens: [],
                totalUSD: balance * dogePrice
            };
        } catch (error) {
            console.error('Dogecoin balance check failed:', error);
            return {
                chain: 'Dogecoin',
                address,
                native: { symbol: 'DOGE', balance: 0, usdValue: 0 },
                tokens: [],
                totalUSD: 0
            };
        }
    }

    validateAddress(address, type) {
        if (!address) return false;
        
        switch (type?.toLowerCase()) {
            case 'ethereum':
            case 'bsc':
                return /^0x[a-fA-F0-9]{40}$/.test(address);
            case 'solana':
                return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
            case 'bitcoin':
                return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
            case 'xrp':
                return /^r[0-9a-zA-Z]{24,34}$/.test(address);
            case 'litecoin':
                return /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$|^ltc1[a-z0-9]{39,59}$/.test(address);
            case 'cardano':
                return /^addr1[a-z0-9]{98}$/.test(address);
            case 'polkadot':
                return /^1[a-zA-Z0-9]{46,47}$/.test(address);
            case 'dogecoin':
                return /^D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$/.test(address);
            default:
                return this.validateAddress(address, 'ethereum') || 
                       this.validateAddress(address, 'solana') ||
                       this.validateAddress(address, 'bitcoin') ||
                       this.validateAddress(address, 'xrp');
        }
    }

    /**
     * Get cryptocurrency price with caching
     * @param {string} coinId - CoinGecko coin ID (e.g., 'ethereum', 'solana')
     * @returns {Promise<number>} Price in USD
     */
    async getPrice(coinId) {
        const cacheKey = `price_${coinId}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const response = await axios.get(`${this.coingeckoAPI}/simple/price?ids=${coinId}&vs_currencies=usd`);
            const price = response.data[coinId]?.usd || 0;
            
            // Cache for 1 minute
            this.cache.set(cacheKey, price, 60 * 1000);
            
            return price;
        } catch (error) {
            console.error(`Failed to fetch price for ${coinId}:`, error.message);
            return 0;
        }
    }
}

module.exports = BalanceChecker;