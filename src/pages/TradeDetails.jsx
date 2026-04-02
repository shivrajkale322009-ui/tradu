import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTradeById, deleteTrade, updateTrade, getUserProfile } from '../utils/db';
import { ArrowLeft, Trash2, Calendar, TrendingUp, TrendingDown, Crosshair, Target, Brain, Smile, Shield, Unlock, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TradeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [strategies, setStrategies] = useState(['Breakout', 'Scalping', 'Trend Following', 'Range', 'Mean Reversion']);

  useEffect(() => {
    loadTrade();
    if (currentUser) {
      getUserProfile(currentUser.uid).then(profile => {
        if (profile?.strategies?.length > 0) {
          setStrategies(profile.strategies);
        }
      });
    }
  }, [id, currentUser]);

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      await updateTrade(id, trade);
      setIsLocked(true);
    } catch (error) {
      console.error("Update failed", error);
      alert("System error: Failed to sync data.");
    } finally {
      setIsSaving(false);
    }
  };

  const loadTrade = async () => {
    const data = await getTradeById(id);
    if (!data) {
      navigate('/');
      return;
    }
    setTrade(data);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this trade?")) {
      await deleteTrade(id);
      navigate('/');
    }
  };

  if (loading) return <div className="page-container loading">Loading...</div>;

  return (
    <div className="page-container">
      <header className="header flex-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="icon-btn tooltip-container">
            <ArrowLeft size={20} />
            <span className="tooltip">Back</span>
          </Link>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--primary)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: '0.2rem' }}>
              TRADE_SESSION: #{(trade.tradeNo || 1).toString().padStart(3, '0')}
            </div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Trade Details</h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setIsLocked(!isLocked)} 
            className={`btn-outline ${!isLocked ? 'glow-text-primary' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: !isLocked ? '1px solid var(--primary)' : '1px solid var(--border)' }}
          >
            {isLocked ? (
              <><Shield size={18} /> Lock View</>
            ) : (
              <><Unlock size={18} className="text-primary" /> Edit Active</>
            )}
          </button>
          {currentUser && trade.userId === currentUser.uid && !isLocked && (
            <button onClick={handleDelete} className="icon-btn text-danger">
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </header>
      
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <div className="details-header" style={{ paddingBottom: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ flex: 1 }}>
            {isLocked ? (
              <h2 className="pair-title" style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{trade.pair}</h2>
            ) : (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.7rem' }}>Asset Pair</label>
                <input 
                  className="input" 
                  value={trade.pair} 
                  onChange={(e) => setTrade({...trade, pair: e.target.value})}
                  style={{ fontSize: '1.2rem', fontWeight: 700 }}
                />
              </div>
            )}
            
            <div className="badges-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem' }}>
              {isLocked ? (
                <>
                <span className={`badge ${(trade.type || 'long') === 'long' ? 'bg-success' : 'bg-danger'}`}>
                  {(trade.type || 'long') === 'long' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {(trade.type || 'long').toUpperCase()}
                </span>
                <span className="badge bg-muted">
                  <Calendar size={14} />
                  {trade.date} {trade.time && `• ${trade.time}`}
                </span>
                {trade.strategy && (
                  <span className="badge" style={{ background: 'rgba(0, 240, 255, 0.05)', color: 'var(--primary)' }}>
                    <Target size={14} />
                    {trade.strategy.toUpperCase()}
                </span>
                )}
                {trade.quality && (
                  <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
                    Grade: <strong style={{ color: '#fff', marginLeft: '0.2rem' }}>{trade.quality.toUpperCase()}</strong>
                  </span>
                )}
                </>
              ) : (
                <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', width: '100%', marginBottom: '1rem' }}>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Type</label>
                    <select 
                      className="input" 
                      value={trade.type || 'long'} 
                      onChange={(e) => setTrade({...trade, type: e.target.value})}
                      style={{ padding: '0.4rem', marginTop: '0.2rem' }}
                    >
                      <option value="long">LONG</option>
                      <option value="short">SHORT</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Date</label>
                    <input 
                      type="date" 
                      className="input" 
                      value={trade.date} 
                      onChange={(e) => setTrade({...trade, date: e.target.value})}
                      style={{ padding: '0.4rem', marginTop: '0.2rem' }}
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', width: '100%' }}>
                  <div style={{ flex: 2, minWidth: '180px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Strategy</label>
                    <select 
                      className="input" 
                      value={trade.strategy || strategies[0]} 
                      onChange={(e) => setTrade({...trade, strategy: e.target.value})}
                      style={{ padding: '0.4rem', marginTop: '0.2rem' }}
                    >
                      {strategies.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Quality Grade</label>
                    <select 
                      className="input" 
                      value={trade.quality || 'a1'} 
                      onChange={(e) => setTrade({...trade, quality: e.target.value})}
                      style={{ padding: '0.4rem', marginTop: '0.2rem' }}
                    >
                      {['a1', 'b', 'c', 'd'].map(q => (
                        <option key={q} value={q}>{q.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
                </>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right', minWidth: '120px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PnL Performance</span>
            {isLocked ? (
              <div className={`pnl-value ${trade.pnl >= 0 ? 'profit' : 'loss'}`} style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                ${Number(trade.pnl).toFixed(2)}
              </div>
            ) : (
              <input 
                type="number" 
                className="input" 
                step="any"
                value={trade.pnl} 
                onChange={(e) => setTrade({...trade, pnl: e.target.value})}
                style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'right', marginTop: '0.5rem', color: trade.pnl >= 0 ? 'var(--success)' : 'var(--danger)' }}
              />
            )}
          </div>
        </div>



        {trade.notes && (
          <div className="notes-section" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Notes & Lessons</h3>
            <div className="notes-content" style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              padding: '1.25rem', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.5
            }}>
              {trade.notes}
            </div>
          </div>
        )}

        {trade.image && (
          <div className="chart-section" style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Chart Screenshot</h3>
            <img 
              src={trade.image} 
              alt="Trade Chart" 
              style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} 
            />
          </div>
        )}

        {!isLocked && (
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="btn-primary" 
              onClick={handleUpdate} 
              disabled={isSaving}
              style={{ minWidth: '160px' }}
            >
              {isSaving ? 'Syncing...' : <><Save size={18} /> Commit Changes</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
