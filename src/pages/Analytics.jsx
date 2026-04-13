import { useState, useEffect, useMemo } from 'react';
import { getTrades, getUserProfile } from '../utils/db';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ReferenceLine,
  ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

import { 
  TrendingUp, TrendingDown, Target, Zap, Clock, Brain, Wallet,
  BarChart3, PieChart as PieIcon, Activity, Flame, AlertTriangle, Info,
  Grid, Calendar, ChevronLeft, ChevronRight, Layers, Layout, ShieldCheck,
  CheckCircle2, AlertCircle, Coffee, Moon, Sun, Monitor, Ban, ListChecks, Star
} from 'lucide-react';

const COLORS = ['#00f3ff', '#ff3366', '#00ff66', '#8b5cf6', '#f59e0b'];

const StatCard = ({ title, value, subtext, icon: Icon, trend, color = 'var(--primary)' }) => (
  <div className="glass-panel stat-card-hover" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
      <div className="metric-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: `${color}15`, color: color }}>
        <Icon size={18} />
      </div>
    </div>
    <div className="metric-value" style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 800 }}>{value}</div>
    <div style={{ fontSize: '0.7rem', color: (trend >= 0 || trend === undefined) ? 'var(--success)' : 'var(--danger)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
      {trend !== undefined && (trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />)}
      {subtext}
    </div>
  </div>
);

export default function Analytics() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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
    const totalPnl = trades.reduce((acc, t) => acc + Number(t.pnl), 0);
    const winRate = (wins.length / (trades.length || 1)) * 100;

    // --- Behavioral & Quality Metrics ---
    const aPlusTrades = trades.filter(t => t.quality === 'a1');
    const bTrades = trades.filter(t => t.quality === 'b');
    const impulsiveTrades = trades.filter(t => t.isImpulsive);
    const fullChecklistTrades = trades.filter(t => t.checklist && Object.values(t.checklist).every(v => v === true));
    const incompleteChecklistTrades = trades.filter(t => !t.checklist || !Object.values(t.checklist).every(v => v === true));
    
    const aPlusWinRate = (aPlusTrades.filter(t => Number(t.pnl) > 0).length / (aPlusTrades.length || 1)) * 100;
    const aPlusProfit = aPlusTrades.reduce((acc, t) => acc + Number(t.pnl), 0);
    
    // Checklist Correlation
    const fullChecklistWinRate = (fullChecklistTrades.filter(t => Number(t.pnl) > 0).length / (fullChecklistTrades.length || 1)) * 100;
    const incompleteChecklistWinRate = (incompleteChecklistTrades.filter(t => Number(t.pnl) > 0).length / (incompleteChecklistTrades.length || 1)) * 100;

    // --- Mistake Analysis ---
    const mistakeCounts = {};
    const mistakePnlLoss = {};
    trades.forEach(t => {
      if (t.mistakes && Array.isArray(t.mistakes)) {
        t.mistakes.forEach(m => {
          mistakeCounts[m] = (mistakeCounts[m] || 0) + 1;
          if (Number(t.pnl) < 0) {
            mistakePnlLoss[m] = (mistakePnlLoss[m] || 0) + Math.abs(Number(t.pnl));
          }
        });
      }
    });

    // --- Missed Trades ---
    const missedTrades = trades.filter(t => t.isMissed);
    const missedAPlus = missedTrades.filter(t => t.quality === 'a1').length;

    // --- Time & Session Analysis ---
    const tradesByDate = {};
    trades.forEach(t => {
      const d = t.date;
      if (!tradesByDate[d]) tradesByDate[d] = { pnl: 0, count: 0 };
      if (!t.isMissed) {
        tradesByDate[d].pnl += Number(t.pnl);
        tradesByDate[d].count += 1;
      }
    });

    const tradingDays = Object.keys(tradesByDate).length;
    const avgTradesPerDay = trades.filter(t => !t.isMissed).length / (tradingDays || 1);
    
    const radarData = [
      { subject: 'Discipline', A: Math.min(100, (fullChecklistTrades.length / (trades.length || 1)) * 100), fullMark: 100 },
      { subject: 'Impulse', A: Math.max(0, 100 - (impulsiveTrades.length / (trades.length || 1)) * 100), fullMark: 100 },
      { subject: 'Precision', A: winRate, fullMark: 100 },
      { subject: 'A+ Focus', A: Math.min(100, (aPlusTrades.length / (trades.length || 1)) * 300), fullMark: 100 },
      { subject: 'Risk Control', A: 85, fullMark: 100 }
    ];

    return {
      totalTrades: trades.length,
      winRate,
      winCount: wins.length,
      lossCount: trades.length - wins.length,
      totalPnl,
      aPlusWinRate,
      aPlusProfit,
      fullChecklistWinRate,
      incompleteChecklistWinRate,
      impulsiveCount: impulsiveTrades.length,
      missedCount: missedTrades.length,
      missedAPlus,
      avgTradesPerDay,
      mistakeStats: Object.entries(mistakeCounts).map(([id, count]) => ({ id, name: id.replace('_', ' ').toUpperCase(), count, loss: mistakePnlLoss[id] || 0 })),
      checklistData: [
        { name: 'Full Checklist', winRate: fullChecklistWinRate, fill: 'var(--success)' },
        { name: 'Incomplete', winRate: incompleteChecklistWinRate, fill: 'var(--danger)' }
      ],
      qualityData: [
        { name: 'A+', count: aPlusTrades.length, pnl: aPlusProfit },
        { name: 'B', count: bTrades.length, pnl: bTrades.reduce((acc, t) => acc + Number(t.pnl), 0) },
        { name: 'Others', count: trades.length - aPlusTrades.length - bTrades.length, pnl: 0 }
      ],
      radarData,
      profitCurve: trades.filter(t => !t.isMissed).reduce((acc, t, idx) => {
          const prev = idx > 0 ? acc[idx-1].pnl : 0;
          acc.push({ date: t.date, pnl: prev + Number(t.pnl) });
          return acc;
      }, []),
      insights: [
        `Checklist Impact: Trading with a full checklist has a ${fullChecklistWinRate.toFixed(1)}% win rate vs ${incompleteChecklistWinRate.toFixed(1)}% without it.`,
        aPlusTrades.length > 0 ? `A+ setups generated $${aPlusProfit.toFixed(0)} in profit with ${aPlusWinRate.toFixed(0)}% accuracy.` : "No A+ setups recorded yet. Focus on quality preservation.",
        missedAPlus > 0 ? `Hesitation Alert: You missed ${missedAPlus} A+ setups. Trust your protocol.` : "Excellent execution: You captured all A+ setups identified.",
        impulsiveTrades.length > 0 ? `Behavioral Flaw: ${impulsiveTrades.length} trades were taken impulsively (< 30s prep).` : "Perfect discipline: No impulsive entries detected."
      ]
    };
  }, [trades]);

  if (loading) return <div className="page-container loading">ANALYZING_BEHAVIORAL_PATTERNS...</div>;
  if (!analyticsData) return <div className="page-container">No Data Available</div>;

  const TabButton = ({ id, label, icon: Icon }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`nav-item ${activeTab === id ? 'active' : ''}`}
      style={{ width: 'auto', padding: '0.6rem 1.25rem', fontSize: '0.7rem', gap: '0.5rem', borderRadius: '8px' }}
    >
      <Icon size={14} /> {label.toUpperCase()}
    </button>
  );

  return (
    <div className="page-container" style={{ maxWidth: '1400px' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }}>
        <div>
           <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem' }}>
             <Activity className="text-primary" /> COGNITIVE_ANALYSIS
           </h1>
           <p className="text-muted" style={{ fontSize: '0.8rem' }}>Strategic intelligence and behavioral discipline audit.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <TabButton id="overview" label="Overview" icon={Layout} />
          <TabButton id="behavior" label="Behavior" icon={Brain} />
          <TabButton id="quality" label="Strategy" icon={Target} />
        </div>
      </header>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <StatCard title="Win Rate" value={`${analyticsData.winRate.toFixed(1)}%`} subtext={`${analyticsData.winCount}W - ${analyticsData.lossCount}L`} icon={Target} color="var(--primary)" />
            <StatCard title="Total PnL" value={`$${analyticsData.totalPnl.toFixed(2)}`} subtext="Net Profit/Loss" icon={Wallet} color={analyticsData.totalPnl >= 0 ? 'var(--success)' : 'var(--danger)'} />
            <StatCard title="A+ Accuracy" value={`${analyticsData.aPlusWinRate.toFixed(1)}%`} subtext={`From ${analyticsData.totalTrades} sessions`} icon={Star} color="var(--secondary)" />
            <StatCard title="Missed Opps" value={analyticsData.missedCount} subtext={`${analyticsData.missedAPlus} were A+ Setups`} icon={Ban} color="var(--warning)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.8rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>EQUITY_GROWTH_PROTOCOL</h3>
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.profitCurve}>
                    <defs>
                      <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="pnl" stroke="var(--primary)" fill="url(#curveGradient)" strokeWidth={3} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
               <h3 style={{ fontSize: '0.8rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>BEHAVIORAL_RADAR</h3>
               <div style={{ height: '320px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analyticsData.radarData}>
                     <PolarGrid stroke="rgba(255,255,255,0.1)" />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                     <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                     <Radar name="Trader" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.5} />
                   </RadarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'behavior' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
             <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}><ListChecks size={16} /> CHECKLIST_IMPACT_ANALYSIS</h3>
                <div style={{ height: '250px' }}>
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.checklistData}>
                         <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                         <YAxis stroke="var(--text-muted)" fontSize={10} domain={[0, 100]} />
                         <Tooltip contentStyle={{ background: 'var(--surface)' }} />
                         <Bar dataKey="winRate" name="Win Rate %" radius={[6, 6, 0, 0]} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                   Internal Audit: Completion of the pre-trade checklist correlates to a <strong>{((analyticsData.fullChecklistWinRate || 0) - (analyticsData.incompleteChecklistWinRate || 0)).toFixed(1)}%</strong> improvement in success probability.
                </div>
             </div>

             <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}><AlertTriangle size={16} /> ERROR_DISTRIBUTION (MISTAKES)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   {analyticsData.mistakeStats.sort((a,b) => b.count - a.count).map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                         <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                               <span>{m.name}</span>
                               <span className="text-danger">-${m.loss.toFixed(0)}</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                               <div style={{ height: '100%', width: `${(m.count / analyticsData.totalTrades) * 100}%`, background: 'var(--danger)' }} />
                            </div>
                         </div>
                         <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{m.count}</div>
                      </div>
                   ))}
                   {analyticsData.mistakeStats.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '10px' }}>No systematic errors detected.</div>}
                </div>
             </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
             <h3 style={{ fontSize: '0.8rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>SMART_DISCIPLINE_INSIGHTS</h3>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {analyticsData.insights.map((msg, i) => (
                   <div key={i} className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', display: 'flex', gap: '0.75rem' }}>
                      <div style={{ color: 'var(--primary)', flexShrink: 0 }}>[#{i+1}]</div>
                      <div>{msg}</div>
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'quality' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}><Star size={16} className="text-secondary" /> A+ PROTOCOL PERFORMANCE</h3>
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                   <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--secondary)' }}>{analyticsData.aPlusWinRate.toFixed(1)}%</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>WIN RATE ON HIGH-QUALITY SETUPS</div>
                   <div className="badge bg-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
                      TOTAL PROFIT: +${analyticsData.aPlusProfit.toFixed(2)}
                   </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                 <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>GRADE_DISTRIBUTION</h3>
                 <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={analyticsData.qualityData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count">
                             {analyticsData.qualityData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .badge-missed { background: rgba(255, 171, 0, 0.1); color: var(--warning); border: 1px solid var(--warning); }
        .text-success { color: var(--success); }
        .text-danger { color: var(--danger); }
      `}</style>
    </div>
  );
}
