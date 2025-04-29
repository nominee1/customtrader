// Helper: Extract last digit from price
function getLastDigit(price) {
  const priceStr = price.toString();
  return parseInt(priceStr[priceStr.length - 1]);
}

// Simple Moving Average (SMA) Crossover
function calculateSMA(ticks, period, useDigits = false) {
  if (ticks.length < period) return null;
  const values = useDigits
    ? ticks.slice(-period).map(tick => getLastDigit(tick.price))
    : ticks.slice(-period).map(tick => tick.price);
  return values.reduce((acc, val) => acc + val, 0) / period;
}

function analyzeSMACrossover(ticks, contractType, symbol, fastPeriod = 5, slowPeriod = 10) {
  if (ticks.length < slowPeriod + 1) return null;

  let signal, strength, details;

  if (contractType === 'Rise/Fall') {
    const fastSMA = calculateSMA(ticks, fastPeriod);
    const slowSMA = calculateSMA(ticks, slowPeriod);
    const prevFastSMA = calculateSMA(ticks.slice(0, -1), fastPeriod);
    const prevSlowSMA = calculateSMA(ticks.slice(0, -1), slowPeriod);

    if (!fastSMA || !slowSMA || !prevFastSMA || !prevSlowSMA) return null;

    const momentum = ticks[ticks.length - 1].price - ticks[ticks.length - 3].price;

    if (prevFastSMA <= prevSlowSMA && fastSMA > slowSMA && momentum > 0) {
      signal = 'rise';
      strength = 0.7;
      details = `Fast SMA (${fastSMA.toFixed(2)}) crossed above Slow SMA (${slowSMA.toFixed(2)})`;
    } else if (prevFastSMA >= prevSlowSMA && fastSMA < slowSMA && momentum < 0) {
      signal = 'fall';
      strength = 0.7;
      details = `Fast SMA (${fastSMA.toFixed(2)}) crossed below Slow SMA (${slowSMA.toFixed(2)})`;
    } else {
      signal = 'neutral';
      strength = 0;
      details = `No SMA crossover detected`;
    }
  } else {
    // Even/Odd, Over/Under, Matches/Differs: Use digit SMA
    const fastSMA = calculateSMA(ticks, fastPeriod, true);
    const slowSMA = calculateSMA(ticks, slowPeriod, true);
    if (!fastSMA || !slowSMA) return null;

    if (contractType === 'Even/Odd') {
      const avgDigit = fastSMA;
      signal = avgDigit > 5 ? 'odd' : 'even'; // Higher digits lean toward odd
      strength = Math.abs(avgDigit - 5) / 5; // Strength based on deviation from 5
      details = `Digit SMA (${fastSMA.toFixed(1)}) suggests ${signal}`;
    } else if (contractType === 'Over/Under') {
      const barrier = 4; // Example barrier; make configurable
      signal = fastSMA > barrier ? `over_${barrier}` : `under_${barrier}`;
      strength = Math.abs(fastSMA - barrier) / 5;
      details = `Digit SMA (${fastSMA.toFixed(1)}) vs barrier ${barrier}`;
    } else if (contractType === 'Matches/Differs') {
      const targetDigit = 5; // Example; make configurable
      signal = Math.round(fastSMA) === targetDigit ? `matches_${targetDigit}` : `differs_${targetDigit}`;
      strength = Math.abs(fastSMA - targetDigit) < 2 ? 0.6 : 0.3;
      details = `Digit SMA (${fastSMA.toFixed(1)}) vs target ${targetDigit}`;
    }
  }

  return { signal, strength, details };
}

// Stochastic Oscillator
function calculateStochastic(ticks, kPeriod, useDigits = false) {
  if (ticks.length < kPeriod) return null;

  const values = useDigits
    ? ticks.slice(-kPeriod).map(tick => getLastDigit(tick.price))
    : ticks.slice(-kPeriod).map(tick => tick.price);
  const currentValue = values[values.length - 1];
  const lowest = Math.min(...values);
  const highest = Math.max(...values);

  const kValue = ((currentValue - lowest) / (highest - lowest)) * 100;
  return { k: isNaN(kValue) ? 50 : kValue, d: kValue }; // Simplified; add smoothing in production
}

