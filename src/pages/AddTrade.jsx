import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveTrade, getUserProfile } from '../utils/db';
import { ImagePlus, X, AlertCircle, ShieldCheck, Database, Cpu, Zap } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const SyncOverlay = ({ progress, status }) => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }}
    style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5, 10, 21, 0.98)',
      zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(10px)',
      padding: '2rem', textAlign: 'center'
    }}
  >
    <div style={{ position: 'relative', marginBottom: '2rem' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ width: '120px', height: '120px', border: '2px dashed var(--primary)', borderRadius: '50%', opacity: 0.3 }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--primary)' }}
      >
        {status === 'success' ? <ShieldCheck size={48} /> : <Database size={48} />}
      </motion.div>
    </div>

    <div style={{ width: '100%', maxWidth: '300px', background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', overflow: 'hidden', marginBottom: '1rem' }}>
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        style={{ height: '100%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)' }}
      />
    </div>

    <div style={{ fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
      {progress < 30 && "INITIALIZING ENCRYPTED TUNNEL..."}
      {progress >= 30 && progress < 60 && "UPLOADING PACKETS TO GRID..."}
      {progress >= 60 && progress < 90 && "BYPASSING LATENCY BARRIERS..."}
      {progress >= 90 && progress < 100 && "VALIDATING CHECKSUM..."}
      {progress === 100 && "DATA SYNC SUCCESSFUL. RECORDS SECURED."}
    </div>

    <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', textAlign: 'left', opacity: 0.3, fontFamily: 'monospace', fontSize: '0.6rem' }}>
      IP: 192.168.0.{Math.floor(Math.random() * 255)}<br/>
      PORT: {Math.floor(Math.random() * 9000) + 1000}<br/>
      PROTOCOL: AES-256-GCM
    </div>
  </motion.div>
);

export default function AddTrade() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pair: 'BTC/USDT',
    type: 'long',
    pnl: '',
    date: new Date().toISOString().slice(0, 10),
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

        <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
          {isSubmitting ? 'Transferring Data...' : 'Save Trade'}
        </button>
      </form>

      <AnimatePresence>
        {isSubmitting && <SyncOverlay progress={syncProgress} status={syncStatus} />}
      </AnimatePresence>
    </div>
  );
}
