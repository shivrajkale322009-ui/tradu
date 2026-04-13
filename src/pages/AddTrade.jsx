import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveTrade, getUserProfile } from '../utils/db';
import { 
  ImagePlus, X, AlertCircle, ShieldCheck, Database, Cpu, Zap, Check, 
  ArrowRight, TrendingUp, TrendingDown, DollarSign, Clock, Shield, 
  Target, Info, Camera, Play, CheckCircle2, AlertTriangle, ListChecks,
  Activity, ArrowUpRight, Ban, Eye, MousePointer2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { soundEngine } from '../utils/SoundEngine';

const SaveHUD = ({ progress, status, tradeData }) => {
  const [typedText, setTypedText] = useState('');
  const [flickerVal, setFlickerVal] = useState('0');
  const processingRef = useRef(null);

  const sequences = [
    "BOOT_SEQUENCE: INITIALIZING...",
    "INITIALIZING_TRADE_CORE...",
    "SYNCING_MARKET_DATA...",
    "VALIDATING_ENTRY...",
    "EXECUTING_SAVE_PROTOCOL..."
  ];

  useEffect(() => {
    if (status === 'syncing') {
      soundEngine.playTap();
      setTimeout(() => soundEngine.playWhoosh(), 100);
      processingRef.current = soundEngine.playProcessing();

      let charIdx = 0;
      let seqIdx = 0;
      const typeInterval = setInterval(() => {
        if (seqIdx < sequences.length) {
          setTypedText(sequences[seqIdx].slice(0, charIdx + 1));
          charIdx++;
          if (charIdx >= sequences[seqIdx].length) {
            seqIdx++;
            charIdx = 0;
          }
        }
        setFlickerVal(Math.floor(Math.random() * 1000000).toString(16).toUpperCase());
      }, 50);

      return () => {
        clearInterval(typeInterval);
        if (processingRef.current) processingRef.current.stop();
      };
    } else if (status === 'success') {
      if (processingRef.current) processingRef.current.stop();
      soundEngine.playSuccess();
      setTypedText("TRADE STORED SUCCESSFULLY");
    }
  }, [status]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(5, 10, 25, 0.98)',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(20px)',
        padding: '2rem', textAlign: 'center',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundImage: 'radial-gradient(var(--primary-glow) 1px, transparent 1px)', 
        backgroundSize: '40px 40px', opacity: 0.1, pointerEvents: 'none' }} />
      
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'left', zIndex: 10 }}>
         <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: status === 'success' ? 'var(--success)' : 'var(--primary)', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>
            {typedText}<motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>_</motion.span>
         </div>
         
         <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '10px', borderRadius: '5px', overflow: 'hidden', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
            <motion.div 
               animate={{ width: `${progress}%` }}
               style={{ 
                  height: '100%', 
                  background: status === 'success' ? 'var(--success)' : 'linear-gradient(90deg, var(--primary), var(--secondary))', 
                  boxShadow: status === 'success' ? '0 0 20px var(--success-glow)' : '0 0 15px var(--primary-glow)' 
               }}
            />
         </div>

         {status === 'success' && (
           <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ marginTop: '2rem', textAlign: 'center' }}
           >
              <div className="badge bg-success" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
                 SESSION_DATA_ARCHIVED
              </div>
           </motion.div>
         )}
      </div>
    </motion.div>
  );
};

const ChecklistItem = ({ label, checked, onToggle }) => (
  <div className={`checklist-item ${checked ? 'checked' : ''}`} onClick={onToggle}>
    <div className="checklist-checkbox">
      {checked && <Check size={14} className="text-white" />}
    </div>
    <span className="checklist-text">{label}</span>
  </div>
);

