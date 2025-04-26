import React, { useState } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { motion } from "framer-motion";
import Select from "react-select";


import './styles.css';

const strategies = {
  safeStart: {
    name: "Safe Start Strategy",
    description: `Phase 1: Risk 0.25% per trade. Take full profit at 1.5R. Continue using this risk model until reaching 1/3 of the total profit target.

Phase 2: Increase risk to 0.5% per trade. At 1R, take 50% of the position off and move stop to break-even. Let the rest run to 2R.

Pro Tip: If after the first partial there's still at least 2 contracts left, consider closing one at 2R and letting the last one run for maximum profit.`,
    inputs: ["accountSize", "currentPnL", "targetProfit"],
  },
  Expert: {
    name: "Expert mode",
    description: `This a free playground. Input your account size, and how much you want to risk. The calculator will do the rest.
Pro Tip: If you are not sure about the risk, use the "Safe Start" strategy to get a better idea of how much you should risk.`,
    inputs: ["accountSize", "riskPercent", "targetRR"],
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
  BT: 5,        // Bitcoin Futures: $5 per point
  MBT: 0.1,     // Micro Bitcoin Futures: $0.1 per point
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
    const { stopSize, asset, currentPnL, accountSize, targetProfit, riskPercent } = inputs;
    const account = parseFloat(accountSize);
    const stop = parseFloat(stopSize);
    const pnl = parseFloat(currentPnL);
    const target = parseFloat(targetProfit);
    const valuePerPoint = contractValuePerPoint[asset] || 2;
  
    const phase = selectedStrategy === "Expert" ? null : pnl >= target / 3 ? 2 : 1;
    const riskPercentValue =
      selectedStrategy === "Expert"
        ? parseFloat(riskPercent || 0) / 100 // Ha nincs megadva riskPercent, alapértelmezettként 0-t használunk
        : phase === 2
        ? 0.005
        : 0.0025;
  
    const riskAmount = account * riskPercentValue; // Az összes kockázat az egész számlára
    const contracts = Math.floor(riskAmount / (stop * valuePerPoint)); // A stop loss méretével osztjuk el
  
    return { contracts, riskAmount, phase, stop, valuePerPoint, account };
  };

  const handleStrategyChange = (strategy) => {
    setSelectedStrategy(strategy);
  
    // Inicializáljuk az új stratégia bemeneteit
    const newInputs = {};
    strategies[strategy].inputs.forEach((input) => {
      newInputs[input] = inputs[input] || ""; // Megtartjuk a meglévő értékeket, ha vannak
    });
    setInputs(newInputs);
  };

  const { contracts, riskAmount, phase, stop, valuePerPoint, account } = calculateContracts();
  const tpMultiplier =
    selectedStrategy === "Expert"
    ? parseFloat(inputs.targetRR || 1) // Az "Expert" stratégia esetén a targetRR-t használjuk
    : phase === 1
    ? 1.5
    : 2;
  const targetPoints = stop * tpMultiplier;
  const expectedPoints = targetPoints;

  const expectedProfit =
  selectedStrategy === "Expert"
    ? contracts * stop * valuePerPoint * parseFloat(inputs.targetRR || 1) // Az "Expert" stratégia esetén a targetRR-t használjuk
    : phase === 1
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
  const targetPrice =
    selectedStrategy === "Expert"
    ? entry + stop * parseFloat(inputs.targetRR || 1) // Az "Expert" stratégia esetén a targetRR-t használjuk
    : entry + targetPoints;
  const partialLevel = phase === 2 ? entry + stop : null; // 1R szint, csak phase 2 esetén

  const {
    showPartial,
    partialAmount,
    partialPercent,
    partialPoints
  } = calculatePositionData(entry, stopPrice, targetPrice, contracts, partialLevel);


  const profitBarHeight = `${tpMultiplier * 20}%`; // Például: 1.5 -> 30%, 2.0 -> 40%

  return (
    <div className="app-layout">
      {/* Bal oldali panel */}
      <div className="left-panel">
        <h1 className="app-title">Risk Management Calculator</h1>
  
        <div className="input-group">
          <Label className="strategy-label">Select a Strategy</Label>
          <Select
            options={Object.entries(strategies).map(([key, strat]) => ({
              value: key,
              label: strat.name,
            }))}
            value={{
              value: selectedStrategy,
              label: strategies[selectedStrategy].name,
            }}
            onChange={(selectedOption) => setSelectedStrategy(selectedOption.value)}
            placeholder="Select a strategy"
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: "#898c96",
                borderColor: "#2e2e2e",
                color: "white",
              }),
              singleValue: (base) => ({
                ...base,
                color: "white",
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "#898c96",
                color: "white",
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? "#728acc" : "#898c96",
                color: "white",
              }),
            }}
          />
        </div>
  
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
              options={Object.keys(contractValuePerPoint).map((symbol) => ({
                value: symbol,
                label: symbol,
              }))}
              value={{
                value: inputs.asset,
                label: inputs.asset,
              }}
              onChange={(selectedOption) =>
                setInputs({ ...inputs, asset: selectedOption.value })
              }
              placeholder="Select an instrument"
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: "#898c96",
                  borderColor: "#2e2e2e",
                  color: "white",
                }),
                singleValue: (base) => ({
                  ...base,
                  color: "white",
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "#898c96",
                  color: "white",
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? "#728acc" : "#898c96",
                  color: "white",
                }),
              }}
            />
          </div>
        </div>
  
        <Card className="info-card">
          <CardContent>
            <p>Suggested Contract Quantity: {contracts} contracts</p>
            <p>
              Expected Profit (if trade is successful): ${expectedProfit.toFixed(2)} (
              {expectedPoints.toFixed(2)} pts, {expectedPercent.toFixed(2)}%)
            </p>
          </CardContent>
        </Card>
      </div>
  
      {/* Jobb oldali panel */}
      <div className="right-panel">
      <motion.div
          className="position-visualization"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="target-label">
            Target: {targetAmount.toFixed(2)} USD ({targetPercent.toFixed(2)}%){" "}
            {targetPoints.toFixed(2)}
          </div>
  
          {showPartial && partialAmount && partialPercent && partialPoints && (
            <div className="partial-line">
              <span className="partial-text">
                Partial: {parseFloat(partialAmount).toFixed(2)} USD (
                {parseFloat(partialPercent).toFixed(2)}%){" "}
                {parseFloat(partialPoints).toFixed(2)}
              </span>
            </div>
          )}
  
          <div
            className="profit-bar"
            style={{
              "--profit-bar-height": profitBarHeight,
            }}
          ></div>
  
          <div className="info-bar">
            Expected Profit: {expectedProfit.toFixed(2)} USD (
            {expectedPercent.toFixed(2)}%)<br />
            Qty: {contracts} | Risk/Reward Ratio: {tpMultiplier.toFixed(2)}
          </div>
          <div className="loss-bar" />
          <div className="stop-label">
            Stop: {stopLossAmount.toFixed(2)} USD ({stopPercent.toFixed(2)}%){" "}
            {stop.toFixed(2)}
          </div>
        </motion.div>
      </div>
    </div>
  );
}