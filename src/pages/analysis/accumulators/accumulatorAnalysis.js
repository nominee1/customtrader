import { calculateSMA, calculateVolatility, calculateRiskStake } from '../sharedAnalysis';

// Tick Momentum: Adjusted for barrier proximity
function analyzeTickMomentum(ticks, symbol, upperBarrier, lowerBarrier) {
  if (!ticks || ticks.length < 10) {
    return {
      signal: 'neutral',
      strength: 0,
      details: `Insufficient tick data (need 10, got ${ticks.length})`,
    };
  }

  const shortSMA = calculateSMA(ticks, 5);
  const longSMA = calculateSMA(ticks, 10);
  if (!shortSMA || !longSMA) {
    return {
      signal: 'neutral',
      strength: 0,
      details: 'Failed to calculate momentum',
    };
  }

  const latestPrice = parseFloat(ticks[ticks.length - 1].price);
  const momentum = shortSMA - longSMA;
  const threshold = symbol.includes('1HZ') ? 0.2 : 0.5;
  const barrierProximity = Math.min(
    Math.abs(latestPrice - upperBarrier),
    Math.abs(latestPrice - lowerBarrier)
  );
  const signal =
    momentum > threshold || momentum < -threshold || barrierProximity < threshold
      ? 'risk'
      : 'safe';
  const strength = Math.min(1, (Math.abs(momentum) + (threshold - barrierProximity)) / (threshold * 2));

  return {
    signal,
    strength,
    details: `Momentum: ${momentum.toFixed(2)}, Proximity to barrier: ${barrierProximity.toFixed(2)}`,
    rawData: { shortSMA, longSMA },
  };
}

// Range Stability: Uses specific barrier values
function analyzeRangeStability(ticks, upperBarrier, lowerBarrier, growthRate) {
  if (!ticks || ticks.length < 10) {
    return {
      signal: 'neutral',
      strength: 0,
      details: `Insufficient tick data (need 10, got ${ticks.length})`,
    };
  }

  const prices = ticks.slice(-10).map((tick) => parseFloat(tick.price));
  const withinRange = prices.every((price) => price >= lowerBarrier && price <= upperBarrier);
  const avgDistance = prices.reduce(
    (acc, price) => acc + Math.min(Math.abs(price - upperBarrier), Math.abs(price - lowerBarrier)),
    0
  ) / prices.length;

  const signal = withinRange ? 'safe' : 'risk';
  const strength = withinRange ? 0.8 - avgDistance / (upperBarrier - lowerBarrier) : 0.6;

  return {
    signal,
    strength,
    details: withinRange
      ? `Within ${parseFloat(growthRate) * 100}% barriers (Avg distance: ${avgDistance.toFixed(2)})`
      : `Barrier breached (Avg distance: ${avgDistance.toFixed(2)})`,
  };
}

// Tick Count and Reset Analysis
function analyzeTickCount(tickCount, resetTimes) {
  const signal = tickCount === 0 ? 'risk' : tickCount >= 10 ? 'safe' : 'neutral';
  const strength = tickCount === 0 ? 0.8 : Math.min(1, tickCount / 20);

  return {
    signal,
    strength,
    details: `Ticks in range: ${tickCount}, Last reset: ${
      resetTimes.length > 0
        ? new Date(resetTimes[resetTimes.length - 1] * 1000).toLocaleTimeString()
        : 'None'
    }`,
  };
}

// Volatility Spike
function analyzeVolatilitySpike(ticks) {
  if (ticks.length < 21) {
    return {
      signal: 'neutral',
      strength: 0,
      details: 'Need at least 21 ticks for volatility analysis',
    };
  }

  const currentVol = calculateVolatility(ticks, 20);
  const prevVol = calculateVolatility(ticks.slice(0, -1), 20);

  if (!currentVol || !prevVol) {
    return {
      signal: 'neutral',
      strength: 0,
      details: 'Failed to calculate volatility',
    };
  }

  const spikeThreshold = 1.5;
  if (currentVol > prevVol * spikeThreshold) {
    return {
      signal: 'risk',
      strength: 1,
      details: `Volatility spike! (${currentVol.toFixed(2)} vs ${prevVol.toFixed(2)})`,
    };
  }
  return {
    signal: 'safe',
    strength: 0,
    details: `Volatility stable (${currentVol.toFixed(2)})`,
  };
}

// Risk Analysis
function analyzeRisk(balance, symbol, volatilityScore = 50) {
  const payout = 10;
  const risk = calculateRiskStake(balance, 1, payout, volatilityScore);

  return {
    signal: 'info',
    strength: 0,
    details: `Recommended stake: $${risk.stake} (Risk: 1% = $${risk.maxLoss})`,
  };
}

// Combine Signals
function combineSignals(ticks, symbol, growthRate, balance, upperBarrier, lowerBarrier, tickCount, resetTimes) {
  const momentum = analyzeTickMomentum(ticks, symbol, upperBarrier, lowerBarrier);
  const range = analyzeRangeStability(ticks, upperBarrier, lowerBarrier, growthRate);
  const tickCountAnalysis = analyzeTickCount(tickCount, resetTimes);
  const volatility = analyzeVolatilitySpike(ticks);
  const risk = analyzeRisk(balance, symbol, volatility.signal === 'risk' ? 100 : 50);

  const signals = [momentum, range, tickCountAnalysis, volatility].filter((s) => s && s.signal !== 'neutral');
  if (!signals.length) {
    return {
      contract: 'Accumulator',
      signal: 'neutral',
      confidence: 0,
      details: 'No clear signals detected',
      individualSignals: { momentum, range, tickCount: tickCountAnalysis, volatility, risk },
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
    confidence = Math.min(1, signalCounts[strongestSignal] / 3);
    details = `Strong ${strongestSignal.toUpperCase()} signal (Confidence: ${(confidence * 100).toFixed(0)}%)`;
  } else {
    details = 'Weak/mixed signals';
  }

  if (volatility.signal === 'risk' || tickCountAnalysis.signal === 'risk') {
    signal = 'hold';
    confidence = 0;
    details = 'High volatility or recent reset - avoid trading';
  }

  return {
    contract: 'Accumulator',
    signal,
    confidence,
    details,
    individualSignals: { momentum, range, tickCount: tickCountAnalysis, volatility, risk },
  };
}

export {
  analyzeTickMomentum,
  analyzeRangeStability,
  analyzeTickCount,
  analyzeVolatilitySpike,
  analyzeRisk,
  combineSignals,
};