function analyzeStochastic(ticks, contractType, symbol) {
  const kPeriod = symbol.includes('1HZ') ? 8 : 14;
  let signal, strength, details;

  if (contractType === 'Rise/Fall') {
    const stochastic = calculateStochastic(ticks, kPeriod);
    if (!stochastic) return null;

    const { k } = stochastic;
    if (k < 20) {
      signal = 'rise';
      strength = k < 10 ? 0.9 : 0.6;
      details = `Stochastic oversold (K=${k.toFixed(2)})`;
    } else if (k > 80) {
      signal = 'fall';
      strength = k > 90 ? 0.9 : 0.6;
      details = `Stochastic overbought (K=${k.toFixed(2)})`;
    } else {
      signal = 'neutral';
      strength = 0;
      details = `Stochastic neutral (K=${k.toFixed(2)})`;
    }
  } else {
    // Even/Odd, Over/Under, Matches/Differs
    const digitCounts = Array(10).fill(0);
    ticks.slice(-kPeriod).forEach(tick => {
      digitCounts[getLastDigit(tick.price)]++;
    });
    const maxDigit = digitCounts.indexOf(Math.max(...digitCounts));

    if (contractType === 'Even/Odd') {
      signal = maxDigit % 2 === 0 ? 'odd' : 'even'; // Bet against dominant digit
      strength = digitCounts[maxDigit] / kPeriod;
      details = `Frequent digit ${maxDigit} suggests ${signal}`;
    } else if (contractType === 'Over/Under') {
      const barrier = 4;
      signal = maxDigit > barrier ? `under_${barrier}` : `over_${barrier}`;
      strength = digitCounts[maxDigit] / kPeriod;
      details = `Frequent digit ${maxDigit} vs barrier ${barrier}`;
    } else if (contractType === 'Matches/Differs') {
      const targetDigit = 5;
      signal = digitCounts[targetDigit] > kPeriod / 10 ? `differs_${targetDigit}` : `matches_${targetDigit}`;
      strength = Math.abs(digitCounts[targetDigit] - kPeriod / 10) / (kPeriod / 10);
      details = `Digit ${targetDigit} frequency suggests ${signal}`;
    }
  }

  return { signal, strength, details };
}

