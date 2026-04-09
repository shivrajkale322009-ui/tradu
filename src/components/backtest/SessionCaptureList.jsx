import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Calendar, Clock, Trash2, Maximize2, X, ChevronRight, LayoutGrid } from 'lucide-react';
import { getSessionCaptures, deleteSessionCapture } from '../../utils/db';
import { useAuth } from '../../context/AuthContext';

export default function SessionCaptureList() {
    const { currentUser } = useAuth();
    const [captures, setCaptures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);
    const [zoomImage, setZoomImage] = useState(null);

    useEffect(() => {
        fetchCaptures();
    }, [currentUser]);

    const fetchCaptures = async () => {
        setLoading(true);
        const data = await getSessionCaptures(currentUser.uid);
        setCaptures(data);
        setLoading(false);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (confirm('Permanently delete this session capture?')) {
            await deleteSessionCapture(id);
            fetchCaptures();
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>FETCHING_SESSION_INTEL...</div>;

    if (captures.length === 0) {
        return (
            <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)' }}>
                <Camera size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>NO_SESSIONS_CAPTURED</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Start documenting your sessions with multi-timeframe visual records.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {captures.map(session => (
                <motion.div
                    key={session.id}
                    whileHover={{ y: -5 }}
                    className="glass-panel"
                    style={{ padding: '1.5rem', cursor: 'pointer', position: 'relative' }}
                    onClick={() => setSelectedSession(session)}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>{session.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem' }}>
                                    <Calendar size={12} /> {new Date(session.date).toLocaleDateString()}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem' }}>
                                    <Clock size={12} /> {session.startTime} - {session.endTime}
                                </div>
                            </div>
                        </div>
                        <button onClick={(e) => handleDelete(e, session.id)} className="icon-btn hover-danger" style={{ height: 'fit-content' }}>
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {session.assets.map(a => <span key={a} className="badge bg-muted" style={{ fontSize: '0.55rem' }}>{a}</span>)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', height: '80px', marginBottom: '1rem' }}>
                        {session.screenshots.slice(0, 3).map((s, idx) => (
                            <div key={idx} style={{ background: '#000', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                                <img src={s.image} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                                {idx === 2 && session.screenshots.length > 3 && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', fontSize: '0.7rem', fontWeight: 800 }}>
                                        +{session.screenshots.length - 3}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.7rem' }}>
                        <span className="text-primary">{session.screenshots.length} CAPTURES</span>
                        <ChevronRight size={14} className="text-muted" />
                    </div>
                </motion.div>
            ))}

            <AnimatePresence>
                {selectedSession && (
                    <div className="modal-overlay" onClick={() => setSelectedSession(null)} style={{ background: 'rgba(0,0,0,0.9)', zIndex: 1000 }}>
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="glass-panel"
                            style={{ position: 'absolute', top: 0, right: 0, width: '100%', maxWidth: '900px', height: '100vh', overflowY: 'auto', borderRadius: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--background)', zIndex: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div className="badge bg-primary" style={{ marginBottom: '0.75rem' }}>SESSION_INTEL_ARCHIVE</div>
                                        <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{selectedSession.name}</h2>
                                        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            <span>{new Date(selectedSession.date).toLocaleDateString()}</span>
                                            <span>{selectedSession.startTime} - {selectedSession.endTime}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedSession(null)} className="icon-btn-secondary" style={{ width: '48px', height: '48px' }}><X size={24} /></button>
                                </div>
                            </div>

                            <div style={{ padding: '2rem' }}>
                                {selectedSession.notes && (
                                    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                        <h4 style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.1em' }}>STRATEGIC_NOTES</h4>
                                        <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.9rem' }}>{selectedSession.notes}</p>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                                    {selectedSession.screenshots.map((s, idx) => (
                                        <div key={idx} className="glass-panel" style={{ padding: '0.5rem', overflow: 'hidden' }}>
                                            <div style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{s.asset} <span className="text-primary">{s.timeframe}</span></span>
                                                <Maximize2 size={12} className="text-muted" style={{ cursor: 'pointer' }} onClick={() => setZoomImage(s.image)} />
                                            </div>
                                            <div 
                                                style={{ aspectRatio: '16/9', background: '#000', borderRadius: '4px', overflow: 'hidden', cursor: 'zoom-in' }}
                                                onClick={() => setZoomImage(s.image)}
                                            >
                                                <img src={s.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {zoomImage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        style={{ zIndex: 9999, background: 'rgba(0,0,0,0.95)' }}
                        onClick={() => setZoomImage(null)}
                    >
                        <button onClick={() => setZoomImage(null)} style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={32} /></button>
                        <motion.img 
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            src={zoomImage} 
                            style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
