import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTradeById, deleteTrade, updateTrade, getUserProfile, getTrades } from '../utils/db';
import { 
  ArrowLeft, Trash2, Calendar, TrendingUp, TrendingDown, 
  Crosshair, Target, Brain, Shield, Edit3, Check, X,
  Activity, Info, Camera, Image as ImageIcon, CheckCircle2, AlertTriangle, Ban, FileText, ArrowRight, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';


const formatDate = (rawDate) => {
  if (!rawDate) return "";
  if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
    const [day, month, year] = rawDate.split("-");
    return `${year}-${month}-${day}`;
  }
  return rawDate;
};

export default function TradeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [rank, setRank] = useState(0);
  const [strategies, setStrategies] = useState(['Breakout', 'Scalping', 'Trend Following', 'Range', 'Mean Reversion']);
  const [isFetchingScreenshot, setIsFetchingScreenshot] = useState(false);
  const [twelveDataKey, setTwelveDataKey] = useState('');
  const [userTimezone, setUserTimezone] = useState('+00:00');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [pendingEntryPrice, setPendingEntryPrice] = useState('');
  const [userRole, setUserRole] = useState('viewer');

  useEffect(() => {
    loadTrade();
    if (currentUser) {
      getUserProfile(currentUser.uid).then(profile => {
        if (profile?.strategies?.length > 0) {
          setStrategies(profile.strategies);
        }
        if (profile?.twelveDataKey) {
          setTwelveDataKey(profile.twelveDataKey);
        }
        if (profile?.timezone) {
          setUserTimezone(profile.timezone);
        }
        if (profile?.activeJournalRole) {
          setUserRole(profile.activeJournalRole);
        }
      });
    }
  }, [id, currentUser]);

  const loadTrade = async (silent = false) => {
    if (!silent) setLoading(true);
    const data = await getTradeById(id);
    if (!data) {
      navigate('/');
      return;
    }

    const formattedData = {
      ...data,
      date: formatDate(data.date),
      time: data.time || "00:00"
    };

    setTrade(formattedData);

    const journalID = data.journalId || data.userId;
    const allTrades = await getTrades(journalID);
    const sorted = [...allTrades].sort((a,b) => {
        const dateA = formatDate(a.date);
        const dateB = formatDate(b.date);
        const tA = new Date(`${dateA}T${a.time || '00:00'}Z`).getTime();
        const tB = new Date(`${dateB}T${b.time || '00:00'}Z`).getTime();
        return tA - tB;
    });
    const index = sorted.findIndex(t => t.id === id);
    setRank(index + 1);
    
    setLoading(false);
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      setIsLocked(true);
      await updateTrade(id, trade);
      loadTrade(true).catch(e => console.error("Background sync error", e));
    } catch (error) {
      console.error("Update failed", error);
      alert("System error: Failed to sync data.");
      setIsLocked(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this trade?")) {
      await deleteTrade(id);
      navigate('/');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTrade({ ...trade, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="page-container loading">CYBER_FETCHING_SESSION...</div>;
  if (!trade) return null;

  return (
    <div className="page-container" style={{ paddingBottom: '4rem' }}>
      <header className="header flex-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="icon-btn tooltip-container">
            <ArrowLeft size={20} />
            <span className="tooltip">Back</span>
          </Link>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--primary)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: '0.2rem' }}>
              TRADE_SESSION: #{rank.toString().padStart(3, '0')}
            </div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Tactical Briefing</h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {userRole !== 'viewer' && (
            <>
              {isLocked ? (
                <button onClick={() => setIsLocked(false)} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Edit3 size={16} /> EDIT_SYSTEM
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleUpdate} className="btn-primary" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                    <Save size={16} /> {isSaving ? 'SYNCING...' : 'SAVE'}
                  </button>
                  <button onClick={() => { setIsLocked(true); loadTrade(); }} className="icon-btn" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <X size={18} />
                  </button>
                </div>
              )}
              <button onClick={handleDelete} className="icon-btn tooltip-container text-danger">
                <Trash2 size={20} />
                <span className="tooltip">Delete</span>
              </button>
            </>
          )}
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            {trade.isMissed && (
              <div className="badge bg-warning" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 171, 0, 0.15)', color: '#ffab00' }}>
                <Ban size={12} /> MISSED_OPPORTUNITY
              </div>
            )}
            
            {isLocked ? (
              <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 800 }}>{trade.pair}</h2>
            ) : (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Asset Pair</label>
                <input 
                  className="input" 
                  value={trade.pair} 
                  onChange={(e) => setTrade({...trade, pair: e.target.value})}
                  style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase' }}
                />
              </div>
            )}
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
              {isLocked ? (
                <>
                  <span className={`badge ${(trade.type || 'long') === 'long' ? 'bg-success' : 'bg-danger'}`}>
                    {(trade.type || 'long').toUpperCase()}
                  </span>
                  <span className="badge bg-muted">
                    <Calendar size={14} />
                    {new Date(`${trade.date}T${trade.time || '00:00'}Z`).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}
                  </span>
                  <span className="badge" style={{ background: 'rgba(0, 240, 255, 0.05)', color: 'var(--primary)' }}>
                    ENTRY: {trade.entry || '---'}
                  </span>
                  <span className="badge" style={{ background: 'rgba(0, 240, 255, 0.05)', color: 'var(--secondary)' }}>
                    {trade.strategy?.toUpperCase() || 'NO_STRATEGY'}
                  </span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>
                    LOTS: {trade.lots || '0.01'}
                  </span>
                  <span className="badge" style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--primary)', fontWeight: 800 }}>
                    GRADE: {(trade.quality || 'B').toUpperCase()}
                  </span>
                  {trade.trend && (
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                      {trade.trend === 'up' ? <TrendingUp size={12}/> : trade.trend === 'down' ? <TrendingDown size={12}/> : <ArrowRight size={12}/>}
                      {trade.trend.toUpperCase()}
                    </span>
                  )}
                  {trade.rrAchieved && (
                    <span className="badge" style={{ background: 'rgba(0, 255, 102, 0.1)', color: 'var(--secondary)' }}>
                      RR: 1:{trade.rrAchieved}
                    </span>
                  )}
                </>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', width: '100%' }}>
                  <div>
                    <label style={{ fontSize: '0.6rem' }}>Position Type</label>
                    <select className="input" value={trade.type} onChange={e => setTrade({...trade, type: e.target.value})}>
                      <option value="long">LONG</option>
                      <option value="short">SHORT</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6rem' }}>Trend Context</label>
                    <select className="input" value={trade.trend} onChange={e => setTrade({...trade, trend: e.target.value})}>
                      <option value="up">UP TREND</option>
                      <option value="down">DOWN TREND</option>
                      <option value="range">RANGING</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6rem' }}>Execution Strategy</label>
                    <select className="input" value={trade.strategy} onChange={e => setTrade({...trade, strategy: e.target.value})}>
                      {strategies.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6rem' }}>Session Date</label>
                    <input type="date" className="input" value={trade.date} onChange={e => setTrade({...trade, date: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6rem' }}>Entry Price</label>
                    <input type="number" step="any" className="input" value={trade.entry} onChange={e => setTrade({...trade, entry: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6rem' }}>RR Achieved</label>
                    <input type="number" step="0.1" className="input" value={trade.rrAchieved} onChange={e => setTrade({...trade, rrAchieved: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6rem' }}>Setup Grade</label>
                    <select className="input" value={trade.quality} onChange={e => setTrade({...trade, quality: e.target.value})}>
                      <option value="a1">A+</option>
                      <option value="a">A</option>
                      <option value="b">B</option>
                      <option value="c">C</option>
                      <option value="d">D</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
               {trade.isImpulsive && <div className="behavior-badge badge-impulsive"><Ban size={10}/> IMPULSIVE</div>}
               {trade.quality === 'd' && <div className="behavior-badge badge-low-quality"><AlertTriangle size={10}/> LOW_QUALITY</div>}
               {trade.quality === 'a1' && <div className="behavior-badge badge-a-plus"><ShieldCheck size={10}/> A+_PROTOCOL</div>}
            </div>
          </div>

          <div style={{ textAlign: 'right', minWidth: '150px' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PnL Performance</span>
            {isLocked ? (
              <div className={`pnl-value ${Number(trade.pnl) >= 0 ? 'profit' : 'loss'}`} style={{ fontSize: '2.5rem', fontWeight: 900 }}>
                {Number(trade.pnl) >= 0 ? '+' : ''}${Math.abs(Number(trade.pnl)).toFixed(2)}
              </div>
            ) : (
              <div style={{ marginTop: '0.5rem' }}>
                <input 
                  type="number" 
                  step="0.01"
                  className="input" 
                  value={trade.pnl} 
                  onChange={(e) => setTrade({...trade, pnl: e.target.value})}
                  style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'right', color: Number(trade.pnl) >= 0 ? 'var(--success)' : 'var(--danger)' }}
                />
              </div>
            )}
            {trade.isMissed && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Opportunity Missed: {trade.reasonMissed?.replace('_', ' ').toUpperCase()}</div>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
           <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Shield size={18} className="text-secondary" /> Validation Matrix
           </h3>
           <div style={{ display: 'grid', gap: '0.75rem' }}>
             {[
               { k: 'sr', l: 'Support/Resistance Marked' },
               { k: 'trend', l: 'Trend Context Confirmed' },
               { k: 'confirmation', l: 'Entry Confirmation Signal' },
               { k: 'liquidity', l: 'Liquidity Sweep identified' },
               { k: 'rr', l: 'Reward/Risk ratio valid (1:2)' }
             ].map(i => (
               <div key={i.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                 <div style={{ fontSize: '0.8rem', color: trade.checklist?.[i.k] ? 'var(--text-primary)' : 'var(--text-muted)' }}>{i.l}</div>
                 {trade.checklist?.[i.k] ? (
                   <CheckCircle2 size={16} className="text-success" />
                 ) : (
                   <div style={{ height: '6px', width: '6px', borderRadius: '50%', background: 'var(--danger)', opacity: 0.5 }} />
                 )}
               </div>
             ))}
           </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
           <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Brain size={18} className="text-danger" /> Behavioral Errors
           </h3>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
             {trade.mistakes?.length > 0 ? trade.mistakes.map(m => (
               <div key={m} style={{ padding: '0.6rem 1rem', background: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.3)', borderRadius: '6px', fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 700 }}>
                 {m.replace('_', ' ').toUpperCase()}
               </div>
             )) : (
               <div style={{ width: '100%', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                 <CheckCircle2 size={32} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                 NO_ERRORS_DETECTED
               </div>
             )}
           </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={18} className="text-primary" /> Multi-Phase Evidence
          </h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
           <div className="evidence-slot">
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.1rem', fontWeight: 800 }}>T-0: BEFORE_ENTRY</div>
              {trade.images?.before || trade.image ? (
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', background: '#000' }}>
                  <img src={trade.images?.before || trade.image} alt="Before" style={{ width: '100%', display: 'block' }} />
                </div>
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '8px', opacity: 0.3, fontSize: '0.7rem' }}>DATA_PENDING</div>
              )}
           </div>
           <div className="evidence-slot">
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.1rem', fontWeight: 800 }}>T-FINAL: AFTER_RESULT</div>
              {trade.images?.after ? (
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', background: '#000' }}>
                  <img src={trade.images?.after} alt="After" style={{ width: '100%', display: 'block' }} />
                </div>
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '8px', opacity: 0.3, fontSize: '0.7rem' }}>DATA_PENDING</div>
              )}
           </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} className="text-secondary" /> Tactical Debriefing
        </h3>
        {isLocked ? (
          <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', minHeight: '100px' }}>
            {trade.notes || "No tactical observations recorded for this session."}
          </div>
        ) : (
          <textarea 
             className="input"
             placeholder="Enter tactical observations..."
             value={trade.notes || ""}
             onChange={e => setTrade({...trade, notes: e.target.value})}
             style={{ minHeight: '200px', resize: 'vertical', padding: '1rem' }}
          />
        )}
      </div>
    </div>
  );
}
