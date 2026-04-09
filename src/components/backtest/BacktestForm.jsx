import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Target, BarChart3, Clock, Wallet, Shield } from 'lucide-react';

export default function BacktestForm({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    strategyName: '',
    market: 'Forex',
    pair: '',
    timeframe: '15m',
    startDate: '',
    endDate: '',
    initialCapital: 10000,
    riskPerTrade: 1,
    description: '',
    tags: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="modal-content glass-panel"
        style={{ width: '100%', maxWidth: '600px', padding: 0, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Target className="text-primary" size={20} /> INITIALIZE_NEW_BACKTEST
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>STRATEGY_NAME</label>
              <input 
                type="text" 
                name="strategyName" 
                placeholder="e.g., SMC Mean Reversion, Breakout v2" 
                value={formData.strategyName} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>MARKET_TYPE</label>
              <select name="market" value={formData.market} onChange={handleChange}>
                <option value="Forex">Forex</option>
                <option value="Crypto">Crypto</option>
                <option value="Stocks">Stocks</option>
                <option value="Commodities">Commodities</option>
              </select>
            </div>

            <div className="form-group">
              <label>SYMBOL_IDENTIFIER</label>
              <input 
                type="text" 
                name="pair" 
                placeholder="e.g., EURUSD, BTCUSDT" 
                value={formData.pair} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>TIMEFRAME</label>
              <select name="timeframe" value={formData.timeframe} onChange={handleChange}>
                <option value="1m">1m</option>
                <option value="5m">5m</option>
                <option value="15m">15m</option>
                <option value="1h">1h</option>
                <option value="4h">4h</option>
                <option value="Daily">Daily</option>
              </select>
            </div>

            <div className="form-group">
              <label>RISK_PER_TRADE (%)</label>
              <input 
                type="number" 
                name="riskPerTrade" 
                step="0.1"
                value={formData.riskPerTrade} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>START_DATE</label>
              <input 
                type="date" 
                name="startDate" 
                value={formData.startDate} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>END_DATE</label>
              <input 
                type="date" 
                name="endDate" 
                value={formData.endDate} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>INITIAL_EQUITY ($)</label>
              <input 
                type="number" 
                name="initialCapital" 
                value={formData.initialCapital} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>MISSION_PARAMETERS (NOTES)</label>
              <textarea 
                name="description" 
                rows="3" 
                placeholder="Strategy rules, entry/exit criteria..." 
                value={formData.description} 
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              ABORT
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }}>
              INITIALIZE_SESSION
            </button>
          </div>
        </form>
      </motion.div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 1rem;
        }
        .form-group {
          margin-bottom: 0;
        }
        .form-group label {
          display: block;
          font-size: 0.65rem;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
          font-family: monospace;
          letter-spacing: 1px;
        }
        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          color: #fff;
          padding: 0.75rem;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          border-color: var(--primary);
          background: rgba(255,255,255,0.08);
          outline: none;
          box-shadow: 0 0 0 2px rgba(0,243,255,0.1);
        }
        .btn-secondary {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          color: #fff;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .btn-secondary:hover {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
    </motion.div>
  );
}