// Enhanced Tick Streak Analysis
function analyzeTickStreak(ticks, contractType, symbol) {
  if (!ticks || ticks.length < 2) {
    return {
      signal: 'neutral',
      strength: 0,
      details: 'Insufficient tick data for analysis'
    };
  }

  // Define streak thresholds based on symbol volatility
  const getStreakThreshold = (sym) => {
    const thresholds = {
      'R_10': 8, '1HZ10V': 6,
      'R_25': 8, '1HZ25V': 6,
      'R_50': 7, '1HZ50V': 5,
      'R_75': 7, '1HZ75V': 5,
      'R_100': 6, '1HZ100V': 4
    };
    return thresholds[sym] || 5; // Default threshold
  };

  const streakThreshold = getStreakThreshold(symbol);
  let streak = 0;
  let direction = null;
  let lastPrice = null;
  let results = [];

  // Helper function to get last digit for digit-based contracts
  const getLastDigit = (price) => {
    const priceStr = price.toString();
    return parseInt(priceStr.charAt(priceStr.length - 1));
  };

  // Analyze tick streak based on contract type
  if (contractType === 'Rise/Fall') {
    for (let i = ticks.length - 1; i >= 0; i--) {
      const currentPrice = parseFloat(ticks[i].price);
      
      if (lastPrice !== null) {
        const currentDirection = currentPrice > lastPrice ? 'up' : 
                               currentPrice < lastPrice ? 'down' : 'flat';

        if (currentDirection === direction && currentDirection !== 'flat') {
          streak++;
        } else {
          // Reset or start new streak
          if (currentDirection !== 'flat') {
            direction = currentDirection;
            streak = 1;
          } else {
            direction = null;
            streak = 0;
          }
        }

        results.push({
          price: currentPrice,
          direction: currentDirection,
          streak: direction === currentDirection ? streak : 0
        });

        if (streak >= streakThreshold) break;
      }
      lastPrice = currentPrice;
    }

    if (streak >= streakThreshold) {
      return {
        signal: direction === 'up' ? 'fall' : 'rise', // Contrarian signal
        strength: Math.min(0.9, streak / streakThreshold * 0.9), // Normalized strength
        details: `Strong ${direction} streak of ${streak} ticks (Threshold: ${streakThreshold})`,
        rawData: results
      };
    }
  } 
  else {
    // Digit-based contracts (Even/Odd, Over/Under, Matches/Differs)
    const digitAnalysis = (digit, type) => {
      let currentDir;
      switch (type) {
        case 'Even/Odd':
          currentDir = digit % 2 === 0 ? 'even' : 'odd';
          break;
        case 'Over/Under':
          currentDir = digit > 4 ? 'over' : 'under';
          break;
        case 'Matches/Differs':
          currentDir = digit === 5 ? 'match' : 'differ';
          break;
        default:
          return null;
      }
      return currentDir;
    };

    for (let i = ticks.length - 1; i >= 0; i--) {
      const digit = getLastDigit(parseFloat(ticks[i].price));
      const currentDir = digitAnalysis(digit, contractType);

      if (currentDir === direction) {
        streak++;
      } else {
        direction = currentDir;
        streak = 1;
      }

      results.push({
        price: ticks[i].price,
        digit,
        direction: currentDir,
        streak
      });

      if (streak >= streakThreshold) break;
    }

    if (streak >= streakThreshold) {
      let signal;
      switch (contractType) {
        case 'Even/Odd':
          signal = direction === 'even' ? 'odd' : 'even';
          break;
        case 'Over/Under':
          signal = direction === 'over' ? 'under' : 'over';
          break;
        case 'Matches/Differs':
          signal = direction === 'match' ? 'differ' : 'match';
          break;
      }

      return {
        signal,
        strength: Math.min(0.9, streak / streakThreshold * 0.9),
        details: `${streak}-tick ${direction} streak in last digits (${contractType})`,
        rawData: results
      };
    }
  }

  // Default return if no significant streak found
  return {
    signal: 'neutral',
    strength: 0,
    details: `No significant streak (current: ${streak} ${direction || 'flat'})`,
    rawData: results
  };
}
// Volatility Spike Detection
function calculateVolatility(ticks, period = 20, useDigits = false) {
  if (ticks.length < period) return null;
  const values = useDigits
    ? ticks.slice(-period).map(tick => getLastDigit(tick.price))
    : ticks.slice(-period).map(tick => tick.price);
  const mean = values.reduce((acc, v) => acc + v, 0) / period;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / period;
  return Math.sqrt(variance);
}

function analyzeVolatilitySpike(ticks, contractType) {
  if (ticks.length < 21) return null;

  const useDigits = contractType !== 'Rise/Fall';
  const currentVol = calculateVolatility(ticks, 20, useDigits);
  const prevVol = calculateVolatility(ticks.slice(0, -1), 20, useDigits);

  console.log("Current Volatility:", currentVol);
  console.log("Previous Volatility:", prevVol);

  if (!currentVol || !prevVol) return null;

  const spikeThreshold = useDigits ? 1.5 : 2; // Lower for digits due to range 0-9
  if (currentVol > prevVol * spikeThreshold) {
    return {
      signal: 'warning',
      strength: 1,
      details: `Volatility spike detected (${currentVol.toFixed(2)} vs ${prevVol.toFixed(2)})`
    };
  }
  return { signal: 'normal', strength: 0, details: `Volatility stable (${currentVol.toFixed(2)})` };
}

