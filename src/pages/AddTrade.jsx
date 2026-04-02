import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveTrade, getUserProfile } from '../utils/db';
import { ImagePlus, X, AlertCircle, ShieldCheck, Database, Cpu, Zap, Check, ArrowRight, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { soundEngine } from '../utils/SoundEngine';

const SaveHUD = ({ progress, status, tradeData }) => {
  const [typedText, setTypedText] = useState('');
  const [flickerVal, setFlickerVal] = useState('0');
  const hudControls = useAnimation();
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

      // Typing effect
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
        background: 'rgba(5, 10, 25, 0.95)',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(15px)',
        padding: '2rem', textAlign: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Background HUD Grid */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundImage: 'radial-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px)', 
        backgroundSize: '30px 30px', opacity: 0.2, pointerEvents: 'none' }} />
      
      {/* Scanning Line */}
      {status === 'syncing' && (
        <motion.div 
          animate={{ y: ['0%', '100%'] }} 
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'var(--primary)', opacity: 0.1, boxShadow: '0 0 10px var(--primary-glow)', zIndex: 1 }}
        />
      )}

      {/* Main HUD Module */}
      <motion.div animate={hudControls} style={{ position: 'relative', marginBottom: '2.5rem', zIndex: 10 }}>
        {/* Outer hud ring */}
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'relative', width: '200px', height: '200px' }}
        >
          {/* Outer dashed ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ 
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              border: `1px dashed ${status === 'success' ? 'var(--success)' : 'var(--primary)'}`, 
              borderRadius: '50%',
              opacity: 0.4
            }}
          />
          
          {/* Inner solid ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{ 
              position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px',
              border: `2px solid ${status === 'success' ? 'var(--success)' : 'rgba(0, 240, 255, 0.2)'}`, 
              borderRadius: '50%',
              boxShadow: status === 'success' ? '0 0 30px var(--success-glow)' : '0 0 15px var(--primary-glow)'
            }}
          />

          {/* Radar Sweep */}
          {status !== 'success' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'conic-gradient(from 0deg, var(--primary) 0deg, transparent 60deg)', borderRadius: '50%', opacity: 0.1 }}
            />
          )}

          {/* Center Content */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div 
                  key="check" 
                  initial={{ scale: 0, rotate: -45 }} 
                  animate={{ scale: 1.2, rotate: 0 }} 
                  transition={{ type: 'spring' }}
                >
                  <Check size={70} className="text-success" style={{ filter: 'drop-shadow(0 0 15px var(--success-glow))' }} />
                </motion.div>
              ) : (
                <motion.div 
                   key="core" 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }}
                   style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                   <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                     <Cpu size={60} className="text-primary" />
                   </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Orbital Data Particles */}
          {status !== 'success' && [...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ rotate: 360 }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: "linear" }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            >
              <div style={{ 
                width: '4px', height: '4px', background: 'var(--primary)', 
                borderRadius: '50%', position: 'absolute', top: '-2px', left: '50%',
                boxShadow: '0 0 8px var(--primary)'
              }} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Boot Text & Progress */}
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'left' }}>
         <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: status === 'success' ? 'var(--success)' : 'var(--primary)', marginBottom: '1rem', minHeight: '1.2rem', letterSpacing: '0.05em' }}>
            {typedText}<motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>_</motion.span>
         </div>
         
         <div style={{ width: '100%', background: 'rgba(0, 240, 255, 0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.5rem', position: 'relative', border: '1px solid rgba(0, 240, 255, 0.1)' }}>
            <motion.div 
               animate={{ width: `${progress}%` }}
               style={{ 
                  height: '100%', 
                  background: status === 'success' ? 'var(--success)' : 'linear-gradient(90deg, var(--primary), var(--secondary))', 
                  boxShadow: status === 'success' ? '0 0 20px var(--success-glow)' : '0 0 15px var(--primary-glow)' 
               }}
            >
               {/* Moving highlight streak */}
               <motion.div 
                  animate={{ x: ['-100%', '400%'] }} 
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
               />
            </motion.div>
         </div>

         {status === 'success' && tradeData && (
           <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
           >
              <div className="badge bg-success" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 600, boxShadow: '0 0 15px var(--success-glow)' }}>
                 +${Number(tradeData.pnl).toFixed(2)} SECURED
              </div>
           </motion.div>
         )}
      </div>

      {/* Terminal Metadata Footer */}
      <div style={{ position: 'absolute', bottom: '2rem', display: 'flex', gap: '3rem', opacity: 0.4, fontFamily: 'monospace', fontSize: '0.6rem' }}>
         <div>PROTOCOL: SAVE_TRADU_v1</div>
         <div>SECURITY: AES_256</div>
         <div>HASH: {flickerVal}</div>
      </div>
    </motion.div>
  );
};