const MistakeSelector = ({ selected, onToggle }) => {
  const mistakes = [
    { id: 'no_conf', label: 'No Confirmation' },
    { id: 'early', label: 'Early Entry' },
    { id: 'fomo', label: 'FOMO' },
    { id: 'overtrading', label: 'Overtrading' },
    { id: 'anti_trend', label: 'Against Trend' },
    { id: 'no_checklist', label: 'No Checklist' }
  ];

  return (
    <div className="mistake-grid">
      {mistakes.map(m => (
        <div 
          key={m.id} 
          className={`mistake-tag ${selected.includes(m.id) ? 'selected' : ''}`}
          onClick={() => onToggle(m.id)}
        >
          {m.label}
        </div>
      ))}
    </div>
  );
};

export default function AddTrade() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // App Logic State
  const [isPrepared, setIsPrepared] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [prepareStartTime, setPrepareStartTime] = useState(null);
  const [isMissedTrade, setIsMissedTrade] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    pair: 'BTC/USDT',
    type: 'long',
    pnl: '',
    entry: '',
    lots: '0.01',
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toISOString().slice(11, 16),
    strategy: '',
    emotion: 'neutral',
    quality: 'b', // Default to B
    notes: '',
    trend: 'range',
    reasonMissed: '' // For missed trades
  });

  const [checklist, setChecklist] = useState({
    sr: false,
    confirmation: false,
    liquidity: false,
    mtf: false
  });

  const [selectedMistakes, setSelectedMistakes] = useState([]);
  const [images, setImages] = useState({
    before: null,
    after: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('syncing');
  const [userRole, setUserRole] = useState('owner');
  const [strategies, setStrategies] = useState(['Breakout', 'Scalping', 'Momentum']);
  const [favouritePairs, setFavouritePairs] = useState(['BTC/USDT', 'ETH/USDT', 'SOL/USDT']);

  // Timer Effect
  useEffect(() => {
    let timer;
    if (isPrepared && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPrepared, countdown]);

  useEffect(() => {
    if (currentUser) {
      getUserProfile(currentUser.uid).then(profile => {
        if (profile) {
          if (profile.strategies && profile.strategies.length > 0) setStrategies(profile.strategies);
          if (profile.favouritePairs && profile.favouritePairs.length > 0) setFavouritePairs(profile.favouritePairs);
          if (profile.activeJournalRole) setUserRole(profile.activeJournalRole);
        }
      });
    }
  }, [currentUser]);

  const handleToggleChecklist = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleMistake = (id) => {
    setSelectedMistakes(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1200;
          let w = img.width;
          let h = img.height;
          if (w > h && w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; }
          else if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          setImages(prev => ({ ...prev, [type]: canvas.toDataURL('image/jpeg', 0.8) }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const startPrepare = () => {
    setIsPrepared(true);
    setCountdown(30);
    setPrepareStartTime(Date.now());
    soundEngine.playTap();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const checklistComplete = Object.values(checklist).every(v => v === true);
    if (!formData.quality && !isMissedTrade) {
        alert("Please select trade quality.");
        return;
    }

    setIsSubmitting(true);
    setSyncStatus('syncing');

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setSyncProgress(Math.min(currentProgress, 95));
    }, 50);

    try {
      const impulsive = (Date.now() - (prepareStartTime || 0)) < 30000;
      const finalQuality = !checklistComplete ? 'd' : formData.quality;
      
      const tradeToSave = {
        ...formData,
        checklist,
        mistakes: selectedMistakes,
        images,
        isImpulsive: impulsive,
        isMissed: isMissedTrade,
        pnl: Number(formData.pnl) || 0,
        quality: finalQuality,
        timestamp: Date.now()
      };

      await saveTrade(tradeToSave, currentUser.uid);

      clearInterval(interval);
      setSyncProgress(100);
      setSyncStatus('success');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      clearInterval(interval);
      setIsSubmitting(false);
      alert("Error: " + err.message);
    }
  };

  if (!currentUser) return <div className="page-container">Access Denied</div>;

  return (
    <div className="page-container" style={{ paddingBottom: '5rem' }}>
      <header className="header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>{isMissedTrade ? 'Log Missed Trade' : 'Live Trade Entry'}</h1>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Precision journal protocol active.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className={`btn-outline ${!isMissedTrade ? 'active' : ''}`}
            onClick={() => setIsMissedTrade(false)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderColor: !isMissedTrade ? 'var(--primary)' : '' }}
          >
            EXECUTED
          </button>
          <button 
            className={`btn-outline ${isMissedTrade ? 'active' : ''}`}
            onClick={() => setIsMissedTrade(true)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderColor: isMissedTrade ? 'var(--secondary)' : '' }}
          >
            MISSED
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="trade-form">
          <div className="compact-grid">
            {/* Left Column: Preparation & Checklist */}
            <div className="form-column">
              {!isMissedTrade && (
                <>
                  <div className="form-section-header"><ListChecks size={16}/> Pre-Trade Checklist</div>
                  {!isPrepared ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', borderStyle: 'dashed' }}>
                      <Shield size={32} className="text-muted" style={{ marginBottom: '1rem' }} />
                      <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>Impulse control active. Start preparation to unlock trade entry.</p>
                      <button type="button" className="btn-primary" style={{ width: '100%' }} onClick={startPrepare}>
                        <Clock size={18} /> PREPARE_TRADE (30s)
                      </button>
                    </div>
                  ) : countdown > 0 ? (
                    <div className="timer-hud">
                      <div className="timer-value">{countdown}s</div>
                      <div className="timer-label">Stabilizing Emotions...</div>
                    </div>
                  ) : (
                    <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(0, 243, 255, 0.05)', borderColor: 'var(--primary)', textAlign: 'center', marginBottom: '1.5rem' }}>
                      <CheckCircle2 size={24} className="text-secondary" style={{ marginBottom: '0.5rem' }} />
                      <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem' }}>STATUS: READY_FOR_EXECUTION</div>
                    </div>
                  )}

                  <div className="checklist-container">
                    <ChecklistItem label="S/R or Trendline marked" checked={checklist.sr} onToggle={() => handleToggleChecklist('sr')} />
                    <ChecklistItem label="Multiple timeframe analysis" checked={checklist.mtf} onToggle={() => handleToggleChecklist('mtf')} />
                    <ChecklistItem label="Is swing break?" checked={checklist.confirmation} onToggle={() => handleToggleChecklist('confirmation')} />
                    <ChecklistItem label="Any trap there?" checked={checklist.liquidity} onToggle={() => handleToggleChecklist('liquidity')} />
                  </div>

                  {!Object.values(checklist).every(v => v === true) && isPrepared && (
                    <div className="behavior-warning">
                      <AlertTriangle size={18} />
                      Checklist incomplete – High risk trade
                    </div>
                  )}
                </>
              )}

              <div className="form-section-header"><Camera size={16}/> Evidence Capture</div>
              <div className="compact-grid" style={{ gap: '0.75rem' }}>
                 <div className="image-upload-container">
                   <label className="image-upload-box" style={{ height: '100px', fontSize: '0.7rem' }}>
                     {images.before ? <img src={images.before} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><ImagePlus size={20}/> BEFORE_ENTRY</>}
                     <input type="file" onChange={(e) => handleImageChange(e, 'before')} className="hidden-input" accept="image/*" />
                   </label>
                 </div>
                 <div className="image-upload-container">
                   <label className="image-upload-box" style={{ height: '100px', fontSize: '0.7rem' }}>
                     {images.after ? <img src={images.after} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><Eye size={20}/> AFTER_RESULT</>}
                     <input type="file" onChange={(e) => handleImageChange(e, 'after')} className="hidden-input" accept="image/*" />
                   </label>
                 </div>
              </div>
            </div>

            {/* Right Column: Trade Details */}
            <div className="form-column">
              <div className="form-section-header"><Zap size={16}/> Execution Intel</div>
              
              <div className="compact-grid">
                <div className="form-group">
                  <label>Pair</label>
                  <select value={formData.pair} onChange={(e) => setFormData({...formData, pair: e.target.value})} className="input">
                    {favouritePairs.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Strategy</label>
                  <select value={formData.strategy} onChange={(e) => setFormData({...formData, strategy: e.target.value})} className="input">
                    {strategies.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="compact-grid">
                <div className="form-group">
                  <label>Trend</label>
                  <select value={formData.trend} onChange={(e) => setFormData({...formData, trend: e.target.value})} className="input">
                    <option value="up">UP TREND</option>
                    <option value="down">DOWN TREND</option>
                    <option value="range">RANGING</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="input">
                    <option value="long">LONG</option>
                    <option value="short">SHORT</option>
                  </select>
                </div>
              </div>

              <div className="form-group-row-responsive">
                <div className="form-group flex-1">
                  <label>Entry Price</label>
                  <input type="number" step="any" value={formData.entry} onChange={(e) => setFormData({...formData, entry: e.target.value})} className="input" />
                </div>
                <div className="form-group flex-1">
                  <label>Lots</label>
                  <input type="number" step="0.01" value={formData.lots} onChange={(e) => setFormData({...formData, lots: e.target.value})} className="input" />
                </div>
              </div>

              <div className="form-section-header"><Target size={16}/> Outcome Analytics</div>

              <div className="form-group">
                <label>PnL ($)</label>
                <input type="number" step="any" value={formData.pnl} onChange={(e) => setFormData({...formData, pnl: e.target.value})} className="input" placeholder="0.00" />
              </div>

              <div className="form-group">
                <label>Grade Trade</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                  {['a1', 'a', 'b', 'c'].map(q => (
                    <button
                      key={q} type="button" onClick={() => setFormData({...formData, quality: q})}
                      className="btn-outline"
                      style={{ 
                        fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
                        background: formData.quality === q ? 'var(--primary-glow)' : '',
                        borderColor: formData.quality === q ? 'var(--primary)' : '',
                        color: formData.quality === q ? 'var(--primary)' : ''
                      }}
                    >
                      {q === 'a1' ? 'A+' : q.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {isMissedTrade && (
                <div className="form-group">
                  <label>Reason Missed</label>
                  <select value={formData.reasonMissed} onChange={(e) => setFormData({...formData, reasonMissed: e.target.value})} className="input">
                    <option value="">-- SELECT REASON --</option>
                    <option value="not_noticed">DIDN'T NOTICE</option>
                    <option value="hesitation">HESITATION</option>
                    <option value="no_confidence">NO CONFIDENCE</option>
                    <option value="distraction">DISTRACTION</option>
                  </select>
                </div>
              )}

              {!isMissedTrade && (
                <>
                  <div className="form-section-header"><Ban size={16}/> Mistake Tracking</div>
                  <MistakeSelector selected={selectedMistakes} onToggle={handleToggleMistake} />
                </>
              )}

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label>Post-Trade Notes</label>
                <textarea 
                  value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                  className="input textarea" placeholder="Market behavior, feeling, lesson learned..." rows={3}
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || (isPrepared && countdown > 0)} 
                className="btn-primary" 
                style={{ width: '100%', marginTop: '1.5rem', height: '3.5rem', fontSize: '1rem' }}
              >
                {isSubmitting ? 'CHRONICLING...' : (countdown > 0 && isPrepared ? `WAITING... (${countdown}S)` : 'ARCHIVE_SESSION')}
              </button>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                {isPrepared && (Date.now() - prepareStartTime < 30000) && <div className="behavior-badge badge-impulsive"><Ban size={12}/> IMPULSIVE_ENTRY</div>}
                {!Object.values(checklist).every(v => v === true) && <div className="behavior-badge badge-low-quality"><AlertTriangle size={12}/> LOW_QUALITY_DATA</div>}
                {formData.quality === 'a1' && <div className="behavior-badge badge-a-plus"><Shield size={12}/> A+ SETUP</div>}
              </div>
            </div>
          </div>
        </form>

      <AnimatePresence>
        {isSubmitting && <SaveHUD progress={syncProgress} status={syncStatus} tradeData={formData} />}
      </AnimatePresence>
    </div>
  );
}
