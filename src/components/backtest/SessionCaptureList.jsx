import { useState, useEffect, useMemo } from 'react';

import { Camera, Calendar, Clock, Trash2, Maximize2, X, ChevronRight, LayoutGrid, Eye, TrendingUp, BarChart3 } from 'lucide-react';
import { getSessionCaptures, deleteSessionCapture } from '../../utils/db';
import { useAuth } from '../../context/AuthContext';

export default function SessionCaptureList({ onEmpty, onStatsUpdate }) {
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
        try {
            const data = await getSessionCaptures(currentUser.uid);
            setCaptures(data);
            
            // Calculate stats for parent
            const thisWeek = data.filter(c => {
                const date = new Date(c.date);
                const firstDay = new Date();
                firstDay.setDate(firstDay.getDate() - firstDay.getDay());
                return date >= firstDay;
            }).length;

            if (onStatsUpdate) {
                onStatsUpdate({
                    total: data.length,
                    thisWeek: thisWeek
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (confirm('Permanently delete this session capture?')) {
            await deleteSessionCapture(id);
            fetchCaptures();
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Grouping by date string
    const groupedCaptures = useMemo(() => {
        const groups = {};
        [...captures]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .forEach(c => {
            const dateLabel = formatDate(c.date);
            if (!groups[dateLabel]) groups[dateLabel] = [];
            groups[dateLabel].push(c);
        });
        return Object.entries(groups);
    }, [captures]);

    if (loading) return (
        <div style={{ padding: '8rem 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
            <div className="spinner-large" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.2em', fontWeight: 600 }}>SYNCHRONIZING_VISUAL_ARCHIVE...</span>
        </div>
    );

    if (captures.length === 0) {
        return onEmpty ? onEmpty() : (
            <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)' }}>
                <Camera size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>NO_SESSIONS_CAPTURED</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Start documenting your sessions with multi-timeframe visual records.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '4rem' }}>
            {groupedCaptures.map(([dateLabel, items]) => (
                <div key={dateLabel}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ 
                            fontSize: '0.9rem', 
                            color: 'var(--primary)', 
                            fontWeight: 900, 
                            letterSpacing: '0.1em',
                            background: 'rgba(0, 240, 255, 0.05)',
                            padding: '0.4rem 1.25rem',
                            borderRadius: '4px',
                            border: '1px solid rgba(0, 240, 255, 0.1)'
                        }}>
                           {dateLabel.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(0, 240, 255, 0.1), transparent)' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {items.map(session => (
                            <div
                                key={session.id}
                                className="session-card glass-panel"
                                style={{ 
                                    cursor: 'pointer', 
                                    border: '1px solid var(--border)',
                                    background: 'rgba(255,255,255,0.01)',
                                    display: 'flex',
                                    padding: '1rem',
                                    gap: '1.5rem',
                                    alignItems: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => setSelectedSession(session)}
                            >
                                {/* Time & Basic Info */}
                                <div style={{ width: '150px' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                                        {session.startTime} — {session.endTime}
                                    </div>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 600 }}>SESSION_DURATION</div>
                                </div>

                                {/* Assets */}
                                <div style={{ flex: 1, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {session.assets.map(a => (
                                        <span key={a} className="badge bg-muted" style={{ fontSize: '0.6rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            {a}
                                        </span>
                                    ))}
                                </div>

                                {/* Thumbnail Preview */}
                                <div style={{ width: '120px', height: '60px', borderRadius: '4px', overflow: 'hidden', background: '#000', border: '1px solid var(--border)' }}>
                                    {session.screenshots[0] && (
                                        <img src={session.screenshots[0].image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )}
                                </div>

                                {/* Stats & Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--primary)' }}>{session.screenshots.length}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>CAPTURES</div>
                                    </div>
                                    <button 
                                        onClick={(e) => handleDelete(e, session.id)} 
                                        className="icon-btn hover-danger" 
                                        style={{ background: 'rgba(255,50,50,0.05)', border: 'none' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

                {selectedSession && (
                    <div className="modal-overlay" onClick={() => setSelectedSession(null)} style={{ background: 'rgba(0,0,0,0.95)', zIndex: 1000 }}>
                        <div 
                            className="glass-panel"
                            style={{ 
                                position: 'absolute', top: 0, right: 0, width: '100%', maxWidth: '1000px', 
                                height: '100vh', overflowY: 'auto', borderRadius: 0, borderLeft: '1px solid var(--primary)33' 
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Detail Header */}
                            <div style={{ padding: '2.5rem', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                            <div className="badge bg-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.6rem', color: '#000' }}>ARCHIVE_REF_{selectedSession.id.slice(-4)}</div>
                                            {selectedSession.name && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>— {selectedSession.name}</span>}
                                        </div>
                                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>{formatDate(selectedSession.date)}</h2>
                                        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Clock size={16} className="text-primary" /> {selectedSession.startTime} — {selectedSession.endTime}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <BarChart3 size={16} className="text-secondary" /> {selectedSession.screenshots.length} DATA_POINTS
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedSession(null)} className="icon-btn-secondary" style={{ width: '56px', height: '56px', borderRadius: '12px' }}>
                                        <X size={28} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ padding: '2.5rem' }}>
                                {selectedSession.notes && (
                                    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '3rem', background: 'rgba(255,255,255,0.01)', borderLeft: '4px solid var(--primary)' }}>
                                        <h4 style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 900, letterSpacing: '0.15em' }}>SESSION_INTEL_REPORT</h4>
                                        <p style={{ margin: 0, lineHeight: 1.8, fontSize: '1rem', color: 'rgba(255,255,255,0.8)' }}>{selectedSession.notes}</p>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '2rem' }}>
                                    {selectedSession.screenshots.map((s, idx) => (
                                        <div 
                                            key={idx} 
                                            className="glass-panel" 
                                            style={{ padding: '0.75rem', overflow: 'hidden', background: 'rgba(255,255,255,0.01)' }}
                                        >
                                            <div style={{ padding: '0.75rem', fontSize: '0.85rem', fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span className="text-primary" style={{ fontSize: '0.65rem', border: '1px solid var(--primary)33', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>{idx + 1}</span>
                                                    <span>{s.asset} / <span className="text-primary">{s.timeframe}</span></span>
                                                </div>
                                                <Maximize2 size={16} className="text-muted" style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setZoomImage(s.image)} />
                                            </div>
                                            <div 
                                                style={{ aspectRatio: '16/9', background: '#000', borderRadius: '6px', overflow: 'hidden', cursor: 'zoom-in', border: '1px solid rgba(255,255,255,0.05)' }}
                                                onClick={() => setZoomImage(s.image)}
                                            >
                                                <img src={s.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {zoomImage && (
                    <div 
                        className="modal-overlay"
                        style={{ zIndex: 9999, background: 'rgba(0,0,0,0.98)' }}
                        onClick={() => setZoomImage(null)}
                    >
                        <button onClick={() => setZoomImage(null)} style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: '1rem', borderRadius: '50%' }}>
                            <X size={32} />
                        </button>
                        <img 
                            src={zoomImage} 
                            style={{ maxWidth: '98vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }} 
                        />
                    </div>
                )}

            <style>{`
                .session-card:hover .card-actions-overlay {
                    opacity: 1;
                }
                .card-actions-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: all 0.3s ease;
                }
                .spinner-large {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(0, 240, 255, 0.1);
                    border-top-color: var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
