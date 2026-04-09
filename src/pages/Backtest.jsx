import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBacktests, getBacktestById, createBacktest, deleteBacktest } from '../utils/db';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Play, Trash2, ChevronRight, BarChart3, 
  History, Settings, TrendingUp, Target, Activity,
  Wallet, AlertTriangle, Shield, Filter, Search,
  Download, Share2, PlusCircle
} from 'lucide-react';
import BacktestDashboard from '../components/backtest/BacktestDashboard';
import BacktestForm from '../components/backtest/BacktestForm';
import BacktestSession from '../components/backtest/BacktestSession';
import StrategyComparison from '../components/backtest/BacktestStrategyComparison';
import SessionCaptureList from '../components/backtest/SessionCaptureList';
import SessionCaptureForm from '../components/backtest/SessionCaptureForm';
import { Camera, Layers } from 'lucide-react';

export default function Backtest() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [backtests, setBacktests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [activeBacktest, setActiveBacktest] = useState(null);
  const [view, setView] = useState('simulations'); // simulations, captures
  const [showCaptureForm, setShowCaptureForm] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (id) {
        fetchBacktestDetails(id);
      } else {
        fetchBacktests();
      }
    }
  }, [currentUser, id]);

  const fetchBacktests = async () => {
    setLoading(true);
    const data = await getBacktests(currentUser.uid);
    setBacktests(data);
    setLoading(false);
  };

  const fetchBacktestDetails = async (backtestId) => {
    setLoading(true);
    const data = await getBacktestById(backtestId);
    setActiveBacktest(data);
    setLoading(false);
  };

  const handleCreateBacktest = async (formData) => {
    const newBT = await createBacktest(currentUser.uid, formData);
    if (newBT) {
      setShowForm(false);
      fetchBacktests();
    }
  };

  const handleDeleteBacktest = async (e, btId) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this backtest? All associated trades will be lost.')) {
      await deleteBacktest(btId);
      fetchBacktests();
    }
  };

  if (loading) {
    return <div className="page-container loading">INITIALIZING_BACKTEST_ENGINE...</div>;
  }

  // If we have an active backtest ID, show the session view
  if (id && activeBacktest) {
    return <BacktestSession backtest={activeBacktest} onBack={() => navigate('/backtest')} />;
  }

  return (
    <div className="page-container" style={{ maxWidth: '1200px' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity className="text-primary" /> STRATEGIC_BACKTESTER
          </h1>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>Simulate performance using historical protocols.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="compact-bar" style={{ padding: '0.25rem', gap: '0.25rem' }}>
            <button 
              onClick={() => setView('simulations')} 
              className={`nav-item ${view === 'simulations' ? 'active' : ''}`}
              style={{ width: 'auto', height: 'auto', padding: '0.4rem 1rem', fontSize: '0.7rem' }}
            >
              <Zap size={14} /> SIMULATIONS
            </button>
            <button 
              onClick={() => setView('captures')} 
              className={`nav-item ${view === 'captures' ? 'active' : ''}`}
              style={{ width: 'auto', height: 'auto', padding: '0.4rem 1rem', fontSize: '0.7rem' }}
            >
              <Camera size={14} /> CAPTURES
            </button>
          </div>

          {view === 'simulations' ? (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
            >
              <Plus size={18} /> NEW_BACKTEST
            </motion.button>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCaptureForm(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
            >
              <Camera size={18} /> NEW_SESSION_CAPTURE
            </motion.button>
          )}

          {backtests.length > 1 && view === 'simulations' && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCompareMode(!compareMode);
                setSelectedForCompare([]);
              }}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderColor: compareMode ? 'var(--primary)' : 'var(--border)' }}
            >
              <Zap size={18} className={compareMode ? 'text-primary' : ''} /> {compareMode ? 'EXIT_COMPARE' : 'COMPARE_MODELS'}
            </motion.button>
          )}
        </div>
      </header>

      {compareMode && (
        <div style={{ marginBottom: '2rem' }}>
          <StrategyComparison backtests={backtests.filter(b => selectedForCompare.includes(b.id))} />
        </div>
      )}

      {backtests.length === 0 && view === 'simulations' ? (
        <div className="glass-panel" style={{ 
          padding: '4rem 2rem', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '1.5rem',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed var(--border)'
        }}>
          <div style={{ padding: '1.5rem', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.05)', color: 'var(--primary)', marginBottom: '1rem' }}>
            <History size={48} />
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>NO_BACKTESTS_FOUND</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Initialize your first simulation to start analyzing strategy performance against historical data.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="btn-primary"
            style={{ marginTop: '1rem', padding: '0.75rem 2rem' }}
          >
            START_FIRST_SESSION
          </motion.button>
        </div>
      ) : (
        view === 'simulations' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {backtests.map((bt) => (
            <motion.div 
              key={bt.id}
              whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
              className={`glass-panel backtest-card ${selectedForCompare.includes(bt.id) ? 'selected' : ''}`}
              onClick={() => {
                if (compareMode) {
                  setSelectedForCompare(prev => 
                    prev.includes(bt.id) ? prev.filter(id => id !== bt.id) : [...prev, bt.id]
                  );
                } else {
                  navigate(`/backtest/${bt.id}`);
                }
              }}
              style={{ 
                padding: '1.5rem', 
                cursor: 'pointer', 
                position: 'relative', 
                overflow: 'hidden',
                border: selectedForCompare.includes(bt.id) ? '1px solid var(--primary)' : '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div className="badge bg-primary" style={{ fontSize: '0.6rem', marginBottom: '0.5rem' }}>{bt.market || 'CRYPTO'}</div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{bt.strategyName}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {bt.pair} • {bt.timeframe}
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDeleteBacktest(e, bt.id)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', padding: '0.5rem', cursor: 'pointer', borderRadius: '0.5rem' }}
                  className="hover-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="mini-stat">
                  <div className="label">Win Rate</div>
                  <div className="value" style={{ color: bt.winRate >= 50 ? 'var(--success)' : 'var(--danger)' }}>
                    {bt.winRate?.toFixed(1)}%
                  </div>
                </div>
                <div className="mini-stat">
                  <div className="label">Net PnL</div>
                  <div className="value" style={{ color: bt.netPnl >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {bt.netPnl >= 0 ? '+' : ''}${bt.netPnl?.toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <TrendingUp size={12} /> {bt.tradesCount} Trades
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Play size={12} /> Resume Simulation
                </div>
              </div>

              {/* Decorative gradient overlay */}
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                right: 0, 
                width: '100px', 
                height: '100px', 
                background: `radial-gradient(circle at top right, ${bt.netPnl >= 0 ? 'rgba(0,255,102,0.05)' : 'rgba(255,51,102,0.05)'}, transparent)`,
                pointerEvents: 'none'
              }} />
            </motion.div>
          ))}
        </div>
      ) : (
        <SessionCaptureList />
      )}

      <AnimatePresence>
        {showForm && (
          <BacktestForm 
            onClose={() => setShowForm(false)} 
            onSubmit={handleCreateBacktest} 
          />
        )}
        {showCaptureForm && (
          <SessionCaptureForm
            onClose={() => setShowCaptureForm(false)}
            onSave={() => window.location.reload()} // Simple refresh to fetch new data
          />
        )}
      </AnimatePresence>
      
      <style>{`
        .backtest-card:hover h3 {
          color: var(--primary);
        }
        .mini-stat .label {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.2rem;
        }
        .mini-stat .value {
          font-size: 1.1rem;
          font-weight: 700;
        }
        .hover-danger:hover {
          color: var(--danger) !important;
          background: rgba(255,51,102,0.1) !important;
        }
      `}</style>
    </div>
  );
}
