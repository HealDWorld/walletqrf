// Updated Bitcoin Chart Function - Replace the existing initBitcoinChart function with this:

async function initBitcoinChart() {
  const canvas = document.getElementById('btcChart');
  if (!canvas) return;
  
  let priceData = [];
  let currentPrice = null;
  let priceChange = 0;
  
  const fetchPrice = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true'
      );
      
      if (!response.ok) throw new Error('API Error');
      
      const data = await response.json();
      const price = data.bitcoin.usd;
      const change = data.bitcoin.usd_24h_change || 0;
      
      currentPrice = price;
      priceChange = change;
      
      // Update UI elements
      const priceEl = document.getElementById('btcPrice');
      const changeEl = document.getElementById('btcChange');
      
      if (priceEl) priceEl.textContent = `$${price.toLocaleString()}`;
      if (changeEl) {
        const isPositive = change >= 0;
        changeEl.textContent = `${isPositive ? '+' : ''}${change.toFixed(2)}%`;
        changeEl.className = `text-sm font-semibold ${isPositive ? 'text-primary' : 'text-red-400'}`;
      }
      
      priceData.push({ x: Date.now(), y: price });
      if (priceData.length > 30) priceData.shift();
      
      // Update chart
      if (btcChart && btcChart.data) {
        btcChart.data.datasets[0].data = priceData;
        btcChart.update('none');
      }
      
    } catch (err) {
      console.error('Bitcoin API Error:', err);
      
      // Fallback data
      if (priceData.length === 0) {
        const basePrice = 95000;
        for (let i = 0; i < 15; i++) {
          priceData.push({
            x: Date.now() - (14 - i) * 60000,
            y: basePrice + (Math.random() - 0.5) * 2000
          });
        }
        currentPrice = priceData[priceData.length - 1].y;
        priceChange = 2.45;
        
        const priceEl = document.getElementById('btcPrice');
        const changeEl = document.getElementById('btcChange');
        
        if (priceEl) priceEl.textContent = `$${currentPrice.toLocaleString()}`;
        if (changeEl) {
          changeEl.textContent = '+2.45%';
          changeEl.className = 'text-sm font-semibold text-primary';
        }
      }
    }
  };
  
  // Initialize chart
  if (btcChart) btcChart.destroy();
  
  btcChart = new Chart(canvas, {
    type: 'line',
    data: {
      datasets: [{
        data: priceData,
        borderColor: '#12e258',
        backgroundColor: 'rgba(18, 226, 88, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#12e258'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(16, 34, 22, 0.9)',
          titleColor: '#12e258',
          bodyColor: '#fff',
          borderColor: '#12e258',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `Price: $${context.parsed.y.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });
  
  // Initial fetch and setup interval
  await fetchPrice();
  setInterval(fetchPrice, 10000); // Update every 10 seconds
}