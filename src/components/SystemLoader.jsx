import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ShieldCheck, Cpu, Check, Lock } from 'lucide-react';
import { soundEngine } from '../utils/SoundEngine';

// v2.1.0 - Futuristic Auto-Login HUD
const SystemLoader = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('booting');
  const [terminalLines, setTerminalLines] = useState([]);
  const [typedChars, setTypedChars] = useState('');
  const [flickerVal, setFlickerVal] = useState('0');
  const hudControls = useAnimation();
  const processingRef = useRef(null);

  const loginSequence = [
    { label: "USER_ID: ", val: "TRADU_ROOT_ALPHA" },
    { label: "PASSWORD: ", val: "••••••••••••" },
    { label: "STATUS: ", val: "AUTHENTICATING..." },
    { label: "ACCESS: ", val: "GRANTED" },
    { label: "SYSTEM: ", val: "LOADING TRADING CORE..." }
  ];

  useEffect(() => {
    // Initial Boot
    soundEngine.init();
    soundEngine.playTap();
    setTimeout(() => soundEngine.playWhoosh(), 200);
    processingRef.current = soundEngine.playProcessing();

    // Simulation sequence
    let currentLine = 0;
    let currentChar = 0;
    
    const sequenceInterval = setInterval(() => {
        if (currentLine < loginSequence.length) {
            const line = loginSequence[currentLine];
            const partialVal = line.val.slice(0, currentChar + 1);
            
            setTerminalLines(prev => {
                const newLines = [...prev];
                newLines[currentLine] = { label: line.label, val: partialVal };
                return newLines;
            });
            
            currentChar++;
            if (currentChar >= line.val.length) {
                currentLine++;
                currentChar = 0;
                // At line 3 (Access Granted), speed up progress
                if (currentLine === 4) {
                    setStatus('processing');
                }
            }
        } else {
            clearInterval(sequenceInterval);
            setStatus('success');
        }
        
        setProgress(prev => Math.min(prev + 1.2, 100));
        setFlickerVal(Math.floor(Math.random() * 1000000).toString(16).toUpperCase());
    }, 45); // Fast machine-like typing

    return () => {
      clearInterval(sequenceInterval);
      if (processingRef.current) processingRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if (status === 'success') {
      if (processingRef.current) processingRef.current.stop();
      soundEngine.playSuccess();
      setTimeout(() => {
        onComplete();
      }, 1200);
    }
  }, [status]);

  return (
    <motion.div 
      initial={{ opacity: 1 }} 
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(30px)' }}
      transition={{ duration: 0.6 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#050a19',
        zIndex: 10000,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* HUD Grid & Scanlines */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px)', 
        backgroundSize: '40px 40px', opacity: 0.3 }} />
      
      <motion.div 
        animate={{ y: ['-100%', '200%'] }} 
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', left: 0, right: 0, height: '150px', background: 'linear-gradient(transparent, rgba(0, 240, 255, 0.05), transparent)', zIndex: 1 }}
      />

      {/* Main HUD Module */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ position: 'relative', marginBottom: '3.5rem', zIndex: 10 }}
      >
        <motion.div
          animate={{ 
            rotate: status === 'success' ? 0 : 360,
            boxShadow: status === 'success' ? '0 0 60px var(--success-glow)' : '0 0 40px var(--primary-glow)'
          }}
          transition={{ rotate: { duration: status === 'processing' ? 5 : 15, repeat: Infinity, ease: "linear" } }}
          style={{ 
            width: '240px', height: '240px', 
            border: `1px solid ${status === 'success' ? 'var(--success)' : 'rgba(0, 240, 255, 0.2)'}`, 
            borderRadius: '50%', padding: '12px'
          }}
        >
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{ 
              width: '100%', height: '100%', 
              border: `2px dashed ${status === 'success' ? 'var(--success)' : 'var(--primary)'}`, 
              borderRadius: '50%', opacity: 0.5
            }}
          />
          
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                  <Check size={90} className="text-success" style={{ filter: 'drop-shadow(0 0 15px var(--success-glow))' }} />
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                   <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                     <Cpu size={80} className="text-primary" style={{ filter: 'drop-shadow(0 0 10px var(--primary-glow))' }} />
                   </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Orbital particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ rotate: 360 }}
            transition={{ duration: 2 + i, repeat: Infinity, ease: "linear" }}
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

      {/* Terminal Terminal Output */}
      <div style={{ width: '100%', maxWidth: '450px', background: 'rgba(0, 20, 40, 0.4)', padding: '1.5rem', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
         <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary)', letterSpacing: '0.05em' }}>
            {terminalLines.map((line, i) => (
               <div key={i} style={{ marginBottom: '0.4rem', opacity: i === terminalLines.length - 1 ? 1 : 0.6 }}>
                  <span style={{ fontWeight: 'bold' }}>{line.label}</span>
                  <span style={{ color: line.val === 'GRANTED' ? 'var(--success)' : '#fff' }}>{line.val}</span>
                  {i === terminalLines.length - 1 && status !== 'success' && (
                    <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.4 }}>_</motion.span>
                  )}
               </div>
            ))}
         </div>
         
         <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', overflow: 'hidden', marginTop: '1.5rem', position: 'relative' }}>
            <motion.div 
               animate={{ width: `${progress}%` }}
               style={{ height: '100%', background: status === 'success' ? 'var(--success)' : 'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)' }}
            />
         </div>
      </div>

      <div style={{ position: 'absolute', bottom: '2rem', display: 'flex', gap: '4rem', opacity: 0.3, fontFamily: 'monospace', fontSize: '0.65rem' }}>
         <div>OS: TRADU_LINK_v4</div>
         <div>HOST: {flickerVal}</div>
         <div>ENC: RSA_4096_X</div>
      </div>
    </motion.div>
  );
};

export default SystemLoader;
