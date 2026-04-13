import { useState, useEffect, useRef } from 'react';

import { 
  ChevronLeft, Play, Pause, SkipForward, Plus, 
  Layout, History, BarChart3, Save, X, 
  TrendingUp, TrendingDown, Target, Zap, Clock,
  Download, Share2, Filter, Search
} from 'lucide-react';
import TradingChart from './TradingChart';
import BacktestDashboard from './BacktestDashboard';
import { saveBacktestTrade, getBacktestTrades } from '../../utils/db';

export default function BacktestSession({ backtest, onBack }) {
  const [activeTab, setActiveTab] = useState('chart');
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Replay State
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(100);
  const [historicalData, setHistoricalData] = useState([]);
  const [replaySpeed, setReplaySpeed] = useState(500);
  
  // Trade Entry State
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [newTrade, setNewTrade] = useState({
    type: 'BUY',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    lotSize: 1,
    notes: '',
    entryTime: ''
  });

  const chartRef = useRef();
  const replayTimerRef = useRef();

  useEffect(() => {
    fetchTrades();
    generateMockData();
  }, [backtest.id]);

  useEffect(() => {
    if (isReplaying) {
      replayTimerRef.current = setInterval(() => {
        handleNextCandle();
      }, replaySpeed);
    } else {
      clearInterval(replayTimerRef.current);
    }
    return () => clearInterval(replayTimerRef.current);
  }, [isReplaying, replayIndex, replaySpeed]);

  const generateMockData = () => {
    // Generate 500 mock candles
    const data = [];
    let price = 50000;
    const startTime = new Date(backtest.startDate || '2024-01-01').getTime() / 1000;
    
    for (let i = 0; i < 500; i++) {
        const change = (Math.random() - 0.5) * 200;
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * 50;
        const low = Math.min(open, close) - Math.random() * 50;
        
        data.push({
            time: startTime + i * 86400, // daily for simplicity
            open, high, low, close
        });
        price = close;
    }
    setHistoricalData(data);
    setLoading(false);
  };

  useEffect(() => {
      if (!loading && chartRef.current && historicalData.length > 0) {
          chartRef.current.updateData(historicalData.slice(0, replayIndex));
      }
  }, [loading, replayIndex, historicalData]);

  const fetchTrades = async () => {
    const data = await getBacktestTrades(backtest.id);
    setTrades(data);
  };

  const handleNextCandle = () => {
    if (replayIndex < historicalData.length) {
      setReplayIndex(prev => prev + 1);
    } else {
      setIsReplaying(false);
    }
  };

  const handleAddTrade = async (e) => {
    e.preventDefault();
    
    // Auto-calculate PnL
    const currentPrice = historicalData[replayIndex - 1].close;
    const entry = Number(newTrade.entryPrice) || currentPrice;
    const tp = Number(newTrade.takeProfit);
    const sl = Number(newTrade.stopLoss);
    
    // Mocking result based on random for now, but in reality, would wait for candles
    // Or users manually close trades.
    const result = Math.random() > 0.5 ? 'WIN' : 'LOSS';
    const pnl = result === 'WIN' ? (Math.abs(tp - entry) * 10) : -(Math.abs(sl - entry) * 10);

    const tradeData = {
        ...newTrade,
        entryPrice: entry,
        entryTime: new Date(historicalData[replayIndex - 1].time * 1000).toISOString(),
        result,
        pnl,
        pair: backtest.pair,
    };

    const saved = await saveBacktestTrade(backtest.id, tradeData);
    if (saved) {
        setTrades(prev => [...prev, saved]);
        setShowTradeModal(false);
        // Add marker to chart
        chartRef.current.addMarker({
            time: historicalData[replayIndex - 1].time,
            position: newTrade.type === 'BUY' ? 'belowBar' : 'aboveBar',
            color: newTrade.type === 'BUY' ? '#00ff66' : '#ff3366',
            shape: newTrade.type === 'BUY' ? 'arrowUp' : 'arrowDown',
            text: newTrade.type
        });
    }
  };

  const exportCSV = () => {
    if (trades.length === 0) return;
    const headers = ['Date', 'Pair', 'Type', 'Entry', 'SL', 'TP', 'PnL', 'Result'];
    const csvContent = [
        headers.join(','),
        ...trades.map(t => [
            new Date(t.entryTime).toLocaleDateString(),
            t.pair,
            t.type,
            t.entryPrice,
            t.stopLoss,
            t.takeProfit,
            t.pnl,
            t.result
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `backtest_${backtest.strategyName}_${backtest.pair}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      alert('Backtest session URL copied to clipboard for sharing (view-only mode requires shared journal access).');
  };

  return (
    <div className="session-container">
      <nav className="session-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="icon-btn"><ChevronLeft size={20} /></button>
          <div>
            <h2 style={{ fontSize: '1rem', margin: 0 }}>{backtest.strategyName}</h2>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{backtest.pair} • {backtest.timeframe} • Simulation Active</div>
          </div>
        </div>

        <div className="session-tabs">
          <button className={activeTab === 'chart' ? 'active' : ''} onClick={() => setActiveTab('chart')}><Layout size={16} /> REPLAY</button>
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}><BarChart3 size={16} /> DASHBOARD</button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}><History size={16} /> TRADES</button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="icon-btn-secondary" onClick={handleShare}><Share2 size={16} /></button>
            <button className="icon-btn-secondary" onClick={exportCSV} title="Export CSV"><Download size={16} /></button>
        </div>
      </nav>

      <div className="session-content">
        {activeTab === 'chart' && (
          <div className="chart-section">
            <div className="chart-header">
                <div className="replay-controls">
                    <button onClick={() => setReplayIndex(prev => Math.max(10, prev - 1))} className="icon-btn"><X size={14} /></button>
                    <button onClick={() => setIsReplaying(!isReplaying)} className="play-btn">
                        {isReplaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
                    </button>
                    <button onClick={handleNextCandle} className="icon-btn"><SkipForward size={18} /></button>
                    <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 0.5rem' }} />
                    <select value={replaySpeed} onChange={(e) => setReplaySpeed(Number(e.target.value))} className="speed-select">
                        <option value={1000}>1.0x</option>
                        <option value={500}>2.0x</option>
                        <option value={200}>5.0x</option>
                        <option value={100}>MAX</option>
                    </select>
                </div>
                <button onClick={() => setShowTradeModal(true)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                    <Plus size={14} /> PLACE_TRADE
                </button>
            </div>
            
            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)' }}>
                <TradingChart ref={chartRef} />
            </div>

            <div className="mini-history glass-panel">
                <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.7rem', fontWeight: 600 }}>SESSION_TICKER</div>
                <div className="ticker-list">
                    {trades.slice().reverse().map(t => (
                        <div key={t.id} className="ticker-item">
                            <span style={{ color: t.type === 'BUY' ? 'var(--success)' : 'var(--danger)' }}>{t.type}</span>
                            <span>{t.entryPrice.toFixed(2)}</span>
                            <span style={{ color: t.pnl >= 0 ? 'var(--success)' : 'var(--danger)' }}>{t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
            <BacktestDashboard backtest={backtest} trades={trades} />
        )}

        {activeTab === 'history' && (
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table className="trades-table">
                    <thead>
                        <tr>
                            <th>DATE</th>
                            <th>TYPE</th>
                            <th>ENTRY</th>
                            <th>SL</th>
                            <th>TP</th>
                            <th>PNL</th>
                            <th>RESULT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.map(t => (
                            <tr key={t.id}>
                                <td>{new Date(t.entryTime).toLocaleDateString()}</td>
                                <td style={{ color: t.type === 'BUY' ? 'var(--success)' : 'var(--danger)' }}>{t.type}</td>
                                <td>{t.entryPrice.toFixed(2)}</td>
                                <td>{t.stopLoss}</td>
                                <td>{t.takeProfit}</td>
                                <td style={{ color: t.pnl >= 0 ? 'var(--success)' : 'var(--danger)' }}>${t.pnl.toFixed(2)}</td>
                                <td><span className={`badge ${t.result === 'WIN' ? 'bg-success' : 'bg-danger'}`}>{t.result}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {showTradeModal && (
            <div className="modal-overlay" onClick={() => setShowTradeModal(false)}>
                <div 
                    className="modal-content glass-panel"
                    style={{ maxWidth: '400px' }}
                    onClick={e => e.stopPropagation()}
                >
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>EXECUTE_PROTOCOL</h3>
                        <button onClick={() => setShowTradeModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleAddTrade} style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button 
                                type="button" 
                                className={`type-btn ${newTrade.type === 'BUY' ? 'buy active' : ''}`}
                                onClick={() => setNewTrade(prev => ({ ...prev, type: 'BUY' }))}
                            >BUY</button>
                            <button 
                                type="button" 
                                className={`type-btn ${newTrade.type === 'SELL' ? 'sell active' : ''}`}
                                onClick={() => setNewTrade(prev => ({ ...prev, type: 'SELL' }))}
                            >SELL</button>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>ENTRY_PRICE (AUTO IF EMPTY)</label>
                            <input type="number" step="any" value={newTrade.entryPrice} onChange={e => setNewTrade(prev => ({ ...prev, entryPrice: e.target.value }))} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label>STOP_LOSS</label>
                                <input type="number" step="any" required value={newTrade.stopLoss} onChange={e => setNewTrade(prev => ({ ...prev, stopLoss: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label>TAKE_PROFIT</label>
                                <input type="number" step="any" required value={newTrade.takeProfit} onChange={e => setNewTrade(prev => ({ ...prev, takeProfit: e.target.value }))} />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label>SESSION_NOTES</label>
                            <textarea rows="2" value={newTrade.notes} onChange={e => setNewTrade(prev => ({ ...prev, notes: e.target.value }))} />
                        </div>

                        <button type="submit" className="btn-primary" style={{ width: '100%' }}>EXECUTE_TRADE</button>
                    </form>
                </div>
            </div>
        )}

      <style>{`
        .session-container {
            height: calc(100vh - 80px);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .session-nav {
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border);
            background: rgba(0,0,0,0.2);
        }
        .session-tabs {
            display: flex;
            background: rgba(255,255,255,0.05);
            padding: 0.25rem;
            border-radius: 0.75rem;
            gap: 0.25rem;
        }
        .session-tabs button {
            background: none;
            border: none;
            color: var(--text-muted);
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 0.7rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
        }
        .session-tabs button.active {
            background: var(--primary);
            color: #000;
        }
        .session-content {
            flex: 1;
            padding: 1.5rem;
            overflow-y: auto;
        }
        .chart-section {
            display: grid;
            grid-template-columns: 1fr 200px;
            grid-template-rows: auto 1fr;
            gap: 1rem;
            height: 100%;
        }
        .chart-header {
            grid-column: span 2;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 0.5rem;
        }
        .replay-controls {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255,255,255,0.05);
            padding: 0.4rem;
            border-radius: 0.75rem;
        }
        .play-btn {
            background: var(--primary);
            border: none;
            color: #000;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 0 15px var(--primary-shadow);
        }
        .speed-select {
            background: none;
            border: none;
            color: #fff;
            font-size: 0.7rem;
            font-weight: 700;
            cursor: pointer;
            padding-right: 0.5rem;
        }
        .icon-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .icon-btn:hover {
            color: #fff;
            background: rgba(255,255,255,0.1);
        }
        .icon-btn-secondary {
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--border);
            color: var(--text-muted);
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.5rem;
            cursor: pointer;
        }
        .mini-history {
            height: 400px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .ticker-list {
            flex: 1;
            overflow-y: auto;
            padding: 0.5rem;
        }
        .ticker-item {
            display: flex;
            justify-content: space-between;
            font-size: 0.65rem;
            padding: 0.4rem;
            border-bottom: 1px solid rgba(255,255,255,0.03);
            font-family: monospace;
        }
        .trades-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.8rem;
        }
        .trades-table th {
            text-align: left;
            padding: 1rem;
            background: rgba(255,255,255,0.03);
            color: var(--text-muted);
            font-size: 0.7rem;
            letter-spacing: 1px;
        }
        .trades-table td {
            padding: 1rem;
            border-bottom: 1px solid var(--border);
        }
        .type-btn {
            padding: 0.75rem;
            border-radius: 0.5rem;
            border: 1px solid var(--border);
            background: none;
            color: var(--text-muted);
            font-weight: 800;
            cursor: pointer;
            transition: all 0.2s;
        }
        .type-btn.buy.active {
            background: rgba(0,255,102,0.1);
            border-color: var(--success);
            color: var(--success);
        }
        .type-btn.sell.active {
            background: rgba(255,51,102,0.1);
            border-color: var(--danger);
            color: var(--danger);
        }
      `}</style>
    </div>
  );
}
