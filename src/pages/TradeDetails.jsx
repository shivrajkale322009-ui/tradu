import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTradeById, deleteTrade, updateTrade, getUserProfile, getTrades } from '../utils/db';
import { 
  ArrowLeft, Trash2, Calendar, TrendingUp, TrendingDown, 
  Crosshair, Target, Brain, Smile, Shield, Unlock, Save, 
  Image as ImageIcon, Plus, FileText, Camera, Edit3, Check, X,
  Activity, Info, Wallet, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

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

  const loadTrade = async (silent = false) => {
    if (!silent) setLoading(true);
    const data = await getTradeById(id);
    if (!data) {
      navigate('/');
      return;
    }
    setTrade(data);

    // DYNAMIC CHRONO-INDEXING (v4.5)
    // The session ID is calculated as the rank in the master chronological journal
    const journalID = data.journalId || data.userId;
    const allTrades = await getTrades(journalID);
    const sorted = [...allTrades].sort((a,b) => {
        const tA = new Date(`${a.date}T${a.time || '00:00'}Z`).getTime();
        const tB = new Date(`${b.date}T${b.time || '00:00'}Z`).getTime();
        return tA - tB;
    });
    const index = sorted.findIndex(t => t.id === id);
    setRank(index + 1);
    
    setLoading(false);
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      // 1. Instantly update UI state
      setIsLocked(true);
      
      // 2. Perform the database sync in the background
      await updateTrade(id, trade);
      
      // 3. Silent re-sync of rank ONLY if relevant fields changed
      // This prevents the "300+ trade fetch" lag
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
        setTrade({ ...trade, image: reader.result }); // Set as Base64 for updateTrade to handle
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
          {isLocked ? (
            <button 
              onClick={() => setIsLocked(false)} 
              className="btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Edit3 size={16} /> EDIT_SYSTEM
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={handleUpdate} 
                className="btn-primary" 
                disabled={isSaving}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
              >
                <Save size={16} /> {isSaving ? 'SYNCING...' : 'SAVE'}
              </button>
              <button 
                onClick={() => { setIsLocked(true); loadTrade(); }} 
                className="icon-btn" 
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <X size={18} />
              </button>
            </div>
          )}
          <button onClick={handleDelete} className="icon-btn tooltip-container text-danger">
            <Trash2 size={20} />
            <span className="tooltip">Delete</span>
          </button>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
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
                    {new Date(`${trade.date}T${trade.time || '00:00'}Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="badge" style={{ background: 'rgba(0, 240, 255, 0.05)', color: 'var(--primary)' }}>
                    {trade.strategy?.toUpperCase() || 'NO_STRATEGY'}
                  </span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>
                    LOTS: {trade.lots || '0.01'}
                  </span>
                </>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
                  <div>
                    <label style={{ fontSize: '0.6rem' }}>Position Type</label>
                    <select className="input" value={trade.type} onChange={e => setTrade({...trade, type: e.target.value})}>
                      <option value="long">LONG</option>
                      <option value="short">SHORT</option>
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
                    <label style={{ fontSize: '0.6rem' }}>Position Size (Lots)</label>
                    <input type="number" step="0.01" className="input" value={trade.lots} onChange={e => setTrade({...trade, lots: e.target.value})} />
                  </div>
                </div>
              )}
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
          </div>
        </div>
      </div>

      {/* Media Evidence Section */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={18} className="text-primary" /> Visual Intelligence
          </h3>
          {!isLocked && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', cursor: 'pointer', minWidth: '100px', justifyContent: 'center' }}>
                 <ImageIcon size={14} /> GALLERY
                 <input type="file" hidden accept="image/*" onChange={handleImageChange} />
              </label>
              <label className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', cursor: 'pointer', minWidth: '100px', justifyContent: 'center', background: 'var(--primary)', color: '#000', boxShadow: '0 0 10px var(--primary-glow)' }}>
                 <Camera size={14} /> CAMERA
                 <input type="file" hidden accept="image/*" capture="environment" onChange={handleImageChange} />
              </label>
            </div>
          )}
        </div>
        
        {trade.image ? (
          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', background: '#000' }}>
            <img src={trade.image} alt="Trade Evidence" style={{ width: '100%', display: 'block' }} />
          </div>
        ) : (
          <div style={{ 
            padding: '4rem', 
            textAlign: 'center', 
            background: 'rgba(255,255,255,0.01)', 
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)'
          }}>
            <ImageIcon size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
            <div style={{ fontSize: '0.8rem' }}>NO_VISUAL_EVIDENCE_LOGGED</div>
          </div>
        )}
      </div>

      {/* Notes / Lessons Section */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} className="text-secondary" /> Tactical Debriefing
        </h3>
        {isLocked ? (
          <div style={{ 
            fontSize: '0.9rem', 
            lineHeight: 1.6, 
            color: 'var(--text-primary)', 
            whiteSpace: 'pre-wrap',
            minHeight: '100px'
          }}>
            {trade.notes || "No tactical observations recorded for this session."}
          </div>
        ) : (
          <div>
            <textarea 
               className="input"
               placeholder="Enter tactical observations, psychology notes, or mistakes..."
               value={trade.notes || ""}
               onChange={e => setTrade({...trade, notes: e.target.value})}
               style={{ minHeight: '200px', resize: 'vertical', padding: '1rem', lineHeight: 1.6 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
