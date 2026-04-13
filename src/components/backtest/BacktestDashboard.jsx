import { useMemo } from 'react';

import { 
  TrendingUp, TrendingDown, Target, Wallet, 
  BarChart3, Activity, AlertTriangle, Zap 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';

const StatCard = ({ title, value, subtext, icon: Icon, color = 'var(--primary)' }) => (
  <div 
    className="glass-panel stat-card-hover" 
    style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>{title.toUpperCase()}</div>
      <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: `${color}15`, color: color }}>
        <Icon size={18} />
      </div>
    </div>
    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{value}</div>
    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{subtext}</div>
  </div>
);

export default function BacktestDashboard({ backtest, trades }) {
  const stats = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    const wins = trades.filter(t => Number(t.pnl) > 0);
    const losses = trades.filter(t => Number(t.pnl) < 0);
    const totalPnl = trades.reduce((acc, t) => acc + Number(t.pnl), 0);
    const winRate = (wins.length / trades.length) * 100;
    
    // Calculate max drawdown
    let peak = backtest.initialCapital;
    let currentEquity = backtest.initialCapital;
    let maxDD = 0;
    
    const equityCurve = trades.map((t, idx) => {
      currentEquity += Number(t.pnl);
      if (currentEquity > peak) peak = currentEquity;
      const dd = peak - currentEquity;
      if (dd > maxDD) maxDD = dd;
      return { trade: idx + 1, equity: currentEquity };
    });

    // Profit Factor
    const totalWins = wins.reduce((acc, t) => acc + Number(t.pnl), 0);
    const totalLosses = Math.abs(losses.reduce((acc, t) => acc + Number(t.pnl), 0));
    const profitFactor = totalLosses === 0 ? totalWins : totalWins / totalLosses;

    // Risk Reward
    const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
    const rr = avgLoss === 0 ? 0 : avgWin / avgLoss;

    // Monthly Performance
    const monthlyMap = {};
    trades.forEach(t => {
        const date = new Date(t.entryTime);
        const month = date.toLocaleString('default', { month: 'short' });
        if (!monthlyMap[month]) monthlyMap[month] = 0;
        monthlyMap[month] += Number(t.pnl);
    });
    const monthlyPerformance = Object.entries(monthlyMap).map(([name, pnl]) => ({ name, pnl }));

    const drawdownCurve = trades.map((t, idx) => {
        const equity = equityCurve[idx].equity; // using the locally defined equityCurve
        if (equity > peak) peak = equity;
        return { trade: idx + 1, drawdown: peak - equity };
    });

    return {
      totalTrades: trades.length,
      winRate: winRate.toFixed(1) + '%',
      netPnl: (totalPnl >= 0 ? '+' : '') + '$' + totalPnl.toFixed(2),
      rr: rr.toFixed(2),
      maxDrawdown: '$' + maxDD.toFixed(2),
      profitFactor: profitFactor.toFixed(2),
      equityCurve: [{ trade: 0, equity: backtest.initialCapital }, ...equityCurve],
      drawdownCurve,
      monthlyPerformance,
      winLossData: [
        { name: 'Wins', value: wins.length },
        { name: 'Losses', value: losses.length }
      ]
    };
  }, [trades, backtest]);

  if (!stats) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Activity size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
        <p>Awaiting trade execution data to generate analytics...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard title="Total Trades" value={stats.totalTrades} subtext="Executed Units" icon={BarChart3} />
        <StatCard title="Win Rate" value={stats.winRate} subtext="Accuracy Target" icon={Target} color="var(--success)" />
        <StatCard title="Net PnL" value={stats.netPnl} subtext="Tactical Yield" icon={Wallet} color={Number(stats.netPnl.replace('$','').replace('+','')) >= 0 ? 'var(--primary)' : 'var(--danger)'} />
        <StatCard title="Risk-Reward" value={stats.rr} subtext="Efficiency Ratio" icon={Zap} color="var(--secondary)" />
        <StatCard title="Max Drawdown" value={stats.maxDrawdown} subtext="Risk Exposure" icon={AlertTriangle} color="var(--danger)" />
        <StatCard title="Profit Factor" value={stats.profitFactor} subtext="Yield Intensity" icon={TrendingUp} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.85rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>EQUITY_CURVE_VISUALIZATION</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.equityCurve}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="trade" stroke="rgba(255,255,255,0.1)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.1)" fontSize={10} tickFormatter={v => `$${v}`} />
                <Tooltip 
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--primary)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="var(--primary)" 
                  fill="url(#equityGradient)" 
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.85rem', marginBottom: '1.5rem', alignSelf: 'flex-start', color: 'var(--text-muted)' }}>WIN_LOSS_DISTRIBUTION</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.winLossData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="var(--success)" />
                  <Cell fill="var(--danger)" />
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.85rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>MONTHLY_YIELD_MATRIX</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyPerformance}>
                <XAxis dataKey="name" stroke="rgba(150,150,150,0.5)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {stats.monthlyPerformance.map((entry, index) => (
                    <Cell key={index} fill={entry.pnl >= 0 ? 'var(--success)' : 'var(--danger)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.85rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>DRAWDOWN_EXPOSURE</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.drawdownCurve}>
                <XAxis dataKey="trade" hide />
                <YAxis reversed hide />
                <Tooltip 
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                />
                <Area type="monotone" dataKey="drawdown" stroke="var(--danger)" fill="var(--danger)" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
