import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

import { Lock, Shield, Activity, Mail, Key, ArrowRight, AlertCircle, Maximize } from 'lucide-react';

export default function Login() {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle email/password login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      console.error(err);
      setError('Invalid credentials. Please try again or use Google.');
      setLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setError('Google authentication failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        .login-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(0, 243, 255, 0.15), inset 0 0 10px rgba(0, 243, 255, 0.05);
          background: rgba(0, 0, 0, 0.4);
        }
        .login-input::placeholder {
          color: rgba(255,255,255,0.3);
        }
        .glow-btn {
          position: relative;
          overflow: hidden;
        }
        .glow-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }
        .glow-btn:hover::before {
          left: 100%;
        }
        .login-bg-anim {
          animation: bgPulse 10s ease-in-out infinite alternate;
        }
        @keyframes bgPulse {
          0% { filter: hue-rotate(0deg) brightness(1); }
          100% { filter: hue-rotate(15deg) brightness(1.2); }
        }
        .candlestick {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .particle {
          position: absolute;
          border-radius: 50%;
          background: var(--primary);
          box-shadow: 0 0 10px var(--primary);
          animation: rise linear infinite;
        }
        @keyframes rise {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 0.5; transform: scale(1); }
          90% { opacity: 0.2; }
          100% { transform: translateY(-100px) scale(0.5); opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .split-left { display: none !important; }
          .split-right { width: 100% !important; border-radius: 0 !important; }
        }
      `}</style>

      {/* LEFT PANEL: VISUALS */}
      <div className="split-left" style={styles.leftPanel}>
        <div style={styles.particlesContainer}>
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              animationDuration: `${Math.random() * 10 + 5}s`,
              animationDelay: `-${Math.random() * 10}s`
            }}/>
          ))}
        </div>

        {/* Abstract Chart Background */}
        <div style={styles.abstractChart}>
          <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0"/>
                <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0,500 L100,450 L200,480 L300,320 L400,350 L500,200 L600,250 L700,100 L800,150" fill="none" stroke="url(#lineGrad)" strokeWidth="4" />
            <path d="M0,500 L100,450 L200,480 L300,320 L400,350 L500,200 L600,250 L700,100 L800,150 L800,600 L0,600 Z" fill="url(#lineGrad)" opacity="0.1" />
            
            {/* Candlesticks */}
            <g className="candlestick" style={{ animationDelay: '0s' }}>
              <line x1="300" y1="280" x2="300" y2="380" stroke="var(--primary)" strokeWidth="2"/>
              <rect x="290" y="300" width="20" height="40" fill="var(--primary)" opacity="0.8"/>
            </g>
            <g className="candlestick" style={{ animationDelay: '2s' }}>
              <line x1="500" y1="150" x2="500" y2="280" stroke="var(--success)" strokeWidth="2"/>
              <rect x="490" y="180" width="20" height="60" fill="var(--success)" opacity="0.8"/>
            </g>
            <g className="candlestick" style={{ animationDelay: '1s' }}>
              <line x1="100" y1="400" x2="100" y2="520" stroke="var(--danger)" strokeWidth="2"/>
              <rect x="90" y="430" width="20" height="40" fill="var(--danger)" opacity="0.8"/>
            </g>
          </svg>
        </div>

        <div style={styles.branding}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={styles.logoIcon}>
                <Activity size={32} color="var(--primary)" />
              </div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>Trade Insight</h1>
            </div>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.6 }}>
              The elite trading terminal for professionals. Track, analyze, and scale your strategy.
            </p>
          </div>
        </div>

        <div style={styles.trustBadges}>
          <div style={styles.trustBadge}>
            <Shield size={16} color="var(--primary)" />
            <span>256-bit AES Encryption</span>
          </div>
          <div style={styles.trustBadge}>
            <Lock size={16} color="var(--primary)" />
            <span>Secure Session</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: LOGIN FORM */}
      <div className="split-right" style={styles.rightPanel}>
        <div 
          style={styles.loginCard}
        >
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Secure access to your trading system</p>
          </div>

          {error && (
            <div className="glass-panel" style={styles.errorBox}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email / API Key</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={styles.inputIcon} />
                <input 
                  type="email" 
                  className="login-input"
                  placeholder="name@domain.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={{ position: 'relative' }}>
                <Key size={18} style={styles.inputIcon} />
                <input 
                  type="password" 
                  className="login-input"
                  placeholder="••••••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="glow-btn"
              disabled={loading}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={styles.submitBtn(isHovered, loading)}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="spinner" style={styles.spinner} />
                  Authenticating...
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                  Login to Dashboard
                  <ArrowRight size={18} style={{ transform: isHovered ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 0.3s' }} />
                </div>
              )}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerText}>OR</span>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            disabled={loading}
            style={styles.googleBtn}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#030712',
    color: '#fff',
    fontFamily: 'Inter, sans-serif',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 99999
  },
  leftPanel: {
    width: '55%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '4rem',
    background: 'linear-gradient(135deg, rgba(5,10,21,1) 0%, rgba(10,20,40,1) 100%)',
    borderRight: '1px solid rgba(0,243,255,0.1)',
    overflow: 'hidden',
  },
  particlesContainer: {
    position: 'absolute',
    top: 0, left: 0, width: '100%', height: '100%',
    pointerEvents: 'none',
    zIndex: 1
  },
  abstractChart: {
    position: 'absolute',
    bottom: '-10%', right: '-10%',
    width: '120%', height: '80%',
    opacity: 0.4,
    pointerEvents: 'none',
    zIndex: 0,
    filter: 'blur(2px)'
  },
  branding: {
    position: 'relative',
    zIndex: 10,
    marginTop: '15vh'
  },
  logoIcon: {
    width: '64px', height: '64px',
    borderRadius: '16px',
    background: 'rgba(0, 243, 255, 0.1)',
    border: '1px solid rgba(0, 243, 255, 0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 30px rgba(0, 243, 255, 0.2)'
  },
  trustBadges: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    gap: '2rem',
    opacity: 0.7
  },
  trustBadge: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    fontSize: '0.85rem', fontWeight: 500,
    background: 'rgba(255,255,255,0.03)',
    padding: '0.5rem 1rem',
    borderRadius: '100px',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  rightPanel: {
    width: '45%',
    background: '#050a15',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    position: 'relative'
  },
  loginCard: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--surface)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: '2.5rem',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(0, 243, 255, 0.05)',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: 'rgba(255, 51, 102, 0.1)',
    border: '1px solid rgba(255, 51, 102, 0.3)',
    color: '#ff3366',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
    overflow: 'hidden'
  },
  inputGroup: {
    display: 'flex', flexDirection: 'column'
  },
  label: {
    fontSize: '0.85rem', fontWeight: 500, color: '#a1a1aa',
    marginBottom: '0.5rem'
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem', top: '50%', transform: 'translateY(-50%)',
    color: '#71717a',
    pointerEvents: 'none'
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '0.875rem 1rem 0.875rem 2.75rem',
    color: 'white',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
  },
  submitBtn: (isHovered, loading) => ({
    width: '100%',
    padding: '1rem',
    borderRadius: '12px',
    background: loading ? 'rgba(0, 243, 255, 0.5)' : 'var(--primary)',
    color: '#000',
    fontWeight: 600,
    fontSize: '1rem',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginTop: '0.5rem',
    boxShadow: isHovered && !loading ? '0 0 20px rgba(0, 243, 255, 0.5)' : '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    display: 'flex', justifyContent: 'center', alignItems: 'center'
  }),
  divider: {
    margin: '1.5rem 0',
    textAlign: 'center',
    position: 'relative'
  },
  dividerText: {
    background: 'var(--surface)',
    padding: '0 1rem',
    color: '#71717a',
    fontSize: '0.8rem',
    position: 'relative',
    zIndex: 1,
    fontWeight: 600
  },
  googleBtn: {
    width: '100%',
    padding: '0.875rem',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '0.95rem',
    fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  spinner: {
    width: '16px', height: '16px',
    border: '2px solid rgba(0,0,0,0.3)',
    borderTopColor: '#000',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};
