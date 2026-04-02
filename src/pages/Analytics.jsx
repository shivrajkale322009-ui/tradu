import { useState, useEffect, useMemo } from 'react';
import { getTrades, getUserProfile } from '../utils/db';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area 
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Target, Zap, Clock, Brain, 
  BarChart3, PieChart as PieIcon, Activity, Flame, AlertTriangle, Info
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
    <div style={{ fontSize: '0.65rem', color: trend >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
      {trend !== undefined && (trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />)}
      {subtext}
    </div>
  </motion.div>
);

export default function Analytics() {
  const { currentUser } = useAuth();
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

    const wins = trades.filter(t => Number(t.pnl) > 0);
    const losses = trades.filter(t => Number(t.pnl) < 0);
    const totalPnl = trades.reduce((acc, t) => acc + Number(t.pnl), 0);
    const winRate = (wins.length / trades.length) * 100;
    
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
    let currentStreak = 0;
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

    return {
      totalTrades: trades.length,
      winRate: winRate.toFixed(1),
      totalPnl: totalPnl.toFixed(2),
      avgPnl: (totalPnl / trades.length).toFixed(2),
      wins: wins.length,
      losses: losses.length,
      profitCurve,
      strategyPerformance,
      emotionalData,
      maxWinStreak,
      maxLossStreak,
      bestTrade: sortedByPnl[0],
      worstTrade: sortedByPnl[sortedByPnl.length - 1],
      winLossPie: [
        { name: 'Wins', value: wins.length },
        { name: 'Losses', value: losses.length }
      ]
    };
  }, [trades]);

  if (loading) return <div className="page-container loading">PROCESSING_DATA_STREAMS...</div>;
  if (!analyticsData) return <div className="page-container">No trade metadata found. Start logging to see analytics.</div>;

  return (
    <div className="page-container" style={{ maxWidth: '1200px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity className="text-primary" /> ADVANCED_ANALYTICS
        </h1>
        <p className="text-muted" style={{ fontSize: '0.8rem' }}>Strategic performance matrix and behavioral insights.</p>
      </header>

      {/* Overview Grid */}
      <div className="responsive-grid" style={{ marginBottom: '2rem' }}>
        <StatCard title="Total Volume" value={analyticsData.totalTrades} subtext="Trades Logged" icon={BarChart3} />
        <StatCard title="Win Rate" value={`${analyticsData.winRate}%`} subtext={`${analyticsData.wins} Wins / ${analyticsData.losses} Losses`} icon={Target} color="var(--secondary)" trend={analyticsData.winRate - 50} />
        <StatCard title="Net P&L" value={`$${analyticsData.totalPnl}`} subtext="Total Profit" icon={Zap} color={analyticsData.totalPnl >= 0 ? 'var(--success)' : 'var(--danger)'} trend={analyticsData.totalPnl} />
        <StatCard title="Avg Profit" value={`$${analyticsData.avgPnl}`} subtext="Per Session" icon={Activity} />
      </div>

      <div className="analytics-main-grid" style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Left Column: Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
          {/* Equity Curve */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2 className="panel-title" style={{ paddingLeft: 0, background: 'none', border: 'none' }}>Equity Curve Over Time</h2>
            <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.profitCurve}>
                  <defs>
                    <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis stroke="var(--text-muted)" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Area type="monotone" dataKey="pnl" stroke="var(--primary)" fill="url(#pnlGradient)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Strategy Performance */}
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

            {/* Emotional Impact */}
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
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Ratio: {analyticsData.wins} Wins vs {analyticsData.losses} Losses
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Key Metrics & Streaks */}
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
                        animate={{ width: `${Math.min(100, Math.abs(e.pnl / Number(analyticsData.totalPnl)) * 100)}%` }}
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
                <span className="text-success" style={{ fontWeight: 600 }}>+${analyticsData.bestTrade?.pnl}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Max Drawdown</span>
                <span className="text-danger" style={{ fontWeight: 600 }}>-${Math.abs(analyticsData.worstTrade?.pnl)}</span>
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
              {analyticsData.maxWinStreak > 3 ? "SYSTEM: Consecutive wins detected. Recommended: Tighten risk protocol to protect gains." : "SYSTEM: Analyzing behavior patterns... Maintain discipline in next execution."}
              <br/><br/>
              {analyticsData.emotionalData.find(e => e.name === 'fear' && e.pnl < 0) ? "ALERT: Negative PnL during FEAR sessions. Suggestion: Reduce position size." : "HUD: Psychology levels within stable range."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
