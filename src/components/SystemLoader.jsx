import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ShieldCheck, Cpu, TrendingUp } from 'lucide-react';
import { soundEngine } from '../utils/SoundEngine';

const SystemLoader = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('initializing');
  const [dataPackets, setDataPackets] = useState([]);
  const [flickerVal, setFlickerVal] = useState('0');
  const hudControls = useAnimation();
  const processingRef = useRef(null);

  useEffect(() => {
    // Start Initialization sequence
    soundEngine.playTap();
    setTimeout(() => soundEngine.playWhoosh(), 200);
    processingRef.current = soundEngine.playProcessing();

    // Progress simulation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus('success');
          return 100;
        }
        const step = Math.random() * 15;
        return Math.min(prev + step, 100);
      });
      
      setDataPackets(prev => {
        const newPacket = {
          id: Math.random(),
          x: Math.random() * 100,
          val: `0x${Math.floor(Math.random()*16777215).toString(16).toUpperCase()}`
        };
        return [...prev.slice(-10), newPacket];
      });
      setFlickerVal(Math.floor(Math.random() * 1000000).toString(16).toUpperCase());
    }, 150);

    // Vibration/Charge sound at 80%
    const chargeTimer = setTimeout(() => {
      soundEngine.playCharge();
      hudControls.start({
        x: [0, -2, 2, -2, 2, 0],
        transition: { duration: 0.4 }
      });
    }, 1200);

    return () => {
      clearInterval(interval);
      clearTimeout(chargeTimer);
      if (processingRef.current) processingRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if (status === 'success') {
      if (processingRef.current) processingRef.current.stop();
      soundEngine.playSuccess();
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
  }, [status]);

  return (
    <motion.div 
      initial={{ opacity: 1 }} 
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
      transition={{ duration: 0.8, ease: "circIn" }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#050a15',
        zIndex: 10000,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Background HUD Grid */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundImage: 'radial-gradient(rgba(0, 243, 255, 0.15) 1px, transparent 1px)', 
        backgroundSize: '50px 50px', opacity: 0.2, pointerEvents: 'none' }} />
      
      {/* Scanning Line */}
      <motion.div 
        animate={{ y: ['0%', '100%'] }} 
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'var(--primary)', opacity: 0.2, boxShadow: '0 0 15px var(--primary-glow)' }}
      />

      {/* Data Stream */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.15 }}>
        <AnimatePresence>
          {dataPackets.map(p => (
            <motion.div
              key={p.id}
              initial={{ y: '110vh', opacity: 0, x: `${p.x}%` }}
              animate={{ y: '-10vh', opacity: [0, 1, 0] }}
              transition={{ duration: 2.5, ease: "linear" }}
              style={{ position: 'absolute', color: 'var(--primary)', fontSize: '0.65rem', fontFamily: 'monospace' }}
            >
              {p.val}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Center HUD Circle */}
      <motion.div animate={hudControls} style={{ position: 'relative', marginBottom: '4rem' }}>
        <motion.div
          animate={{ 
            rotate: status === 'success' ? 0 : 360,
            scale: status === 'success' ? [1, 1.1, 1] : 1,
            boxShadow: status === 'success' ? '0 0 60px var(--success-glow)' : '0 0 30px var(--primary-glow)'
          }}
          transition={{ rotate: { duration: 15, repeat: Infinity, ease: "linear" }, scale: { duration: 0.4 } }}
          style={{ 
            width: '220px', height: '220px', 
            border: `1px solid ${status === 'success' ? 'var(--success)' : 'rgba(0, 243, 255, 0.3)'}`, 
            borderRadius: '50%', padding: '12px', position: 'relative'
          }}
        >
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
            style={{ 
              width: '100%', height: '100%', 
              border: `3px dashed ${status === 'success' ? 'var(--success)' : 'var(--primary)'}`, 
              borderRadius: '50%', opacity: status === 'success' ? 1 : 0.5
            }}
          />
          
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                  <ShieldCheck size={100} className="text-success" style={{ filter: 'drop-shadow(0 0 15px var(--success-glow))' }} />
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                   <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                     <Cpu size={70} className="text-primary" />
                   </motion.div>
                   <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--primary)', marginTop: '0.75rem', letterSpacing: '0.3em' }}>
                     {flickerVal}
                   </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Progress Section */}
      <div style={{ width: '100%', maxWidth: '450px', padding: '0 2rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '0.75rem', opacity: 0.8, letterSpacing: '0.1em' }}>
            <span>BOOT_SEQUENCE: {status.toUpperCase()}</span>
            <span>{Math.round(progress)}%</span>
         </div>
         
         <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', overflow: 'hidden', marginBottom: '1.5rem', position: 'relative' }}>
            <motion.div 
               animate={{ width: `${progress}%` }}
               transition={{ ease: "easeOut" }}
               style={{ height: '100%', background: status === 'success' ? 'var(--success)' : 'var(--primary)', boxShadow: status === 'success' ? '0 0 20px var(--success-glow)' : '0 0 20px var(--primary-glow)' }}
            />
         </div>

         <motion.div 
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ fontFamily: 'monospace', color: status === 'success' ? 'var(--success)' : 'var(--primary)', fontSize: '0.9rem', letterSpacing: '0.2em', fontWeight: 600 }}
         >
            {status === 'success' ? "SYSTEM_ONLINE // TERMINAL_ACTIVE" : "INITIALIZING_FRACTAL_CORE..."}
         </motion.div>
      </div>

      <div style={{ position: 'absolute', bottom: '3rem', width: '100%', display: 'flex', justifyContent: 'center', gap: '3rem', opacity: 0.4, fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '0.1em' }}>
         <div>OS: TRADU_KERNEL_v4.2</div>
         <div>UPTIME: 0.0000s</div>
         <div>AUTH: CRYPTOGRAPHIC_LINK_ESTABLISHED</div>
      </div>
    </motion.div>
  );
};

export default SystemLoader;
