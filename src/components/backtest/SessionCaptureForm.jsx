import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Plus, Trash2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
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
        notes: '',
        tags: []
    });

    const [screenshots, setScreenshots] = useState([]); // Array of { asset, timeframe, image }
    const [isSaving, setIsSaving] = useState(false);

    const ASSET_OPTIONS = ['USOIL', 'BTCUSD', 'ETHUSD', 'EURUSD', 'GBPUSD', 'NAS100', 'XAUUSD'];
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
        const reader = new FileReader();
        reader.onloadend = () => {
            const imageData = reader.result;
            setScreenshots(prev => {
                const existing = prev.find(s => s.asset === asset && s.timeframe === timeframe);
                if (existing) {
                    return prev.map(s => s === existing ? { ...s, image: imageData } : s);
                }
                return [...prev, { asset, timeframe, image: imageData }];
            });
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        const data = {
            ...sessionData,
            screenshots
        };
        const saved = await saveSessionCapture(currentUser.uid, data);
        if (saved) {
            onSave();
            onClose();
        }
        setIsSaving(false);
    };

    const capturePairs = [];
    sessionData.assets.forEach(asset => {
        sessionData.timeframes.forEach(tf => {
            capturePairs.push({ asset, tf });
        });
    });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="modal-content glass-panel"
                style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Camera className="text-primary" /> SESSION_CAPTURE_INITIALIZATION
                    </h2>
                    <button onClick={onClose} className="icon-btn"><X size={20} /></button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    {step === 1 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>PROTOCOL_DETAILS</h3>
                                <div className="form-group">
                                    <label>SESSION_NAME</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. London Breakout Protocol" 
                                        className="input"
                                        value={sessionData.name}
                                        onChange={e => setSessionData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>DATE_STAMP</label>
                                    <input 
                                        type="date" 
                                        className="input"
                                        value={sessionData.date}
                                        onChange={e => setSessionData(prev => ({ ...prev, date: e.target.value }))}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>START_TIME</label>
                                        <input 
                                            type="time" 
                                            className="input"
                                            value={sessionData.startTime}
                                            onChange={e => setSessionData(prev => ({ ...prev, startTime: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>END_TIME</label>
                                        <input 
                                            type="time" 
                                            className="input"
                                            value={sessionData.endTime}
                                            onChange={e => setSessionData(prev => ({ ...prev, endTime: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>INTEL_NOTES</label>
                                    <textarea 
                                        rows="3" 
                                        placeholder="Session observations..." 
                                        className="textarea"
                                        value={sessionData.notes}
                                        onChange={e => setSessionData(prev => ({ ...prev, notes: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>ASSET_&_TF_SELECTION</h3>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ marginBottom: '0.75rem' }}>ASSETS_TARGETED</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {ASSET_OPTIONS.map(a => (
                                            <button 
                                                key={a}
                                                onClick={() => toggleAsset(a)}
                                                className={`badge ${sessionData.assets.includes(a) ? 'bg-primary' : 'bg-muted'}`}
                                                style={{ cursor: 'pointer', border: 'none', padding: '0.4rem 0.8rem' }}
                                            >
                                                {a}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ marginBottom: '0.75rem' }}>TIMEFRAMES_ANALYSED</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {TIMEFRAME_OPTIONS.map(tf => (
                                            <button 
                                                key={tf}
                                                onClick={() => toggleTimeframe(tf)}
                                                className={`badge ${sessionData.timeframes.includes(tf) ? 'bg-primary' : 'bg-muted'}`}
                                                style={{ cursor: 'pointer', border: 'none', padding: '0.4rem 0.8rem' }}
                                            >
                                                {tf}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>SCREENSHOT_REPOSITORY</h3>
                                <div style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>{screenshots.length} / {capturePairs.length} UPLOADED</div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                                {capturePairs.map(pair => {
                                    const shot = screenshots.find(s => s.asset === pair.asset && s.timeframe === pair.tf);
                                    return (
                                        <div key={`${pair.asset}-${pair.tf}`} className="glass-panel" style={{ padding: '0.75rem', position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>{pair.asset} <span className="text-primary">{pair.tf}</span></div>
                                                {shot && <CheckCircle2 size={12} className="text-success" />}
                                            </div>
                                            
                                            <div 
                                                style={{ 
                                                    height: '120px', 
                                                    background: 'rgba(0,0,0,0.2)', 
                                                    borderRadius: '0.25rem', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    overflow: 'hidden',
                                                    border: shot ? '1px solid var(--success)' : '1px dashed var(--border)'
                                                }}
                                                onClick={() => document.getElementById(`upload-${pair.asset}-${pair.tf}`).click()}
                                            >
                                                {shot ? (
                                                    <img src={shot.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <Plus size={24} style={{ opacity: 0.3 }} />
                                                )}
                                                <input 
                                                    id={`upload-${pair.asset}-${pair.tf}`} 
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
                        </div>
                    )}
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    {step === 1 ? (
                        <button 
                            className="btn-primary" 
                            disabled={!sessionData.name || sessionData.assets.length === 0 || sessionData.timeframes.length === 0}
                            onClick={() => setStep(2)}
                        >
                            PROCEED_TO_CAPTURE
                        </button>
                    ) : (
                        <>
                            <button className="btn-secondary" onClick={() => setStep(1)}>BACK</button>
                            <button 
                                className="btn-primary" 
                                disabled={isSaving || screenshots.length === 0}
                                onClick={handleSubmit}
                            >
                                {isSaving ? 'UPLOADING...' : 'ARCHIVE_SESSION'}
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
