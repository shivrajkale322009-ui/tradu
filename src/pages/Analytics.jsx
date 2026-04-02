import { useState, useEffect, useMemo } from 'react';
import { getTrades, getUserProfile } from '../utils/db';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ReferenceLine 
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Target, Zap, Clock, Brain, Wallet,
  BarChart3, PieChart as PieIcon, Activity, Flame, AlertTriangle, Info,
  Grid, Calendar, ChevronLeft, ChevronRight, Layers, Layout
} from 'lucide-react';

const COLORS = ['#00f3ff', '#ff3366', '#00ff66', '#8b5cf6', '#f59e0b'];

const StatCard = ({ title, value, subtext, icon: Icon, trend, color = 'var(--primary)' }) => (
  <motion.div 
    whileHover={{ y: -5, boxShadow: `0 0 20px ${color}33` }}
    className="glass-panel" 
    style={{ padding: '1rem', position: 'relative', overflow: 'hidden' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
      <div className="metric-label" style={{ fontSize: '0.7rem' }}>{title}</div>
      <div style={{ padding: '0.4rem', borderRadius: '0.5rem', background: `${color}15`, color: color }}>
        <Icon size={16} />
      </div>
    </div>
    <div className="metric-value" style={{ fontSize: '1.25rem', color: '#fff' }}>{value}</div>
    <div style={{ fontSize: '0.65rem', color: (trend >= 0 || trend === undefined) ? 'var(--success)' : 'var(--danger)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
      {trend !== undefined && (trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />)}
      {subtext}
    </div>
  </motion.div>
);

export default function Analytics() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      const fetchData = async () => {
        setLoading(true);
        const profile = await getUserProfile(currentUser.uid);
        const data = await getTrades(profile?.activeJournalId || currentUser.uid);
        setTrades(data.sort((a, b) => new Date(a.date) - new Date(b.date)));
        setLoading(false);
      };
      fetchData();
    }
  }, [currentUser]);

  const analyticsData = useMemo(() => {
    if (trades.length === 0) return null;

    // Tactical Categorization (v4.6)
    // C2C = Cost-to-Cost (Math.abs(pnl) < 0.5)
    const c2cArr = trades.filter(t => Math.abs(Number(t.pnl)) < 0.5);
    const wins = trades.filter(t => Number(t.pnl) >= 0.5);
    const losses = trades.filter(t => Number(t.pnl) <= -0.5);
    
    const totalPnl = trades.reduce((acc, t) => acc + Number(t.pnl), 0);
    // Dynamic Win Rate (Exclude C2C from base if you want, or include in total)
    // User requested "new category", common standard is wins / (total - c2c) or just wins/total.
    // We'll use (wins / totalMatches) but reflect the C2C in the profile.
    const winRate = (wins.length / (trades.length || 1)) * 100;
    
    // Profit Curve
    let rollingPnl = 0;
    const profitCurve = trades.map(t => {
      rollingPnl += Number(t.pnl);
      return { date: t.date, pnl: rollingPnl, individual: Number(t.pnl) };
    });

    // Strategy Performance
    const stratMap = {};
    trades.forEach(t => {
      const s = t.strategy || 'Unknown';
      if (!stratMap[s]) stratMap[s] = { name: s, pnl: 0, count: 0, wins: 0 };
      stratMap[s].pnl += Number(t.pnl);
      stratMap[s].count += 1;
      if (Number(t.pnl) > 0) stratMap[s].wins += 1;
    });
    const strategyPerformance = Object.values(stratMap).sort((a, b) => b.pnl - a.pnl);

    // Emotional Analysis
    const emotionMap = {};
    trades.forEach(t => {
      const e = t.emotion || 'neutral';
      if (!emotionMap[e]) emotionMap[e] = { name: e, pnl: 0, count: 0 };
      emotionMap[e].pnl += Number(t.pnl);
      emotionMap[e].count += 1;
    });
    const emotionalData = Object.values(emotionMap);

    // Streaks
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let lastType = null;
    let streakCount = 0;

    trades.forEach(t => {
      const type = Number(t.pnl) > 0 ? 'win' : 'loss';
      if (type === lastType) {
        streakCount++;
      } else {
        streakCount = 1;
        lastType = type;
      }
      if (type === 'win') maxWinStreak = Math.max(maxWinStreak, streakCount);
      else maxLossStreak = Math.max(maxLossStreak, streakCount);
    });

    // Best/Worst
    const sortedByPnl = [...trades].sort((a, b) => b.pnl - a.pnl);

    // Tactical Account Drawdown (Peak-to-Trough)
    let currentEquity = 0;
    let maxHigh = 0;
    let maxDrawdown = 0;

    trades.forEach(t => {
      currentEquity += Number(t.pnl);
      if (currentEquity > maxHigh) maxHigh = currentEquity;
      const dd = maxHigh - currentEquity;
      if (dd > maxDrawdown) maxDrawdown = dd;
    });

    return {
      totalTrades: trades.length,
      winRate: Number(winRate) || 0,
      totalPnl: Number(totalPnl) || 0,
      avgPnl: Number(totalPnl / (trades.length || 1)) || 0,
      wins: wins.length,
      losses: losses.length,
      c2c: c2cArr.length,
      profitCurve,
      strategyPerformance,
      emotionalData,
      maxWinStreak,
      maxLossStreak,
      maxDrawdown: Number(maxDrawdown) || 0,
      bestTrade: sortedByPnl[0],
      worstTrade: sortedByPnl[sortedByPnl.length - 1],
      winLossPie: [
        { name: 'Wins', value: wins.length },
        { name: 'Losses', value: losses.length },
        { name: 'C2C', value: c2cArr.length }
      ],
      matrix: (() => {
        const matrix = {};
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        
        trades.forEach(t => {
          const d = new Date(t.date);
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          if (!days.includes(dayName)) return;

          // Simple week of month calculation
          const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
          const weekNo = Math.ceil((d.getDate() + startOfMonth.getDay() - (startOfMonth.getDay() === 0 ? 6 : startOfMonth.getDay()-1)) / 7) || 1;

          if (!matrix[monthKey]) {
            matrix[monthKey] = {
              label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              weeks: {},
              total: 0
            };
          }
          if (!matrix[monthKey].weeks[weekNo]) {
            matrix[monthKey].weeks[weekNo] = { id: weekNo, days: {}, total: 0 };
            days.forEach(day => matrix[monthKey].weeks[weekNo].days[day] = 0);
          }
          matrix[monthKey].weeks[weekNo].days[dayName] += Number(t.pnl);
          matrix[monthKey].weeks[weekNo].total += Number(t.pnl);
          matrix[monthKey].total += Number(t.pnl);
        });
        return Object.entries(matrix).sort((a,b) => b[0].localeCompare(a[0]));
      })()
    };
  }, [trades]);

  if (loading) return <div className="page-container loading">PROCESSING_DATA_STREAMS...</div>;

  if (!analyticsData) {
    return (
      <div className="page-container">
        <header className="header" style={{ marginBottom: '1.5rem' }}>
          <h1>Unified Analytics</h1>
        </header>

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
            <Activity size={48} />
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>NO_SESSIONS_RECORDED</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '0.9rem', lineHeight: '1.6' }}>
            The current active journal has no trade sessions recorded. Once you or your partner log the first trade, your tactical performance metrics will initialize here.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/add')}
            className="btn-primary"
            style={{ marginTop: '1rem', padding: '0.75rem 2rem' }}
          >
            INITIATE_FIRST_TRADE
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '1200px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity className="text-primary" /> ADVANCED_ANALYTICS
        </h1>
        <p className="text-muted" style={{ fontSize: '0.8rem' }}>Strategic performance matrix and behavioral insights.</p>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard title="Win Rate" value={`${(Number(analyticsData.winRate) || 0).toFixed(1)}%`} subtext={`${analyticsData.wins} Wins / ${analyticsData.losses} Losses`} icon={Target} color="var(--success)" />
        <StatCard title="Net PnL" value={`$${(Number(analyticsData.totalPnl) || 0).toFixed(2)}`} subtext="Collective Gains" icon={Wallet} color="var(--primary)" />
        <StatCard title="Total Volume" value={analyticsData.totalTrades} subtext="Trades Logged" icon={BarChart3} color="var(--secondary)" />
        <StatCard title="Avg Profit" value={`$${(Number(analyticsData.avgPnl) || 0).toFixed(2)}`} subtext="Per Session" icon={Activity} />
      </div>

      {/* STRATEGIC PERFORMANCE MATRIX (v5.0) */}
      <div className="glass-panel" style={{ padding: '0', marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '0.85rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Grid size={16} className="text-primary" /> PERFORMANCE_STRATEGY_MATRIX
          </h2>
          <div className="badge bg-muted" style={{ fontSize: '0.6rem' }}>EXCEL_AUDIT_MODE</div>
        </div>
        
        <div style={{ overflowX: 'auto', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
          {analyticsData.matrix.map(([mKey, month]) => (
            <div key={mKey} style={{ marginBottom: '2rem', minWidth: '800px' }}>
              <div style={{ padding: '0.5rem 0', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.05em' }}>
                {month.label.toUpperCase()} <span className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 400 }}>| TOTAL: ${month.total.toFixed(2)}</span>
              </div>
              <table className="performance-matrix-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '100px', textAlign: 'left', padding: '0.5rem', color: 'var(--text-muted)' }}>WEEKDAY</th>
                    {Object.keys(month.weeks).sort((a,b) => a-b).map(wId => (
                      <th key={wId} style={{ border: '1px solid var(--border)', padding: '0.5rem' }}>WEEK {wId}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                    <tr key={day}>
                      <td style={{ padding: '0.5rem', border: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-muted)' }}>{day.toUpperCase()}</td>
                      {Object.keys(month.weeks).sort((a,b) => a-b).map(wId => {
                        const pnl = month.weeks[wId].days[day];
                        const intensity = Math.min(1, Math.abs(pnl) / 500);
                        const bgColor = pnl === 0 ? 'rgba(255,255,255,0.02)' : 
                                      pnl > 0 ? `rgba(0, 255, 102, ${0.15 + intensity * 0.7})` : 
                                      `rgba(255, 51, 102, ${0.15 + intensity * 0.7})`;
                        
                        return (
                          <td key={wId} style={{ 
                            border: '1px solid var(--border)', 
                            padding: '0.75rem', 
                            textAlign: 'center',
                            background: bgColor,
                            color: pnl === 0 ? 'rgba(255,255,255,0.1)' : (Math.abs(pnl) > 100 ? '#000' : '#fff'),
                            fontWeight: 700,
                            transition: 'all 0.2s'
                          }}>
                            {pnl !== 0 ? `${pnl > 0 ? '+' : '-'}$${Math.abs(pnl).toFixed(0)}` : '0'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr style={{ background: 'rgba(255,204,0,0.05)' }}>
                    <td style={{ padding: '0.5rem', border: '1px solid var(--border)', color: 'var(--warning)', fontWeight: 800 }}>TOTAL</td>
                    {Object.keys(month.weeks).sort((a,b) => a-b).map(wId => (
                      <td key={wId} style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center', color: 'var(--warning)', fontWeight: 800 }}>
                        ${month.weeks[wId].total.toFixed(0)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-main-grid" style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2 className="panel-title" style={{ paddingLeft: 0, background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layout size={16} className="text-secondary" /> EQUITY_CURVE_AUDIT
            </h2>
            <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.profitCurve}>
                  <defs>
                    <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--text-muted)" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false} 
                    minTickGap={40}
                    tickFormatter={(val) => {
                      const date = new Date(val);
                      return isNaN(date.getTime()) ? val : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    }}
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={v => `$${v}`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="pnl" stroke="var(--primary)" fill="url(#pnlGradient)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 className="panel-title" style={{ paddingLeft: 0, background: 'none', border: 'none' }}>Strategy Performance</h2>
              <div style={{ height: '250px', width: '100%', marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.strategyPerformance}>
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: 'rgba(0, 240, 255, 0.05)'}} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {analyticsData.strategyPerformance.map((entry, index) => (
                        <Cell key={index} fill={entry.pnl >= 0 ? 'var(--success)' : 'var(--danger)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 className="panel-title" style={{ paddingLeft: 0, background: 'none', border: 'none' }}>Psychology Matrix</h2>
              <div style={{ height: '250px', width: '100%', marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.winLossPie}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="var(--success)" />
                      <Cell fill="var(--danger)" />
                      <Cell fill="var(--warning)" />
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                {analyticsData.wins} W | {analyticsData.losses} L | {analyticsData.c2c} C2C
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Flame size={14} className="text-secondary" /> CONVICTION_LEVELS
            </h3>
            {analyticsData.emotionalData.map(e => (
              <div key={e.name} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span style={{ textTransform: 'capitalize' }}>{e.name}</span>
                  <span className={e.pnl >= 0 ? 'text-success' : 'text-danger'}>${e.pnl.toFixed(2)}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.abs(e.pnl / (Number(analyticsData.totalPnl) || 1)) * 100)}%` }}
                        style={{ height: '100%', background: e.pnl >= 0 ? 'var(--success)' : 'var(--danger)' }}
                    />
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={14} className="text-primary" /> SYSTEM_RECORDS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Best Performance</span>
                <span className="text-success" style={{ fontWeight: 600 }}>+${(Number(analyticsData.bestTrade?.pnl) || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Max Drawdown</span>
                <span className="text-danger" style={{ fontWeight: 600 }}>-${(Number(analyticsData.maxDrawdown) || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Win Streak</span>
                <span className="text-secondary" style={{ fontWeight: 600 }}>{analyticsData.maxWinStreak} <Flame size={10} style={{ display: 'inline' }} /></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Loss Streak</span>
                <span className="text-danger" style={{ fontWeight: 600 }}>{analyticsData.maxLossStreak} <AlertTriangle size={10} style={{ display: 'inline' }} /></span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.1)' }}>
            <h3 style={{ fontSize: '0.8rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Brain size={14} className="text-primary" /> AI_INSIGHT
            </h3>
            <p style={{ fontSize: '0.7rem', lineHeight: '1.4', color: 'var(--text-muted)' }}>
              {analyticsData.maxWinStreak > 3 ? "SYSTEM: Consecutive wins detected. Recommended: Tighten risk protocol to protect gains." : "HUD: Psychology levels within stable range."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