// Risk Calculator
function calculateRiskStake(balance, riskPercent, payoutPercent, volatilityScore) {
  const adjustedRisk = riskPercent * (1 + volatilityScore / 100);
  const maxLoss = balance * (adjustedRisk / 100);
  const stake = maxLoss / (1 - payoutPercent / 100);
  return {
    stake: stake.toFixed(2),
    potentialProfit: (stake * (payoutPercent / 100)).toFixed(2),
    maxLoss: maxLoss.toFixed(2)
  };
}

function analyzeRisk(balance, indexSymbol, contractType, volatilityScore = 50) {
  // Mock payouts; fetch via Deriv's `proposal` API in production
  const payoutMap = {
    'Rise/Fall': { 'R_10': 95, '1HZ10V': 95, 'R_25': 92, '1HZ25V': 92, 'R_50': 89, '1HZ50V': 89, 'R_75': 87, '1HZ75V': 87, 'R_100': 85, '1HZ100V': 85 },
    'Even/Odd': { default: 90 },
    'Over/Under': { default: 85 },
    'Matches/Differs': { default: 10 } 
  };
  const payout = payoutMap[contractType][indexSymbol] || payoutMap[contractType].default;
  const risk = calculateRiskStake(balance, 1, payout, volatilityScore);

  return {
    signal: 'info',
    strength: 0,
    details: `Stake $${risk.stake} to risk 1% ($${risk.maxLoss}). Potential profit: $${risk.potentialProfit}`
  };
}

// Combine Signals
function combineSignals(ticks, symbol, balance, contractType) {
  const sma = analyzeSMACrossover(ticks, contractType, symbol);
  const stochastic = analyzeStochastic(ticks, contractType, symbol);
  const streak = analyzeTickStreak(ticks, contractType, symbol);
  const volatility = analyzeVolatilitySpike(ticks, contractType);
  const risk = analyzeRisk(balance, symbol, contractType, volatility.signal === 'warning' ? 100 : 50);

  const signals = [sma, stochastic, streak].filter(s => s && s.signal !== 'neutral');
  if (!signals.length) {
    return {
      contract: contractType,
      signal: 'neutral',
      confidence: 0,
      details: 'No clear signals detected',
      individualSignals: { sma, stochastic, streak, volatility, risk }
    };
  }

  let signalCounts = {};
  // eslint-disable-next-line no-unused-vars
  let totalStrength = 0;

  signals.forEach(s => {
    signalCounts[s.signal] = (signalCounts[s.signal] || 0) + s.strength;
    totalStrength += s.strength;
  });

  let signal = 'neutral';
  let confidence = 0;
  let details = '';

  const strongestSignal = Object.keys(signalCounts).reduce((a, b) => signalCounts[a] > signalCounts[b] ? a : b, '');
  if (signalCounts[strongestSignal] >= 1.5) {
    signal = strongestSignal;
    confidence = Math.min(signalCounts[strongestSignal] / 3, 1);
    details = `Strong ${signal.toUpperCase()} predicted for ${contractType} based on ${signals.length} indicators`;
  } else {
    signal = 'neutral';
    confidence = 0;
    details = 'Mixed or weak signals; wait for clearer pattern';
  }

  if (volatility.signal === 'warning') {
    signal = 'hold';
    confidence = 0;
    details = `Volatility spike detected—avoid trading ${contractType} now`;
  }

  return {
    contract: contractType,
    signal,
    confidence,
    details,
    individualSignals: { sma, stochastic, streak, volatility, risk }
  };
}

export {
  analyzeSMACrossover,
  analyzeStochastic,
  analyzeTickStreak,
  analyzeVolatilitySpike,
  analyzeRisk,
  combineSignals
};