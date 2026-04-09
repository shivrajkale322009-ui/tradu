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

    // DYNAMIC CHRONO-INDEXING (v4.5)
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

  const fetchScreenshot = async (providedEntry) => {
    if (!twelveDataKey) {
      alert("PLEASE_CONFIGURE_API_KEY: Go to Profile > Visual Intelligence Settings.");
      return;
    }
    
    setIsFetchingScreenshot(true);
    try {
      const lotVal = parseFloat(trade.lots) || 0.01;
      let entryVal = providedEntry !== undefined ? parseFloat(providedEntry) : parseFloat(trade.entry);

      // Require manual entry price
      if (!entryVal || isNaN(entryVal)) {
        setIsFetchingScreenshot(false);
        setShowEntryModal(true);
        return;
      }

      // Normalize symbol for Twelve Data
      let symbol = trade.pair.replace('m', '').replace('PRO', '').replace('+', '').toUpperCase();
      if (!symbol.includes('/')) {
        if (symbol.endsWith('USD')) symbol = symbol.replace('USD', '/USD');
        else if (symbol.endsWith('USDT')) symbol = symbol.replace('USDT', '/USDT');
        else if (symbol.length === 6) symbol = `${symbol.slice(0,3)}/${symbol.slice(3)}`;
      }
      
      const interval = '15min';
      
      // Calculate UTC time based on stored local time and user's timezone
      const parseTimezoneToMinutes = (offset) => {
        if (!offset) return 0;
        const sign = offset.startsWith('-') ? -1 : 1;
        const [h, m] = offset.replace(/[+-]/, '').split(':').map(Number);
        return sign * (h * 60 + (m || 0));
      };
      
      // ✅ Step 1: Use strictly formatted date from state
      const rawDate = trade.date; 
      const rawTime = trade.time || "00:00";
      
      // ✅ Step 2: Combine
      const datetime = `${rawDate}T${rawTime}:00`;
      
      // 📝 Debug logs for verification
      console.log("Formatted Date:", rawDate);
      console.log("Datetime:", datetime);

      // ✅ Step 3: Validate AFTER
      const tradeLocalTime = new Date(datetime);

      if (isNaN(tradeLocalTime.getTime())) {
        console.error("Critical Date Error:", datetime);
        setIsFetchingScreenshot(false);
        alert("Invalid date or time format. System forced reload of trade data.");
        loadTrade();
        return;
      }

      const offsetMinutes = parseTimezoneToMinutes(userTimezone);
      const tradeUtcTime = new Date(tradeLocalTime.getTime() - offsetMinutes * 60000);
      
      // We request candles ± 10 hours (40 candles of 15m) around the entry UTC time
      const start = new Date(tradeUtcTime.getTime() - 40 * 15 * 60000).toISOString().replace('T', ' ').slice(0, 19);
      const end = new Date(tradeUtcTime.getTime() + 40 * 15 * 60000).toISOString().replace('T', ' ').slice(0, 19);
      
      const response = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&start_date=${start}&end_date=${end}&order=ASC&apikey=${twelveDataKey}`);
      const data = await response.json();
      
      if (data.status === 'error') throw new Error(data.message);
      if (!data.values || data.values.length === 0) throw new Error("NO_DATA_FOUND_FOR_SESSION_TIME");

      // Generate Canvas Chart
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');

      // Styles
      const darkBg = '#050a19';
      const gridColor = '#1a2035';
      const upColor = '#00f3ff';
      const downColor = '#ff3366';
      
      ctx.fillStyle = darkBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const margin = { top: 60, right: 80, bottom: 40, left: 20 };
      const chartW = canvas.width - margin.left - margin.right;
      const chartH = canvas.height - margin.top - margin.bottom;

      // Scaling
      const prices = data.values.flatMap(d => [parseFloat(d.high), parseFloat(d.low)]);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;
      const paddingTop = priceRange * 0.2;
      const paddingBottom = priceRange * 0.2;
      
      const getY = (p) => margin.top + chartH - ((p - (minPrice - paddingBottom)) / (priceRange + paddingTop + paddingBottom)) * chartH;
      const getX = (i) => margin.left + (i / (data.values.length - 1)) * chartW;

      // Draw Grid
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = margin.top + (i / 5) * chartH;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + chartW, y);
        ctx.stroke();
      }

      // Draw Candles
      const candleW = (chartW / data.values.length) * 0.7;
      data.values.forEach((d, i) => {
        const o = parseFloat(d.open);
        const h = parseFloat(d.high);
        const l = parseFloat(d.low);
        const c = parseFloat(d.close);
        const x = getX(i);
        
        ctx.strokeStyle = c >= o ? upColor : downColor;
        ctx.fillStyle = c >= o ? upColor : downColor;
        
        // Wick
        ctx.beginPath();
        ctx.moveTo(x, getY(h));
        ctx.lineTo(x, getY(l));
        ctx.stroke();
        
        // Body
        const top = getY(Math.max(o, c));
        const bottom = getY(Math.min(o, c));
        ctx.fillRect(x - candleW/2, top, candleW, Math.max(1, bottom-top));
      });

      // Trade Levels Logic
      const slPoints = 2 / lotVal;
      const isLong = (trade.type || 'long').toLowerCase() === 'long';
      const slPrice = isLong ? (entryVal - slPoints) : (entryVal + slPoints);
      const tpPrice = isLong ? (entryVal + slPoints * 2) : (entryVal - slPoints * 2);

      // Entry Marker
      const entryY = getY(entryVal);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#00f3ff';
      ctx.beginPath();
      ctx.moveTo(margin.left, entryY);
      ctx.lineTo(margin.left + chartW, entryY);
      ctx.stroke();
      
      // SL marker
      const slY = getY(slPrice);
      ctx.strokeStyle = '#ff3366';
      ctx.beginPath();
      ctx.moveTo(margin.left, slY);
      ctx.lineTo(margin.left + chartW, slY);
      ctx.stroke();

      // TP marker
      const tpY = getY(tpPrice);
      ctx.strokeStyle = '#00ff66';
      ctx.beginPath();
      ctx.moveTo(margin.left, tpY);
      ctx.lineTo(margin.left + chartW, tpY);
      ctx.stroke();

      ctx.setLineDash([]);
      
      // Legend
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText(`${trade.pair.toUpperCase()} | ENTRY: ${entryVal} | LOTS: ${lotVal}`, margin.left, 30);
      
      ctx.fillStyle = '#00f3ff'; ctx.fillText(`ENTRY: ${entryVal}`, margin.left + chartW + 5, entryY + 4);
      ctx.fillStyle = '#ff3366'; ctx.fillText(`SL: ${slPrice.toFixed(2)}`, margin.left + chartW + 5, slY + 4);
      ctx.fillStyle = '#00ff66'; ctx.fillText(`TP: ${tpPrice.toFixed(2)}`, margin.left + chartW + 5, tpY + 4);

      const screenshot = canvas.toDataURL('image/png');
      const updatedTrade = { ...trade, image: screenshot };
      await updateTrade(id, updatedTrade);
      setTrade(updatedTrade);
      alert("CHART_GENERATED: Tactical evidence stored in database.");
      
    } catch (err) {
      console.error(err);
      alert(`FETCH_FAILED: ${err.message}`);
    } finally {
      setIsFetchingScreenshot(false);
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
            </>
          )}
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
                    <label style={{ fontSize: '0.6rem' }}>Session Time</label>
                    <input type="time" className="input" value={trade.time} onChange={e => setTrade({...trade, time: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6rem' }}>Entry Price</label>
                    <input type="number" step="any" className="input" value={trade.entry} onChange={e => setTrade({...trade, entry: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6rem' }}>Position Size (Lots)</label>
                    <input type="number" step="0.01" className="input" value={trade.lots} onChange={e => setTrade({...trade, lots: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6rem' }}>Setup Grade (SQUALITY)</label>
                    <select className="input" value={trade.quality} onChange={e => setTrade({...trade, quality: e.target.value})}>
                      <option value="a1">A1</option>
                      <option value="b">B</option>
                      <option value="c">C</option>
                      <option value="d">D</option>
                    </select>
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
          {!isLocked && userRole !== 'viewer' && (
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
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            <ImageIcon size={48} style={{ opacity: 0.1 }} />
            <div style={{ fontSize: '0.8rem' }}>NO_VISUAL_EVIDENCE_LOGGED</div>
            {userRole !== 'viewer' && (
              <button 
                onClick={fetchScreenshot} 
                disabled={isFetchingScreenshot}
                className="btn-primary" 
                style={{ padding: '0.75rem 2rem', background: 'var(--primary)', color: '#000', fontSize: '0.8rem', fontWeight: 800 }}
              >
                {isFetchingScreenshot ? 'FETCHING_CANDLES...' : 'FETCH_SCREENSHOT'}
              </button>
            )}
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
      
      {/* Entry Price Modal */}
      <AnimatePresence>
        {showEntryModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(5, 10, 25, 0.85)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
              padding: '1rem'
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel"
              style={{ width: '100%', maxWidth: '400px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--primary)' }}
            >
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                  <Crosshair size={20} /> Entry Price Required
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Please provide the exact entry price for this session to generate tactical visual evidence.
                </p>
              </div>
              
              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block', color: 'var(--text-primary)' }}>Enter Entry Price</label>
                <input 
                  type="number" 
                  step="any"
                  autoFocus
                  className="input" 
                  placeholder="e.g. 68450.00" 
                  value={pendingEntryPrice}
                  onChange={e => setPendingEntryPrice(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = parseFloat(pendingEntryPrice);
                      if (!val || isNaN(val)) {
                        alert("Entry price must be numeric.");
                        return;
                      }
                      setShowEntryModal(false);
                      const updatedTrade = { ...trade, entry: val.toString() };
                      setTrade(updatedTrade);
                      updateTrade(id, updatedTrade);
                      fetchScreenshot(val.toString());
                    }
                  }}
                  style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', textAlign: 'center', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setShowEntryModal(false)}
                  className="btn-outline" 
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const val = parseFloat(pendingEntryPrice);
                    if (!val || isNaN(val)) {
                      alert("Entry price must be numeric and not empty.");
                      return;
                    }
                    setShowEntryModal(false);
                    const updatedTrade = { ...trade, entry: val.toString() };
                    setTrade(updatedTrade);
                    updateTrade(id, updatedTrade);
                    fetchScreenshot(val.toString());
                  }}
                  className="btn-primary" 
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  Generate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
