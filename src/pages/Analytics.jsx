import { useState, useEffect, useMemo } from 'react';
import { getTrades, getUserProfile } from '../utils/db';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ReferenceLine,
  ComposedChart
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Target, Zap, Clock, Brain, Wallet,
  BarChart3, PieChart as PieIcon, Activity, Flame, AlertTriangle, Info,
  Grid, Calendar, ChevronLeft, ChevronRight, Layers, Layout, ShieldCheck,
  CheckCircle2, AlertCircle, Coffee, Moon, Sun, Monitor
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
  const [activeTab, setActiveTab] = useState('overview'); // overview, daily, strategy, sessions

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

    // --- Core Metrics ---
    const wins = trades.filter(t => Number(t.pnl) > 0);
    const losses = trades.filter(t => Number(t.pnl) < 0);
    const totalPnl = trades.reduce((acc, t) => acc + Number(t.pnl), 0);
    const winRate = (wins.length / (trades.length || 1)) * 100;

    // --- Trading Days & Frequency ---
    const tradesByDate = {};
    const tradesByHour = {};
    const tradesBySession = {
      'London': { name: 'London', pnl: 0, count: 0, wins: 0, hours: [8, 9, 10, 11, 12, 13, 14, 15] },
      'New York': { name: 'New York', pnl: 0, count: 0, wins: 0, hours: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22] },
      'Asia': { name: 'Asia', pnl: 0, count: 0, wins: 0, hours: [0, 1, 2, 3, 4, 5, 6, 7, 23] }
    };

    trades.forEach(t => {
      // Date Analytics
      const d = t.date;
      if (!tradesByDate[d]) tradesByDate[d] = { pnl: 0, count: 0, wins: 0 };
      tradesByDate[d].pnl += Number(t.pnl);
      tradesByDate[d].count += 1;
      if (Number(t.pnl) > 0) tradesByDate[d].wins += 1;

      // Time Analytics (using timestamp if available, else fallback)
      const dateObj = t.timestamp ? new Date(t.timestamp) : new Date(t.date);
      const hour = dateObj.getHours();
      if (!tradesByHour[hour]) tradesByHour[hour] = { hour, pnl: 0, count: 0, wins: 0 };
      tradesByHour[hour].pnl += Number(t.pnl);
      tradesByHour[hour].count += 1;
      if (Number(t.pnl) > 0) tradesByHour[hour].wins += 1;

      // Session Analysis
      Object.values(tradesBySession).forEach(session => {
        if (session.hours.includes(hour)) {
          session.count += 1;
          session.pnl += Number(t.pnl);
          if (Number(t.pnl) > 0) session.wins += 1;
        }
      });
    });

    const tradingDays = Object.keys(tradesByDate).length;
    const avgTradesPerDay = trades.length / (tradingDays || 1);
    const maxTradesInDay = Math.max(...Object.values(tradesByDate).map(d => d.count));
    
    // --- Overtrading Detection ---
    const overtradingThreshold = avgTradesPerDay * 1.5;
    const overtradedDays = Object.values(tradesByDate).filter(d => d.count > Math.max(5, overtradingThreshold)).length;

    // --- Consistency Score Calculation ---
    // 1. Regularity (Trading days ratio) - max 40 pts
    // 2. Risk Stability (Std Dev of PnL) - max 30 pts
    // 3. Frequency Control (Avg trades per day) - max 30 pts
    const regularityScore = Math.min(40, (tradingDays / 20) * 40); // Target 20 days/month
    const stdDevPnl = Math.sqrt(trades.reduce((sum, t) => sum + Math.pow(Number(t.pnl) - (totalPnl/trades.length), 2), 0) / trades.length);
    const riskScore = Math.max(0, 30 - (stdDevPnl / 100)); // Arbitrary normalization
    const frequencyScore = Math.max(0, 30 - (Math.max(0, avgTradesPerDay - 3) * 5)); // Penalty for > 3 trades/day
    const consistencyScore = Math.round(regularityScore + riskScore + frequencyScore);

    // --- Streaks ---
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentStreak = 0;
    let streakType = null;

    trades.forEach(t => {
      const win = Number(t.pnl) > 0;
      if (win) {
          if (streakType === 'win') currentStreak++;
          else { currentStreak = 1; streakType = 'win'; }
          maxWinStreak = Math.max(maxWinStreak, currentStreak);
      } else if (Number(t.pnl) < 0) {
          if (streakType === 'loss') currentStreak++;
          else { currentStreak = 1; streakType = 'loss'; }
          maxLossStreak = Math.max(maxLossStreak, currentStreak);
      }
    });
    // Current streak (last trades)
    const lastWin = Number(trades[trades.length-1]?.pnl) > 0;
    let count = 0;
    for(let i=trades.length-1; i>=0; i--) {
        if ((Number(trades[i].pnl) > 0) === lastWin) count++;
        else break;
    }
    currentWinStreak = lastWin ? count : 0;
    currentLossStreak = lastWin ? 0 : count;

    // --- Strategy Performance ---
    const stratMap = {};
    trades.forEach(t => {
      const s = t.strategy || 'RAW_ACTION';
      if (!stratMap[s]) stratMap[s] = { name: s, pnl: 0, count: 0, wins: 0 };
      stratMap[s].pnl += Number(t.pnl);
      stratMap[s].count += 1;
      if (Number(t.pnl) > 0) stratMap[s].wins += 1;
    });

    // --- Best/Worst Days ---
    const sortedDays = Object.entries(tradesByDate).sort((a,b) => b[1].pnl - a[1].pnl);

    // --- Smart Insights ---
    const insights = [];
    const bestHour = Object.values(tradesByHour).sort((a,b) => b.pnl - a.pnl)[0];
    if (bestHour) insights.push(`You perform best at ${bestHour.hour}:00 with $${bestHour.pnl.toFixed(0)} net profit.`);
    if (avgTradesPerDay > 5) insights.push(`Critical: Your average ${avgTradesPerDay.toFixed(1)} trades/day suggests potential overtrading.`);
    const topStrategy = Object.values(stratMap).sort((a,b) => b.pnl - a.pnl)[0];
    if (topStrategy) insights.push(`Your most reliable strategy is ${topStrategy.name} (${((topStrategy.wins/topStrategy.count)*100).toFixed(0)}% Win Rate).`);
    if (consistencyScore > 80) insights.push(`Discipline Alert: High consistency score maintained. Protocol stabilized.`);

    return {
      totalTrades: trades.length,
      winRate,
      totalPnl,
      avgPnl: totalPnl / trades.length,
      tradingDays,
      avgTradesPerDay,
      maxTradesInDay,
      overtradedDays,
      consistencyScore,
      maxWinStreak,
      maxLossStreak,
      currentWinStreak,
      currentLossStreak,
      bestDay: sortedDays[0],
      worstDay: sortedDays[sortedDays.length - 1],
      hourlyData: Object.values(tradesByHour).sort((a,b) => a.hour - b.hour),
      sessionData: Object.values(tradesBySession),
      dailyData: Object.entries(tradesByDate).map(([date, val]) => ({ date, ...val })),
      strategyPerformance: Object.values(stratMap).sort((a, b) => b.pnl - a.pnl),
      insights,
      profitCurve: trades.reduce((acc, t, idx) => {
          const prev = idx > 0 ? acc[idx-1].pnl : 0;
          acc.push({ date: t.date, pnl: prev + Number(t.pnl) });
          return acc;
      }, []),
      matrix: (() => {
        const matrix = {};
        const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        trades.forEach(t => {
          const d = new Date(t.date);
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          if (!weekdays.includes(dayName)) return;
          const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
          const weekNo = Math.ceil((d.getDate() + startOfMonth.getDay() - (startOfMonth.getDay() === 0 ? 6 : startOfMonth.getDay()-1)) / 7) || 1;
          if (!matrix[monthKey]) matrix[monthKey] = { label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), weeks: {}, total: 0 };
          if (!matrix[monthKey].weeks[weekNo]) {
            matrix[monthKey].weeks[weekNo] = { id: weekNo, days: {}, total: 0 };
            weekdays.forEach(day => matrix[monthKey].weeks[weekNo].days[day] = 0);
          }
          matrix[monthKey].weeks[weekNo].days[dayName] += Number(t.pnl);
          matrix[monthKey].weeks[weekNo].total += Number(t.pnl);
          matrix[monthKey].total += Number(t.pnl);
        });
        return Object.entries(matrix).sort((a,b) => b[0].localeCompare(a[0]));
      })()
    };
  }, [trades]);

  if (loading) return <div className="page-container loading">DECRYPTING_TRADING_PATTERNS...</div>;

  if (!analyticsData) {
    return (
      <div className="page-container">
        <header className="header" style={{ marginBottom: '1.5rem' }}>
          <h1>TRADE_ANALYTICS</h1>
        </header>

        <div className="glass-panel" style={{ 
          padding: '4rem 2rem', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '1.5rem',
          textAlign: 'center'
        }}>
          <Activity size={48} className="text-primary" />
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>MISSION_DATA_EMPTY</h2>
          <p style={{ color: 'var(--text-muted)' }}>Log your trades to initialize advanced behavioral analysis.</p>
        </div>
      </div>
    );
  }

  const TabButton = ({ id, label, icon: Icon }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`nav-item ${activeTab === id ? 'active' : ''}`}
      style={{ width: 'auto', height: 'auto', padding: '0.6rem 1.25rem', fontSize: '0.75rem', gap: '0.5rem', borderRadius: 'var(--radius-md)' }}
    >
      <Icon size={14} /> {label.toUpperCase()}
    </button>
  );

  return (
    <div className="page-container" style={{ maxWidth: '1400px' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
           <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <Brain className="text-primary" /> COGNITIVE_ANALYSIS
           </h1>
           <p className="text-muted" style={{ fontSize: '0.8rem' }}>Deep-dive into your trading behavior and consistency protocols.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <TabButton id="overview" label="Overview" icon={Layout} />
          <TabButton id="daily" label="Daily Activity" icon={Calendar} />
          <TabButton id="strategy" label="Strategies" icon={Target} />
          <TabButton id="sessions" label="Sessions" icon={Clock} />
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Top Row Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <StatCard title="Consistency Score" value={analyticsData.consistencyScore} subtext={analyticsData.consistencyScore >= 80 ? 'Consistent' : analyticsData.consistencyScore >= 50 ? 'Moderate' : 'Needs Work'} icon={ShieldCheck} color={analyticsData.consistencyScore >= 80 ? 'var(--success)' : 'var(--warning)'} />
                <StatCard title="Trading Days" value={analyticsData.tradingDays} subtext="Active sessions" icon={Calendar} color="var(--primary)" />
                <StatCard title="Win Streak" value={analyticsData.maxWinStreak} subtext={`Current: ${analyticsData.currentWinStreak}`} icon={Flame} color="var(--success)" />
                <StatCard title="Overtraded Days" value={analyticsData.overtradedDays} subtext="Threshold violation" icon={AlertTriangle} color="var(--danger)" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.8rem', margin: 0 }}>EQUITY_GROWTH_CURVE</h3>
                        <div className="badge bg-primary">v5.0_LIVE_AUDIT</div>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analyticsData.profitCurve}>
                                <defs>
                                    <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" hide />
                                <YAxis stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                <Area type="monotone" dataKey="pnl" stroke="var(--primary)" fill="url(#eqGradient)" strokeWidth={3} />
                                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(0, 243, 255, 0.03)', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                        <h4 style={{ fontSize: '0.75rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Brain size={14} className="text-primary" /> SYSTEM_INSIGHTS
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {analyticsData.insights.map((insight, i) => (
                                <div key={i} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                                    <div style={{ color: 'var(--primary)' }}>•</div> {insight}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.25rem' }}>
                         <h4 style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.1em' }}>STREAK_STABILITY</h4>
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{analyticsData.maxWinStreak}</div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>MAX_WIN</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>{analyticsData.maxLossStreak}</div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>MAX_LOSS</div>
                            </div>
                         </div>
                    </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'daily' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                 <StatCard title="Avg Trades/Day" value={analyticsData.avgTradesPerDay.toFixed(1)} subtext={`Target: < 3.0`} icon={Activity} />
                 <StatCard title="Max Intensity" value={analyticsData.maxTradesInDay} subtext="Trades in single day" icon={Zap} />
                 <StatCard title="Best Day" value={`+$${analyticsData.bestDay[1].pnl.toFixed(0)}`} subtext={analyticsData.bestDay[0]} icon={TrendingUp} color="var(--success)" />
                 <StatCard title="Worst Day" value={`-$${Math.abs(analyticsData.worstDay[1].pnl).toFixed(0)}`} subtext={analyticsData.worstDay[0]} icon={TrendingDown} color="var(--danger)" />
               </div>

               <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>TRADE_FREQUENCY_LOG</h3>
                  <div style={{ height: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.dailyData}>
                            <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis dataKey="date" hide />
                            <YAxis stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
                            <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                            <ReferenceLine y={analyticsData.avgTradesPerDay} stroke="var(--warning)" strokeDasharray="3 3" />
                        </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               {/* Matrix Re-integrated */}
               <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>DAILY_PnL_HEATMAP</h3>
                  {analyticsData.matrix.map(([mKey, month]) => (
                    <div key={mKey} style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>{month.label.toUpperCase()}</div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ minWidth: '600px', width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                                <thead>
                                    <tr>
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => <th key={d} style={{ padding: '0.4rem', border: '1px solid var(--border)' }}>{d}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.values(month.weeks).map(w => (
                                        <tr key={w.id}>
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => {
                                                const pnl = w.days[d];
                                                const intensity = Math.min(1, Math.abs(pnl) / 500);
                                                const bg = pnl === 0 ? 'transparent' : pnl > 0 ? `rgba(0, 255, 102, ${0.1 + intensity * 0.8})` : `rgba(255, 51, 102, ${0.1 + intensity * 0.8})`;
                                                return (
                                                    <td key={d} style={{ padding: '0.8rem', border: '1px solid var(--border)', textAlign: 'center', background: bg, fontWeight: 700 }}>
                                                        {pnl !== 0 ? (pnl > 0 ? `+$${pnl.toFixed(0)}` : `-$${Math.abs(pnl).toFixed(0)}`) : '-'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'strategy' && (
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {analyticsData.strategyPerformance.map(strat => (
                    <div key={strat.name} className="glass-panel" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>{strat.name}</h3>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{strat.count} EXEC_CYCLES</div>
                            </div>
                            <div className={strat.pnl >= 0 ? 'text-success' : 'text-danger'} style={{ fontWeight: 800 }}>
                                {strat.pnl >= 0 ? '+' : ''}${strat.pnl.toFixed(2)}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="mini-stat">
                                <div className="label">Win Rate</div>
                                <div className="value" style={{ fontSize: '1.25rem' }}>{((strat.wins / strat.count) * 100).toFixed(1)}%</div>
                            </div>
                            <div className="mini-stat">
                                <div className="label">Avg Result</div>
                                <div className="value" style={{ fontSize: '1.25rem' }}>${(strat.pnl / strat.count).toFixed(2)}</div>
                            </div>
                        </div>

                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(strat.wins / strat.count) * 100}%`, background: 'var(--success)', opacity: 0.6 }} />
                        </div>
                    </div>
                ))}
             </div>
          )}

          {activeTab === 'sessions' && (
             <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {analyticsData.sessionData.map(session => (
                        <div key={session.name} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: `${session.pnl >= 0 ? 'var(--success)' : 'var(--danger)'}15`, color: session.pnl >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                {session.name === 'London' ? <Monitor size={24} /> : session.name === 'New York' ? <Sun size={24} /> : <Moon size={24} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{session.name.toUpperCase()}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{session.count} Trades</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: session.pnl >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                        {session.pnl >= 0 ? '+' : ''}${session.pnl.toFixed(0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>HOURLY_PERFORMANCE_DISTRIBUTION</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={analyticsData.hourlyData}>
                                <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={h => `${h}:00`} />
                                <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                                <YAxis yAxisId="right" orientation="right" hide />
                                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
                                <Bar yAxisId="left" dataKey="pnl" radius={[4, 4, 0, 0]}>
                                    {analyticsData.hourlyData.map((entry, index) => (
                                        <Cell key={index} fill={entry.pnl >= 0 ? 'var(--success)' : 'var(--danger)'} />
                                    ))}
                                </Bar>
                                <Line yAxisId="right" type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: 'var(--primary)' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
             </div>
          )}
        </motion.div>
      </AnimatePresence>

      <style>{`
        .mini-stat .label {
          font-size: 0.6rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .mini-stat .value {
          font-weight: 700;
          color: #fff;
        }
        .textarea {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          color: #fff;
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}
