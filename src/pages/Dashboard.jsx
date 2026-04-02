import { useState, useEffect, useMemo } from 'react';
import { getTrades, deleteTrade, getUserProfile } from '../utils/db';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Trash2, LogIn, User, ArrowRight, Activity, 
  Crosshair, Target, LayoutDashboard, Wallet, Clock, Shield, ArrowUpRight, Maximize2, Download, X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
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
      const easing = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const current = startValue + (endValue - startValue) * easing;
      setDisplayValue(current);
      if (t < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue);
  const parts = formatted.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return <span>{prefix}{parts.join(".")}{suffix}</span>;
};

const CircularProgress = ({ value, size = 120, strokeWidth = 10, color = 'var(--success)' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255, 255, 255, 0.1)" strokeWidth={strokeWidth} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }}
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
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (currentUser) {
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
    if (profile?.activeJournalId) {
      loadTrades(profile.activeJournalId);
    } else {
      loadTrades(userId);
    }
  };

  const loadTrades = async (id) => {
    setLoading(true);
    const data = await getTrades(id);
    setTrades(data);
    setLoading(false);
  };

  const exportCSV = () => {
    const headers = ["Date", "Pair", "Type", "PNL"];
    const rows = filteredTrades.map(t => [t.date, t.pair, t.type, t.pnl]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dashboard_trades_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (isExpanded) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
  }, [isExpanded]);

  const filteredTrades = useMemo(() => {
    if (timeFilter === 'ALL') return trades;
    const now = new Date();
    return trades.filter(t => {
      const d = new Date(t.date);
      if (timeFilter === 'MONTH') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (timeFilter === 'WEEK') return (now - d) / (1000 * 60 * 60 * 24) <= 7;
      return true;
    });
  }, [trades, timeFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayTrades = filteredTrades.filter(t => t.date === today);
    const todayPnl = todayTrades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);
    const wins = filteredTrades.filter(t => (Number(t.pnl) || 0) > 0);
    const losses = filteredTrades.filter(t => (Number(t.pnl) || 0) < 0);
    const winRate = Math.round((wins.length / (filteredTrades.length || 1)) * 100);
    const totalPnl = filteredTrades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);
    const pnlPoints = filteredTrades.slice(0, 7).reverse().map(t => ({ v: Number(t.pnl) || 0 }));
    
    return { 
      winRate, totalPnl, todayPnl,
      totalTrades: filteredTrades.length,
      pnlPoints
    };
  }, [filteredTrades]);

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

  return (
    <div className="page-container dashboard-layout">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Welcome, {userProfile?.displayName || currentUser.displayName?.split(' ')[0] || 'Trader'}
          </h1>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Market terminal active and ready.</p>
        </div>
        <Link to="/profile">
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary)', boxShadow: '0 0 10px var(--primary-glow)' }}>
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

      <div className="metrics-row">
        <div className="glass-panel metric-card">
          <div className="metric-label"><Wallet size={14}/> Total Balance</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div className="metric-value">
                <AnimatedCounter value={(userProfile?.capital || 0) + stats.totalPnl} prefix="$" decimals={2}/>
              </div>
              {userProfile?.capital > 0 && (
                <div style={{ fontSize: '0.7rem', color: stats.totalPnl >= 0 ? 'var(--secondary)' : 'var(--danger)', marginTop: '0.2rem', fontWeight: 600 }}>
                  {stats.totalPnl >= 0 ? '+' : ''}{((stats.totalPnl / userProfile.capital) * 100).toFixed(2)}% Growth
                </div>
              )}
            </div>
            <Sparkline data={stats.pnlPoints} color={stats.totalPnl >= 0 ? 'var(--secondary)' : 'var(--danger)'} />
          </div>
        </div>
        <div className="glass-panel metric-card">
          <div className="metric-label"><TrendingUp size={14}/> Today PnL</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className={`metric-value ${stats.todayPnl >= 0 ? 'glow-text-success' : 'glow-text-danger'}`}>
              <AnimatedCounter value={stats.todayPnl} prefix={stats.todayPnl >= 0 ? '+$' : '-$'} decimals={2}/>
            </div>
            <Sparkline data={stats.pnlPoints.slice(-3)} color={stats.todayPnl >= 0 ? 'var(--success)' : 'var(--danger)'} />
          </div>
        </div>
        <div className="glass-panel metric-card">
          <div className="metric-label"><Target size={14}/> Win Rate</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className="metric-value glow-text-success"><AnimatedCounter value={stats.winRate}/>%</div>
            <Sparkline data={stats.pnlPoints.map(p => ({ v: p.v > 0 ? 1 : 0 }))} color="var(--success)" />
          </div>
        </div>
        <div className="glass-panel metric-card">
          <div className="metric-label"><Activity size={14}/> Total Trades</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className="metric-value">{stats.totalTrades}</div>
            <Sparkline data={stats.pnlPoints.map((_, i) => ({ v: i }))} />
          </div>
        </div>
      </div>

      <div className="main-content-grid">
        <div className="glass-panel chart-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Activity size={18} className="text-primary"/> Performance Curve
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['ALL', 'MONTH', 'WEEK'].map(f => (
                <button key={f} onClick={() => setTimeFilter(f)} className={`badge ${timeFilter === f ? 'active' : ''}`} style={{ cursor: 'pointer', border: 'none', background: timeFilter === f ? 'var(--primary)' : 'transparent' }}>{f}</button>
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
                <Area type="monotone" dataKey="cumulative" stroke="var(--primary)" strokeWidth={2.5} fill="url(#colorCurve)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress value={stats.winRate} size={140} strokeWidth={12} color="var(--primary)" />
          </div>
        </div>
      </div>

      <LayoutGroup>
        <motion.div layoutId="journal-panel" className="glass-panel journal-container" onDoubleClick={() => setIsExpanded(true)}>
          <h2 className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={18}/> Trade Journal</div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link to="/records" className="text-primary" style={{ fontSize: '0.85rem', textDecoration: 'none', marginRight: '0.5rem' }}>Archives</Link>
              <button className="icon-btn text-muted" onClick={exportCSV} title="Export CSV"><Download size={16} /></button>
              <button className="icon-btn text-muted" onClick={() => setIsExpanded(true)} title="Focus Mode"><Maximize2 size={16} /></button>
            </div>
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <JournalTable trades={filteredTrades} navigate={navigate} />
          </div>
        </motion.div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div layoutId="journal-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#050a19', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(0, 240, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <h1 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '0.1rem' }}>JOURNAL_FOCUS</h1>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', paddingTop: '0.3rem' }}>{filteredTrades.length} RECENT SESSIONS</div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={exportCSV}><Download size={18} /> EXPORT_DATA</button>
                  <button className="icon-btn" onClick={() => setIsExpanded(false)}><X size={24} /></button>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                  <JournalTable trades={filteredTrades} navigate={navigate} isExpanded={true} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}

const JournalTable = ({ trades, navigate, isExpanded }) => (
  <table className={`sci-fi-table ${isExpanded ? 'expanded-mode' : ''}`} style={{ width: '100%', textAlign: 'left' }}>
    <thead style={{ position: isExpanded ? 'sticky' : 'static', top: 0, zIndex: 10 }}>
      <tr>
        <th style={{ width: '50px' }}>#</th>
        <th>Date</th>
        <th>Pair</th>
        <th>Type</th>
        <th>PNL</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <AnimatePresence mode="popLayout">
        {trades.map((trade, idx) => (
          <motion.tr key={trade.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, delay: idx * 0.03 }} onClick={() => navigate(`/trade/${trade.id}`)} 
            style={{ cursor: 'pointer' }} className="row-glow"
          >
            <td style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              #{String(trade.tradeNo || trades.length - idx).padStart(3, '0')}
            </td>
            <td style={{ color: 'var(--text-muted)', fontSize: isExpanded ? '0.9rem' : '0.8rem', padding: isExpanded ? '1.5rem 1rem' : '1rem' }}>
              {(() => {
                const utcString = `${trade.date}T${trade.time}Z`;
                const date = new Date(utcString);
                // If it's an invalid date (fallback for old records), use raw
                if (isNaN(date.getTime())) return <>{trade.date}<br/><span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{trade.time}</span></>;
                return (
                  <>
                    {date.toLocaleDateString()}<br/>
                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                );
              })()}
            </td>
            <td style={{ fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isExpanded ? '1.1rem' : '1rem' }}>
                {trade.pair}
                {idx === 0 && !isExpanded && <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />}
              </div>
            </td>
            <td><span className={`badge ${(trade.type || 'long') === 'long' ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.7rem' }}>{trade.type?.toUpperCase()}</span></td>
            <td className={Number(trade.pnl) >= 0 ? 'glow-text-success' : 'glow-text-danger'} style={{ fontWeight: 600, fontSize: isExpanded ? '1.2rem' : '1rem' }}>
              {Number(trade.pnl) >= 0 ? '+' : ''}${Math.abs(Number(trade.pnl)).toFixed(2)}
            </td>
            <td><ArrowUpRight size={16} className="text-muted"/></td>
          </motion.tr>
        ))}
      </AnimatePresence>
      {trades.length === 0 && (
        <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>Initial sequence required. No records found.</td></tr>
      )}
    </tbody>
  </table>
);
