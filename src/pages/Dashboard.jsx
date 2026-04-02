import { useState, useEffect, useMemo } from 'react';
import { getTrades, deleteTrade, getUserProfile } from '../utils/db';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Trash2, LogIn, User, ArrowRight, Activity, 
  Crosshair, Target, LayoutDashboard, Wallet, Clock, Shield, ArrowUpRight 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Sparkline = ({ data, color = 'var(--primary)' }) => (
  <div style={{ height: '30px', width: '80px', pointerEvents: 'none' }}>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <Area 
          type="monotone" 
          dataKey="v" 
          stroke={color} 
          fill={color} 
          fillOpacity={0.1} 
          strokeWidth={1.5} 
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</p>
        <p style={{ fontWeight: 600, color: payload[0].value >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          PnL: ${payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

// Custom lightweight counter hook to replace standard library issues
const AnimatedCounter = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime;
    const duration = 1500;
    const startValue = displayValue;
    const endValue = value;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const t = Math.min(progress / duration, 1);
      
      // easeOutExpo
      const easing = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const current = startValue + (endValue - startValue) * easing;
      
      setDisplayValue(current);
      if (t < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue);
  
  // Add thousands separators
  const parts = formatted.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  return <span>{prefix}{parts.join(".")}{suffix}</span>;
};

// Circular Progress Component
const CircularProgress = ({ value, size = 120, strokeWidth = 10, color = 'var(--success)' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}><AnimatedCounter value={value} />%</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Win Rate</div>
      </div>
    </div>
  );
};


export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, loginWithGoogle } = useAuth();
  const [trades, setTrades] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('ALL'); // 'ALL', 'MONTH', 'WEEK'

  useEffect(() => {
    if (currentUser) {
      loadTrades(currentUser.uid);
      loadProfile(currentUser.uid);
    } else {
      setTrades([]);
      setUserProfile(null);
      setLoading(false);
    }
  }, [currentUser]);

  const loadProfile = async (userId) => {
    const profile = await getUserProfile(userId);
    setUserProfile(profile);
  };

  const loadTrades = async (userId) => {
    setLoading(true);
    const data = await getTrades(userId);
    setTrades(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    setLoading(false);
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (window.confirm("Are you sure you want to delete this trade?")) {
      await deleteTrade(id);
      loadTrades(currentUser.uid);
    }
  };

  // Filter & Compute Stats
  const filteredTrades = useMemo(() => {
    if (timeFilter === 'ALL') return trades;
    const now = new Date();
    return trades.filter(t => {
      const d = new Date(t.date);
      if (timeFilter === 'MONTH') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (timeFilter === 'WEEK') {
        // very rough week filter (last 7 days)
        return (now - d) / (1000 * 60 * 60 * 24) <= 7;
      }
      return true;
    });
  }, [trades, timeFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayTrades = filteredTrades.filter(t => t.date === today);
    const todayPnl = todayTrades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);

    const wins = filteredTrades.filter(t => (Number(t.pnl) || 0) > 0);
    const losses = filteredTrades.filter(t => (Number(t.pnl) || 0) < 0);
    
    const totalProfit = wins.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);
    const totalLoss = Math.abs(losses.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0));
    
    const winRate = Math.round((wins.length / (filteredTrades.length || 1)) * 100);
    const totalPnl = filteredTrades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);

    // Sparkline mock data from recent trades
    const pnlPoints = filteredTrades.slice(0, 7).reverse().map(t => ({ v: Number(t.pnl) || 0 }));
    
    return { 
      winRate, 
      totalPnl, 
      todayPnl,
      totalTrades: filteredTrades.length,
      avgWin: wins.length > 0 ? totalProfit / wins.length : 0,
      avgLoss: losses.length > 0 ? totalLoss / losses.length : 0,
      winsCount: wins.length,
      lossesCount: losses.length,
      pnlPoints
    };
  }, [filteredTrades]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    return filteredTrades.slice().reverse().reduce((acc, trade) => {
      const pnl = Number(trade.pnl || 0);
      const cumulative = acc.length > 0 ? acc[acc.length - 1].cumulative + pnl : pnl;
      acc.push({ date: trade.date, pnl: pnl, cumulative: cumulative, pair: trade.pair });
      return acc;
    }, []);
  }, [filteredTrades]);

  if (loading) return <div className="page-container loading">Initializing Core Systems...</div>;

  if (!currentUser) {
    return (
      <div className="page-container empty-state" style={{marginTop: '4rem'}}>
        <Activity size={48} className="text-primary" style={{marginBottom: '1rem', opacity: 0.8}} />
        <h2>Terminal Access Required</h2>
        <p style={{marginBottom: '2rem'}}>Please authenticate to access the trading matrix.</p>
        <button className="btn-primary" onClick={loginWithGoogle} style={{display: 'inline-flex', alignItems: 'center', gap: '0.75rem'}}>
          <LogIn size={20} /> Access Terminal
        </button>
      </div>
    );
  }

  // Generate theme color dynamically for charts
  const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#3b82f6';

  return (
    <div className="page-container dashboard-layout">
      {/* HEADER SECTION */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Welcome, {userProfile?.displayName || currentUser.displayName?.split(' ')[0] || 'Trader'}
          </h1>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Market terminal active and ready.</p>
        </div>
        <Link to="/profile" className="tooltip-container" style={{ position: 'relative' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            overflow: 'hidden', 
            border: '2px solid var(--primary)', 
            boxShadow: '0 0 10px var(--primary-glow)' 
          }}>
            {userProfile?.photoURL || currentUser.photoURL ? (
              <img src={userProfile?.photoURL || currentUser.photoURL} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={24} className="text-primary" />
              </div>
            )}
          </div>
        </Link>
      </header>

      {/* 1. TOP METRICS ROW */}
      <div className="metrics-row">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel metric-card">
          <div className="metric-label"><Wallet size={14}/> Total Balance</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className="metric-value"><AnimatedCounter value={10000 + stats.totalPnl} prefix="$" decimals={2}/></div>
            <Sparkline data={stats.pnlPoints} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel metric-card">
          <div className="metric-label"><TrendingUp size={14}/> Today PnL</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className={`metric-value ${stats.todayPnl >= 0 ? 'glow-text-success' : 'glow-text-danger'}`}>
              <AnimatedCounter value={stats.todayPnl} prefix={stats.todayPnl >= 0 ? '+$' : '-$'} decimals={2}/>
            </div>
            <Sparkline data={stats.pnlPoints.slice(-3)} color={stats.todayPnl >= 0 ? 'var(--success)' : 'var(--danger)'} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel metric-card">
          <div className="metric-label"><Target size={14}/> Win Rate</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className="metric-value glow-text-success"><AnimatedCounter value={stats.winRate}/>%</div>
            <Sparkline data={stats.pnlPoints.map(p => ({ v: p.v > 0 ? 1 : 0 }))} color="var(--success)" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel metric-card">
          <div className="metric-label"><Activity size={14}/> Total Trades</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className="metric-value">{stats.totalTrades}</div>
            <Sparkline data={stats.pnlPoints.map((_, i) => ({ v: i }))} />
          </div>
        </motion.div>
      </div>

      {/* 2. MAIN SECTION GRID */}
      <div className="main-content-grid">
        {/* LEFT 70% */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass-panel chart-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Activity size={18} className="text-primary"/> Performance Curve
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['ALL', 'MONTH', 'WEEK'].map(f => (
                <button 
                  key={f} onClick={() => setTimeFilter(f)} 
                  className={`badge ${timeFilter === f ? 'active' : ''}`}
                  style={{ cursor: 'pointer', border: 'none', background: timeFilter === f ? 'var(--primary)' : 'transparent' }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="var(--primary)" 
                  strokeWidth={2.5}
                  fill="url(#colorCurve)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* RIGHT 30% */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div className="metric-label" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>Current Balance</div>
            <div className="glow-text-success" style={{ fontSize: '2rem', fontWeight: 800 }}>
              <AnimatedCounter value={10000 + stats.totalPnl} prefix="$" decimals={2}/>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress value={stats.winRate} size={140} strokeWidth={12} color="var(--primary)" />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }} className="glass-panel" style={{ padding: '1.25rem' }}>
            <div className="metric-label" style={{ marginBottom: '1rem' }}><Shield size={14}/> Risk Management</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span className="text-muted">Avg Risk/Reward</span>
                <span style={{ fontWeight: 600 }}>1 : 2.5</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span className="text-muted">Profit Factor</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>{(stats.totalPnl > 0 ? 1.8 : 0.9).toFixed(1)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="glass-panel journal-container">
        <h2 className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={18}/> Trade Journal</div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/records" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'none' }}>Archives</Link>
            <Link to="/add" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>+ Log Trade</Link>
          </div>
        </h2>
        <table className="sci-fi-table" style={{ width: '100%', textAlign: 'left' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Pair</th>
              <th>Type</th>
              <th>PNL</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.map(trade => (
              <tr key={trade.id} onClick={() => navigate(`/trade/${trade.id}`)} style={{ cursor: 'pointer' }}>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {trade.date}<br/>
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{trade.time}</span>
                </td>
                <td style={{ fontWeight: 600 }}>{trade.pair}</td>
                <td>
                  <span className={`badge ${(trade.type || 'long') === 'long' ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.7rem' }}>
                    {trade.type?.toUpperCase()}
                  </span>
                </td>
                <td className={Number(trade.pnl) >= 0 ? 'glow-text-success' : 'glow-text-danger'} style={{ fontWeight: 600 }}>
                  {Number(trade.pnl) >= 0 ? '+' : ''}${Math.abs(Number(trade.pnl)).toFixed(2)}
                </td>
                <td><ArrowUpRight size={16} className="text-muted"/></td>
              </tr>
            ))}
            {filteredTrades.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>Initial sequence required. No records found.</td></tr>
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