export default function AddTrade() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pair: 'BTC/USDT',
    type: 'long',
    pnl: '',
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    strategy: '',
    emotion: 'neutral',
    notes: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [favouritePairs, setFavouritePairs] = useState(['BTC/USDT', 'ETH/USDT', 'SOL/USDT']);
  const [strategies, setStrategies] = useState(['Breakout', 'Scalping', 'Momentum']);
  const [isCustomPair, setIsCustomPair] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('syncing');

  useEffect(() => {
    if (currentUser) {
      getUserProfile(currentUser.uid).then(profile => {
        if (profile) {
          if (profile.favouritePairs && profile.favouritePairs.length > 0) {
            setFavouritePairs(profile.favouritePairs);
            if (formData.pair === 'BTC/USDT' || !formData.pair) {
              setFormData(prev => ({ ...prev, pair: profile.favouritePairs[0] }));
            }
          }
          if (profile.strategies && profile.strategies.length > 0) {
            setStrategies(profile.strategies);
            setFormData(prev => ({ ...prev, strategy: profile.strategies[0] }));
          }
        }
      });
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="page-container empty-state" style={{marginTop: '2rem'}}>
        <AlertCircle size={40} style={{marginBottom: '1rem', color: 'var(--danger)'}} />
        <h2>Authentication Required</h2>
        <p>You must be signed in to add new trades.</p>
        <button onClick={() => navigate('/')} className="btn-primary" style={{marginTop: '1rem'}}>Go Home</button>
      </div>
    );
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Set a max dimension (e.g. 1024px) for trading screenshots
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Get compressed base64 (jpeg is smaller than png)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImagePreview(dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pairSelect') {
      if (value === 'CUSTOM') {
        setIsCustomPair(true);
        setFormData(prev => ({ ...prev, pair: '' }));
      } else {
        setIsCustomPair(false);
        setFormData(prev => ({ ...prev, pair: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEmotionSelect = (emotionValue) => {
    setFormData(prev => ({ ...prev, emotion: emotionValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pair || !formData.pnl) {
      alert('Pair and PnL are required!');
      return;
    }
    
    setIsSubmitting(true);
    setSyncStatus('syncing');
    
    // Start progress simulation
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 90) return prev; // Hold at 90 until done
        return prev + 5;
      });
    }, 150);

    try {
      await saveTrade({
        ...formData,
        pnl: Number(formData.pnl),
        image: imagePreview
      }, currentUser.uid);

      clearInterval(interval);
      setSyncProgress(100);
      setSyncStatus('success');
      
      // Hold success screen for 1.5 seconds so they can see the effect
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      clearInterval(interval);
      setIsSubmitting(false);
      console.error(error);
      alert('Could not save trade: ' + error.message);
    }
  };

  return (
    <div className="page-container">
      <header className="header" style={{ marginBottom: '1.5rem' }}>
        <h1>Log New Trade</h1>
      </header>
      
      <form onSubmit={handleSubmit} className="trade-form">
        <div className="form-group">
          <label>Pair/Ticker</label>
          {!isCustomPair ? (
            <select
              name="pairSelect"
              value={formData.pair}
              onChange={handleChange}
              className="input"
              required
            >
              {favouritePairs.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="CUSTOM">+ Custom Pair...</option>
            </select>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                name="pair"
                value={formData.pair}
                onChange={handleChange}
                placeholder="e.g. BTC/USDT"
                className="input"
                required
                autoComplete="off"
                style={{ flex: 1, textTransform: 'uppercase' }}
              />
              <button 
                type="button" 
                onClick={() => {
                  setIsCustomPair(false);
                  setFormData(prev => ({ ...prev, pair: favouritePairs[0] || '' }));
                }}
                className="btn-outline"
                style={{ padding: '0 0.75rem' }}
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="form-group row">
          <div className="flex-1">
            <label>Trade Type</label>
            <select name="type" value={formData.type} onChange={handleChange} className="input">
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </div>
          <div className="flex-1">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          <div className="flex-1">
            <label>Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
        </div>

        <div className="form-group row">
          <div className="flex-1">
            <label>Profit/Loss ($)</label>
            <input
              type="number"
              step="any"
              name="pnl"
              value={formData.pnl}
              onChange={handleChange}
              placeholder="e.g. 150.50"
              className="input"
              required
            />
          </div>
          <div className="flex-1">
            <label>Strategy / Setup</label>
            <select
              name="strategy"
              value={formData.strategy}
              onChange={handleChange}
              className="input"
            >
              {strategies.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Emotional State</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {[
              { id: 'confident', label: 'Confident 😎', color: 'var(--success)' },
              { id: 'fear', label: 'Fear 😨', color: 'var(--text-muted)' },
              { id: 'greedy', label: 'Greedy 🤑', color: 'var(--danger)' }
            ].map(emo => (
              <button
                key={emo.id}
                type="button"
                onClick={() => handleEmotionSelect(emo.id)}
                className="btn-outline"
                style={{
                  padding: '0.75rem 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  fontSize: '0.85rem',
                  border: formData.emotion === emo.id ? `1px solid ${emo.color}` : '1px solid var(--border)',
                  background: formData.emotion === emo.id ? `rgba(255, 255, 255, 0.1)` : 'var(--surface-light)',
                  boxShadow: formData.emotion === emo.id ? `0 0 10px ${emo.color}33` : 'none',
                  color: formData.emotion === emo.id ? emo.color : 'var(--text-primary)'
                }}
              >
                {emo.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Notes / Lessons</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="What did you learn from this trade?"
            className="input textarea"
            rows={4}
          ></textarea>
        </div>

        <div className="form-group">
          <label>Chart Image</label>
          <div className="image-upload-container">
            {!imagePreview ? (
              <label htmlFor="chart-image" className="image-upload-box">
                <ImagePlus size={32} />
                <span>Upload Chart Screenshot</span>
                <input
                  type="file"
                  id="chart-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden-input"
                />
              </label>
            ) : (
              <div className="image-preview-wrapper">
                <img src={imagePreview} alt="Chart Preview" className="image-preview" />
                <button type="button" onClick={removeImage} className="remove-image-btn">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02, boxShadow: '0 0 20px var(--primary-glow)' }}
          whileTap={{ scale: 0.95, background: 'var(--primary-dark)' }}
          type="submit" 
          disabled={isSubmitting} 
          className="btn-primary" 
          style={{ width: '100%', marginTop: '1rem', position: 'relative', overflow: 'hidden' }}
        >
          <AnimatePresence mode="wait">
            {!isSubmitting ? (
              <motion.div 
                key="save"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              >
                <Zap size={18} /> Save Trade
              </motion.div>
            ) : syncStatus === 'success' ? (
              <motion.div 
                key="done"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.2 }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--success)' }}
              >
                <Check size={20} /> Success
              </motion.div>
            ) : (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Cpu size={18} />
                </motion.div>
                Processing...
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </form>

      <AnimatePresence>
        {isSubmitting && <SaveHUD progress={syncProgress} status={syncStatus} tradeData={formData} />}
      </AnimatePresence>
    </div>
  );
}
