import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, History, Activity } from 'lucide-react';
import SessionCaptureList from '../components/backtest/SessionCaptureList';
import SessionCaptureForm from '../components/backtest/SessionCaptureForm';

export default function Backtest() {
  const [showCaptureForm, setShowCaptureForm] = useState(false);

  return (
    <div className="page-container" style={{ maxWidth: '1200px' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        marginBottom: '2.5rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid var(--border)'
      }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <Camera className="text-primary" /> SESSION_ARCHIVE
          </h1>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Visual documentation of trading sessions and multi-timeframe protocols.</p>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCaptureForm(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1.75rem' }}
        >
          <Plus size={18} /> ADD_SESSION
        </motion.button>
      </header>

      <div style={{ minHeight: '60vh' }}>
        <SessionCaptureList onEmpty={() => (
          <div className="glass-panel" style={{ 
            padding: '6rem 2rem', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '1.5rem',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.01)',
            border: '1px dashed var(--border)'
          }}>
            <div style={{ padding: '2rem', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.03)', color: 'rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
              <History size={64} />
            </div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, letterSpacing: '0.1em' }}>NO_SESSIONS_YET</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '0.85rem', lineHeight: '1.6' }}>
              Document your trading sessions with multi-timeframe screenshots for later review and optimization.
            </p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCaptureForm(true)}
              className="btn-primary"
              style={{ marginTop: '1.5rem', padding: '0.8rem 2.5rem' }}
            >
              ADD_SESSION
            </motion.button>
          </div>
        )} />
      </div>

      <AnimatePresence>
        {showCaptureForm && (
          <SessionCaptureForm
            onClose={() => setShowCaptureForm(false)}
            onSave={() => window.location.reload()} 
          />
        )}
      </AnimatePresence>
      
      <style>{`
        .page-container {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
