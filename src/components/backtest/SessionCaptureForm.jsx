import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Plus, Trash2, Image as ImageIcon, CheckCircle2, Upload, AlertCircle, Info } from 'lucide-react';
import { saveSessionCapture } from '../../utils/db';
import { useAuth } from '../../context/AuthContext';

export default function SessionCaptureForm({ onClose, onSave }) {
    const { currentUser } = useAuth();
    const [step, setStep] = useState(1);
    const [sessionData, setSessionData] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '18:00',
        endTime: '22:00',
        assets: [],
        timeframes: [],
        notes: ''
    });

    const [screenshots, setScreenshots] = useState([]); // Array of { asset, timeframe, image }
    const [isSaving, setIsSaving] = useState(false);

    const ASSET_OPTIONS = ['USOIL', 'BTCUSD', 'ETHUSD', 'EURUSD', 'GBPUSD', 'NAS100', 'XAUUSD', 'GBP/JPY', 'US30'];
    const TIMEFRAME_OPTIONS = ['1m', '5m', '15m', '1h', '4h', 'D'];

    const toggleAsset = (asset) => {
        setSessionData(prev => ({
            ...prev,
            assets: prev.assets.includes(asset) ? prev.assets.filter(a => a !== asset) : [...prev.assets, asset]
        }));
    };

    const toggleTimeframe = (tf) => {
        setSessionData(prev => ({
            ...prev,
            timeframes: prev.timeframes.includes(tf) ? prev.timeframes.filter(t => t !== tf) : [...prev.timeframes, tf]
        }));
    };

    const handleImageUpload = (asset, timeframe, file) => {
        if (!file) return;
        
        // Validation: Size check (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("File size exceeds 5MB limit.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const imageData = reader.result;
            setScreenshots(prev => {
                const filtered = prev.filter(s => !(s.asset === asset && s.timeframe === timeframe));
                return [...filtered, { asset, timeframe, image: imageData }];
            });
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (screenshots.length === 0) {
            alert("Please upload at least one screenshot to archive the session.");
            return;
        }

        setIsSaving(true);
        try {
            const data = {
                ...sessionData,
                screenshots
            };
            const saved = await saveSessionCapture(currentUser.uid, data);
            if (saved) {
                onSave();
                onClose();
            }
        } catch (err) {
            console.error(err);
            alert("Error saving session. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate required pairs
    const capturePairs = useMemo(() => {
        const pairs = [];
        sessionData.assets.forEach(asset => {
            sessionData.timeframes.forEach(tf => {
                pairs.push({ asset, tf });
            });
        });
        return pairs;
    }, [sessionData.assets, sessionData.timeframes]);

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="modal-content glass-panel"
                style={{ maxWidth: '900px', width: '100%', maxHeight: '95vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'var(--primary)', padding: '0.4rem', borderRadius: '6px', color: '#000' }}>
                            <Camera size={18} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>SESSION_CAPTURE_WIZARD</h2>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)' }}>{step === 1 ? 'CONFIGURING_PROTOCOL' : 'UPLOADING_VISUAL_INTEL'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="icon-btn-secondary"><X size={18} /></button>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', width: '100%' }}>
                    <motion.div 
                        animate={{ width: step === 1 ? '50%' : '100%' }}
                        style={{ height: '100%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)' }}
                    />
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    {step === 1 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                            {/* Left: Metadata */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.65rem', color: 'var(--primary)', marginBottom: '0.5rem', display: 'block' }}>01_SESSION_IDENTITY</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. London Volatility Capture" 
                                        className="input"
                                        value={sessionData.name}
                                        onChange={e => setSessionData(prev => ({ ...prev, name: e.target.value }))}
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>DATE</label>
                                        <input 
                                            type="date" 
                                            className="input"
                                            value={sessionData.date}
                                            onChange={e => setSessionData(prev => ({ ...prev, date: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>TIME_RANGE</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <input type="time" className="input" value={sessionData.startTime} onChange={e => setSessionData(prev => ({ ...prev, startTime: e.target.value }))} style={{ padding: '0.4rem' }} />
                                            <span style={{ opacity: 0.3 }}>-</span>
                                            <input type="time" className="input" value={sessionData.endTime} onChange={e => setSessionData(prev => ({ ...prev, endTime: e.target.value }))} style={{ padding: '0.4rem' }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>OBSERVATIONS</label>
                                    <textarea 
                                        rows="4" 
                                        placeholder="Note down key session takeaways..." 
                                        className="textarea"
                                        value={sessionData.notes}
                                        onChange={e => setSessionData(prev => ({ ...prev, notes: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Right: Targets */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.65rem', color: 'var(--secondary)', marginBottom: '0.75rem', display: 'block' }}>02_ASSETS_TO_TRACK</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {ASSET_OPTIONS.map(a => (
                                            <button 
                                                key={a}
                                                onClick={() => toggleAsset(a)}
                                                className={`badge ${sessionData.assets.includes(a) ? 'bg-primary' : 'bg-muted'}`}
                                                style={{ cursor: 'pointer', border: '1px solid var(--border)', padding: '0.5rem 0.8rem', fontSize: '0.7rem' }}
                                            >
                                                {a}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.65rem', color: 'var(--secondary)', marginBottom: '0.75rem', display: 'block' }}>03_TIMEFRAME_ANALYSIS</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {TIMEFRAME_OPTIONS.map(tf => (
                                            <button 
                                                key={tf}
                                                onClick={() => toggleTimeframe(tf)}
                                                className={`badge ${sessionData.timeframes.includes(tf) ? 'bg-primary' : 'bg-muted'}`}
                                                style={{ cursor: 'pointer', border: '1px solid var(--border)', padding: '0.5rem 0.8rem', fontSize: '0.7rem' }}
                                            >
                                                {tf}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', marginTop: 'auto' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Info size={16} className="text-primary" />
                                        <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                            Selecting {sessionData.assets.length} assets and {sessionData.timeframes.length} timeframes will generate {sessionData.assets.length * sessionData.timeframes.length} capture slots.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* Step 2 Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '0.9rem' }}>UPLOAD_SESSION_CHARTS</h3>
                                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)' }}>Click each slot or drag-and-drop your screenshots.</p>
                                </div>
                                <div className="badge bg-muted" style={{ padding: '0.4rem 1rem' }}>
                                    <ImageIcon size={12} style={{ marginRight: '0.5rem' }} /> {screenshots.length} / {capturePairs.length} COMPLETED
                                </div>
                            </div>

                            {/* Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                                {capturePairs.map(pair => {
                                    const shot = screenshots.find(s => s.asset === pair.asset && s.timeframe === pair.tf);
                                    const id = `upload-${pair.asset}-${pair.tf}`.replace(/[^a-zA-Z0-9-]/g, '');
                                    
                                    return (
                                        <div 
                                            key={`${pair.asset}-${pair.tf}`} 
                                            className="glass-panel" 
                                            style={{ 
                                                padding: '0.5rem', 
                                                position: 'relative',
                                                border: shot ? '1px solid var(--success)55' : '1px solid var(--border)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{pair.asset} <span className="text-primary" style={{ fontSize: '0.65rem' }}>{pair.tf}</span></span>
                                                {shot ? (
                                                    <CheckCircle2 size={14} className="text-success" />
                                                ) : (
                                                    <AlertCircle size={14} className="text-muted" style={{ opacity: 0.3 }} />
                                                )}
                                            </div>
                                            
                                            <div 
                                                style={{ 
                                                    height: '150px', 
                                                    background: 'rgba(0,0,0,0.3)', 
                                                    borderRadius: '6px', 
                                                    display: 'flex', 
                                                    flexDirection: 'column',
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    overflow: 'hidden',
                                                    border: '1px dashed rgba(255,255,255,0.05)',
                                                    marginTop: '0.4rem',
                                                    position: 'relative'
                                                }}
                                                onClick={() => document.getElementById(id).click()}
                                                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                                onDragLeave={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'transparent'; }}
                                                onDrop={e => {
                                                    e.preventDefault();
                                                    e.currentTarget.style.borderColor = 'transparent';
                                                    handleImageUpload(pair.asset, pair.tf, e.dataTransfer.files[0]);
                                                }}
                                            >
                                                {shot ? (
                                                    <>
                                                        <img src={shot.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '0.4rem', fontSize: '0.6rem', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
                                                            CLICK_TO_CHANGE
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ textAlign: 'center', opacity: 0.4 }}>
                                                        <Upload size={20} style={{ marginBottom: '0.5rem' }} />
                                                        <div style={{ fontSize: '0.6rem' }}>SELECT_CHART</div>
                                                    </div>
                                                )}
                                                <input 
                                                    id={id} 
                                                    type="file" 
                                                    hidden 
                                                    accept="image/*"
                                                    onChange={e => handleImageUpload(pair.asset, pair.tf, e.target.files[0])}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {capturePairs.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                                    <AlertCircle size={32} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                    <p style={{ margin: 0 }}>NO_TARGETS_GENERATED. PLEASE_GO_BACK_AND_SELECT_ASSETS.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                        {step === 1 ? '* REQUIRE_NAME_AND_TARGETS' : `* ${screenshots.length} OF ${capturePairs.length} PROTOCOLS_MATCHED`}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn-secondary" onClick={onClose} style={{ padding: '0.6rem 1.25rem' }}>CANCEL</button>
                        {step === 1 ? (
                            <button 
                                className="btn-primary" 
                                disabled={!sessionData.name || sessionData.assets.length === 0 || sessionData.timeframes.length === 0}
                                onClick={() => setStep(2)}
                                style={{ padding: '0.6rem 2rem' }}
                            >
                                CONTINUE <Plus size={14} style={{ marginLeft: '0.5rem' }} />
                            </button>
                        ) : (
                            <>
                                <button className="btn-secondary" onClick={() => setStep(1)} style={{ padding: '0.6rem 1.25rem' }}>BACK</button>
                                <button 
                                    className="btn-primary" 
                                    disabled={isSaving || screenshots.length === 0}
                                    onClick={handleSubmit}
                                    style={{ padding: '0.6rem 2rem' }}
                                >
                                    {isSaving ? 'ENCRYPTING...' : 'FINALIZE_ARCHIVE'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
            
            <style>{`
                .textarea {
                    width: 100%;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid var(--border);
                    color: #fff;
                    padding: 0.75rem;
                    border-radius: var(--radius-sm);
                    font-family: inherit;
                    font-size: 0.85rem;
                    outline: none;
                }
                .textarea:focus {
                    border-color: var(--primary);
                    background: rgba(255,255,255,0.04);
                }
            `}</style>
        </div>
    );
}
