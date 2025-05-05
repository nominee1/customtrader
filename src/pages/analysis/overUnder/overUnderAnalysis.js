import { calculateSMA, calculateStochastic, calculateVolatility, calculateRiskStake, getLastDigit } from '../sharedAnalysis';

// SMA Crossover
function analyzeSMACrossover(ticks, symbol, fastPeriod = 5, slowPeriod = 10) {
  if (ticks.length < slowPeriod + 1) {
    return {
      signal: 'neutral',
      strength: 0,
      details: 'Insufficient tick data for SMA analysis',
    };
  }

  const fastSMA = calculateSMA(ticks, fastPeriod, true);
  const slowSMA = calculateSMA(ticks, slowPeriod, true);
  if (!fastSMA || !slowSMA) {
    return {
      signal: 'neutral',
      strength: 0,
      details: 'Failed to calculate SMA values',
    };
  }

  const barrier = 4; // Configurable
  return {
    signal: fastSMA > barrier ? `over_${barrier}` : `under_${barrier}`,
    strength: Math.abs(fastSMA - barrier) / 5,
    details: `Digit SMA (${fastSMA.toFixed(1)}) vs barrier ${barrier}`,
  };
}

// Stochastic Oscillator
function analyzeStochastic(ticks, symbol) {
  const kPeriod = symbol.includes('1HZ') ? 8 : 14;
  if (ticks.length < kPeriod) {
    return {
      signal: 'neutral',
      strength: 0,
      details: 'Insufficient tick data for Stochastic analysis',
    };
  }

  const digitCounts = Array(10).fill(0);
  ticks.slice(-kPeriod).forEach((tick) => {
    digitCounts[getLastDigit(tick.price)]++;
  });
  const maxDigit = digitCounts.indexOf(Math.max(...digitCounts));

  const barrier = 4;
  return {
    signal: maxDigit > barrier ? `under_${barrier}` : `over_${barrier}`,
    strength: digitCounts[maxDigit] / kPeriod,
    details: `Frequent digit ${maxDigit} vs barrier ${barrier}`,
  };
}

// Tick Streak
function analyzeTickStreak(ticks, symbol) {
  if (!ticks || ticks.length < 2) {
    return {
      signal: 'neutral',
      strength: 0,
      details: 'Insufficient tick data for analysis',
    };
  }

  const getStreakThreshold = (sym) => {
    const thresholds = {
      R_10: 8,
      '1HZ10V': 6,
      R_25: 8,
      '1HZ25V': 6,
      R_50: 7,
      '1HZ50V': 5,
      R_75: 7,
      '1HZ75V': 5,
      R_100: 6,
      '1HZ100V': 4,
    };
    return thresholds[sym] || 5;
  };

  const streakThreshold = getStreakThreshold(symbol);
  let streak = 0;
  let direction = null;
  let results = [];

  for (let i = ticks.length - 1; i >= 0; i--) {
    const digit = getLastDigit(parseFloat(ticks[i].price));
    const currentDir = digit > 4 ? 'over' : 'under';

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
      streak,
    });

    if (streak >= streakThreshold) break;
  }

  if (streak >= streakThreshold) {
    return {
      signal: direction === 'over' ? 'under' : 'over',
      strength: Math.min(0.9, (streak / streakThreshold) * 0.9),
      details: `${streak}-tick ${direction} streak in last digits (Over/Under)`,
      rawData: results,
    };
  }

  return {
    signal: 'neutral',
    strength: 0,
    details: `No significant streak (current: ${streak} ${direction || 'flat'})`,
    rawData: results,
  };
}

// Volatility Spike
function analyzeVolatilitySpike(ticks) {
  if (ticks.length < 21) {
    return {
      signal: 'normal',
      strength: 0,
      details: 'Insufficient tick data for volatility analysis',
    };
  }

  const currentVol = calculateVolatility(ticks, 20, true);
  const prevVol = calculateVolatility(ticks.slice(0, -1), 20, true);

  if (!currentVol || !prevVol) {
    return {
      signal: 'normal',
      strength: 0,
      details: 'Failed to calculate volatility',
    };
  }

  const spikeThreshold = 1.5;
  if (currentVol > prevVol * spikeThreshold) {
    return {
      signal: 'warning',
      strength: 1,
      details: `Volatility spike detected (${currentVol.toFixed(2)} vs ${prevVol.toFixed(2)})`,
    };
  }
  return {
    signal: 'normal',
    strength: 0,
    details: `Volatility stable (${currentVol.toFixed(2)})`,
  };
}

// Risk Analysis
function analyzeRisk(balance, indexSymbol, volatilityScore = 50) {
  const payout = 85; // Mock; fetch via Deriv API
  const risk = calculateRiskStake(balance, 1, payout, volatilityScore);

  return {
    signal: 'info',
    strength: 0,
    details: `Stake $${risk.stake} to risk 1% ($${risk.maxLoss}). Potential profit: $${risk.potentialProfit}`,
  };
}

// Combine Signals
function combineSignals(ticks, symbol, balance) {
  const sma = analyzeSMACrossover(ticks, symbol);
  const stochastic = analyzeStochastic(ticks, symbol);
  const streak = analyzeTickStreak(ticks, symbol);
  const volatility = analyzeVolatilitySpike(ticks);
  const risk = analyzeRisk(balance, symbol, volatility.signal === 'warning' ? 100 : 50);

  const signals = [sma, stochastic, streak].filter((s) => s && s.signal !== 'neutral');
  if (!signals.length) {
    return {
      contract: 'Over/Under',
      signal: 'neutral',
      confidence: 0,
      details: 'No clear signals detected',
      individualSignals: { sma, stochastic, streak, volatility, risk },
    };
  }

  let signalCounts = {};
  let totalStrength = 0;

  signals.forEach((s) => {
    signalCounts[s.signal] = (signalCounts[s.signal] || 0) + s.strength;
    totalStrength += s.strength;
  });

  let signal = 'neutral';
  let confidence = 0;
  let details = '';

  const strongestSignal = Object.keys(signalCounts).reduce(
    (a, b) => (signalCounts[a] > signalCounts[b] ? a : b),
    ''
  );
  if (signalCounts[strongestSignal] >= 1.5) {
    signal = strongestSignal;
    confidence = Math.min(signalCounts[strongestSignal] / 3, 1);
    details = `Strong ${signal.toUpperCase()} predicted for Over/Under based on ${signals.length} indicators`;
  } else {
    signal = 'neutral';
    confidence = 0;
    details = 'Mixed or weak signals; wait for clearer pattern';
  }

  if (volatility.signal === 'warning') {
    signal = 'hold';
    confidence = 0;
    details = `Volatility spike detected—avoid trading Over/Under now`;
  }

  return {
    contract: 'Over/Under',
    signal,
    confidence,
    details,
    individualSignals: { sma, stochastic, streak, volatility, risk },
  };
}

export {
  analyzeSMACrossover,
  analyzeStochastic,
  analyzeTickStreak,
  analyzeVolatilitySpike,
  analyzeRisk,
  combineSignals,
};