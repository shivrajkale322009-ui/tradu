import { useState } from 'react';

import { Camera, Plus, History, Activity } from 'lucide-react';
import SessionCaptureList from '../components/backtest/SessionCaptureList';
import SessionCaptureForm from '../components/backtest/SessionCaptureForm';

export default function Backtest() {
  const [showCaptureForm, setShowCaptureForm] = useState(false);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0 });

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '3rem',
        padding: '2rem 0',
        borderBottom: '1px solid var(--border)'
      }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
            <Camera className="text-primary" size={28} /> SESSION_ARCHIVE
          </h1>
          <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.4rem', letterSpacing: '0.05em' }}>
            VISUAL_HISTORY_LOG
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.2rem' }}>TOTAL_SESSIONS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'monospace' }}>{stats.total.toString().padStart(3, '0')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.2rem' }}>THIS_WEEK</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>{stats.thisWeek.toString().padStart(2, '0')}</div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowCaptureForm(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1.75rem', fontWeight: 800 }}
          >
            <Plus size={18} /> ADD_SESSION
          </button>
        </div>
      </header>

      <div style={{ minHeight: '60vh' }}>
        <SessionCaptureList 
          onStatsUpdate={setStats}
          onEmpty={() => (
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
            <button 
              onClick={() => setShowCaptureForm(true)}
              className="btn-primary"
              style={{ marginTop: '1.5rem', padding: '0.8rem 2.5rem' }}
            >
              ADD_SESSION
            </button>
          </div>
        )} />
      </div>

      {showCaptureForm && (
          <SessionCaptureForm
            onClose={() => setShowCaptureForm(false)}
            onSave={() => window.location.reload()} 
          />
        )}
      

    </div>
  );
}
