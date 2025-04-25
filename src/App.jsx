import React, { useState } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "./components/ui/select";
import { Label } from "./components/ui/label";
import { motion } from "framer-motion";

import './styles.css';

const strategies = {
  safeStart: {
    name: "Safe Start Strategy",
    description: `Phase 1: Risk 0.25% per trade. Take full profit at 1.5R. Continue using this risk model until reaching 1/3 of the total profit target.

Phase 2: Increase risk to 0.5% per trade. At 1R, take 50% of the position off and move stop to break-even. Let the rest run to 2R.

Pro Tip: If after the first partial there's still at least 2 contracts left, consider closing one at 2R and letting the last one run for maximum profit.`,
    inputs: ["accountSize", "currentPnL", "targetProfit"],
  },
};

export default function RiskManagementApp() {
  const [selectedStrategy, setSelectedStrategy] = useState("safeStart");
  const [inputs, setInputs] = useState({
    accountSize: "50000",
    currentPnL: "0",
    targetProfit: "3000",
    stopSize: "60",
    asset: "MNQ",
  });

  const contractValuePerPoint = {
  MNQ: 2,       // Micro E-mini Nasdaq: $2 per point
  MES: 5,       // Micro E-mini S&P 500: $5 per point
  NQ: 20,       // E-mini Nasdaq: $20 per point
  ES: 50,       // E-mini S&P 500: $50 per point
  YM: 5,        // E-mini Dow: $5 per point
  CL: 1000,     // Crude Oil: $1000 per point (tick size: 0.01, $10 per tick)
  MCL: 100,     // Micro Crude Oil: $100 per point (tick size: 0.01, $1 per tick)
  GC: 100,      // Gold: $100 per point (tick size: 0.1, $10 per tick)
  MGC: 10,      // Micro Gold: $10 per point (tick size: 0.1, $1 per tick)
  SI: 5000,     // Silver: $5000 per point (tick size: 0.005, $25 per tick)
  RB: 42000,    // RBOB Gasoline: $42,000 per point (tick size: 0.0001, $4.20 per tick)
  "6A": 100000, // Australian Dollar Futures: $100,000 per point (tick size: 0.0001, $10 per tick)
  "6B": 62500,  // British Pound Futures: $62,500 per point (tick size: 0.0001, $6.25 per tick)
  "6C": 100000, // Canadian Dollar Futures: $100,000 per point (tick size: 0.0001, $10 per tick)
  "6E": 125000, // Euro Futures: $125,000 per point (tick size: 0.0001, $12.50 per tick)
  M6A: 10000,   // Micro Australian Dollar Futures: $10,000 per point (tick size: 0.0001, $1 per tick)
  M6B: 6250,    // Micro British Pound Futures: $6,250 per point (tick size: 0.0001, $0.625 per tick)
  M6C: 10000,   // Micro Canadian Dollar Futures: $10,000 per point (tick size: 0.0001, $1 per tick)
  M6E: 12500,   // Micro Euro Futures: $12,500 per point (tick size: 0.0001, $1.25 per tick)
  };

  const currentStrategy = strategies[selectedStrategy];

  const calculatePositionData = (entry, stop, target, quantity, partialLevel = null) => {
    const riskPerUnit = Math.abs(entry - stop);
    const rewardPerUnit = Math.abs(target - entry);
  
    const riskAmount = riskPerUnit * quantity;
    const rewardAmount = rewardPerUnit * quantity;
  
    const partialAmount = partialLevel
      ? Math.abs(partialLevel - entry) * quantity
      : null;
  
    const showPartial = partialLevel !== null && partialAmount > 0;
  
    const partialPercent = partialLevel
      ? ((Math.abs(partialLevel - entry) / entry) * 100).toFixed(2)
      : null;
  
    const partialPoints = partialLevel
      ? Math.abs(partialLevel - entry).toFixed(2)
      : null;
  
    return {
      riskAmount,
      rewardAmount,
      partialAmount,
      partialPercent,
      partialPoints,
      showPartial,
    };
  };

  const calculateContracts = () => {
    const { stopSize, asset, currentPnL, accountSize, targetProfit } = inputs;
    const account = parseFloat(accountSize);
    const stop = parseFloat(stopSize);
    const pnl = parseFloat(currentPnL);
    const target = parseFloat(targetProfit);
    const valuePerPoint = contractValuePerPoint[asset] || 2;

    const phase = pnl >= target / 3 ? 2 : 1;
    const riskPercent = phase === 2 ? 0.005 : 0.0025;
    const riskAmount = account * riskPercent;
    const contracts = Math.floor(riskAmount / (stop * valuePerPoint));

    return { contracts, riskAmount, phase, stop, valuePerPoint, account };
  };

  const { contracts, riskAmount, phase, stop, valuePerPoint, account } = calculateContracts();
  const tpMultiplier = phase === 1 ? 1.5 : 2;
  const targetPoints = stop * tpMultiplier;
  const expectedPoints = targetPoints;

  const expectedProfit =
  phase === 1
    ? expectedPoints * valuePerPoint * contracts // Első fázis: teljes pozíció 1.5R vagy 2R
    : (0.5 * stop * valuePerPoint * contracts) + // 50% lezárás 1R-nél
      (0.5 * targetPoints * valuePerPoint * contracts); // 50% lezárás 2R-nél

  const stopLossAmount = stop * contracts * valuePerPoint;
  const targetAmount = expectedProfit; // A cél profit az összesített profit

  const stopPercent = (stopLossAmount / account) * 100;
  const targetPercent = (targetAmount / account) * 100;
  const expectedPercent = (expectedProfit / account) * 100;

  const entry = 10000; // vagy számold dinamikusan
  const stopPrice = entry - stop;
  const targetPrice = entry + targetPoints;
  const partialLevel = phase === 2 ? entry + stop : null; // 1R szint, csak phase 2 esetén

  const {
    showPartial,
    partialAmount,
    partialPercent,
    partialPoints
  } = calculatePositionData(entry, stopPrice, targetPrice, contracts, partialLevel);


  const profitBarHeight = `${tpMultiplier * 20}%`; // Például: 1.5 -> 30%, 2.0 -> 40%

  return (
    <div className="app-container">
      <h1 className="app-title">Risk Management Calculator</h1>

      <Label className="strategy-label">Select a Strategy </Label>
      <Select onValueChange={setSelectedStrategy} value={selectedStrategy}>
        <SelectTrigger className="strategy-select-trigger">
          <SelectValue placeholder="Select a strategy" />
        </SelectTrigger>
        <SelectContent className="strategy-select-content">
          {Object.entries(strategies).map(([key, strat]) => (
            <SelectItem key={key} value={key} className="strategy-select-item">
              {strat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Card className="strategy-card">
        <CardContent className="strategy-description">
          <p>{currentStrategy.description}</p>
        </CardContent>
      </Card>

      <div className="input-container">
        {currentStrategy.inputs.map((input) => (
          <div key={input} className="input-group">
            <Label className="input-label">{input.replace(/([A-Z])/g, ' $1')}</Label>
            <Input
              type="number"
              className="input-field"
              value={inputs[input]}
              onChange={(e) => setInputs({ ...inputs, [input]: e.target.value })}
            />
          </div>
        ))}
        <div className="input-group">
          <Label className="input-label">Stop Loss Size (in points)</Label>
          <Input
            type="number"
            className="input-field"
            value={inputs.stopSize}
            onChange={(e) => setInputs({ ...inputs, stopSize: e.target.value })}
          />
        </div>
        <div className="input-group">
          <Label className="input-label">Instrument</Label>
          <Select
            onValueChange={(value) => setInputs({ ...inputs, asset: value })}
            value={inputs.asset}
          >
            <SelectTrigger className="input-select-trigger">
              <SelectValue placeholder="Select an instrument"/>
            </SelectTrigger>
            <SelectContent className="input-select-content">
              {Object.keys(contractValuePerPoint).map((symbol) => (
                <SelectItem key={symbol} value={symbol} className="input-select-item">
                  {symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="info-card">
        <CardContent>
          <p>Suggested Contract Quantity: {contracts} contracts</p>
          <p>Expected Profit (if trade is successful): ${expectedProfit.toFixed(2)} ({expectedPoints.toFixed(2)} pts, {expectedPercent.toFixed(2)}%)</p>
        </CardContent>
      </Card>

      <motion.div
        className="position-visualization"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="target-label">
          Target: {targetAmount.toFixed(2)} USD ({targetPercent.toFixed(2)}%) {targetPoints.toFixed(2)}
        </div>

        {showPartial && partialAmount && partialPercent && partialPoints && (
          <div className="partial-line">
            <span className="partial-text">
              Partial: {parseFloat(partialAmount).toFixed(2)} USD ({parseFloat(partialPercent).toFixed(2)}%) {parseFloat(partialPoints).toFixed(2)}
            </span>
          </div>
        )}

        <div
          className="profit-bar"
          style={{
            "--profit-bar-height": profitBarHeight, // CSS változó beállítása
          }}
        ></div>

        <div className="info-bar">
          Expected Profit: {expectedProfit.toFixed(2)} USD ({expectedPercent.toFixed(2)}%)<br />
          Qty: {contracts} | Risk/Reward Ratio: {tpMultiplier.toFixed(2)}
        </div>
        <div className="loss-bar" />
        <div className="stop-label">
          Stop: {stopLossAmount.toFixed(2)} USD ({stopPercent.toFixed(2)}%) {stop.toFixed(2)}
        </div>
      </motion.div>
    </div>
  );
}