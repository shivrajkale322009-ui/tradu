import { useState, useEffect } from 'react';
import { getTrades, getUserProfile, deleteTrade } from '../utils/db';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Image as ImageIcon, Maximize2, Search, 
  Filter, TrendingUp, TrendingDown, Trash2, Share2, 
  X, ChevronRight, LayoutGrid, Calendar
} from 'lucide-react';


export default function VisualCards() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStrategy, setSelectedStrategy] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [userPrefs, setUserPrefs] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Predefined professional strategies as fallback
  const PREDEFINED_STRATEGIES = [
    'EMA Cross', 'RSI Overbought/Oversold', 'Breakout Phase', 
    'Mean Reversion', 'Trend Reversal', 'Fibonacci Retracement',
    'Order Block', 'Liquidity Sweep'
  ];

  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    } else {
      navigate('/');
    }
  }, [currentUser]);

  const loadInitialData = async () => {
    setLoading(true);
    const profile = await getUserProfile(currentUser.uid);
    setUserPrefs(profile);
    
    // Apply defaults from terminal profile if they exist
    if (profile?.favouritePair) setSelectedAsset(profile.favouritePair);
    if (profile?.favouriteStrategy) setSelectedStrategy(profile.favouriteStrategy);

    const data = await getTrades(profile?.activeJournalId || currentUser.uid);
    setTrades(data.filter(t => t.image));
    setLoading(false);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm('Delete this visual record?')) {
      await deleteTrade(id);
      setTrades(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleShare = (e, trade) => {
      e.stopPropagation();
      navigator.clipboard.writeText(window.location.origin + `/trade/${trade.id}`);
      alert('Link copied to clipboard!');
  };

  const uniqueAssets = [...new Set(trades.map(t => t.pair))].sort();
  const tradeStrategies = trades.map(t => t.strategy || 'RAW_ACTION');
  const uniqueStrategies = [...new Set([...PREDEFINED_STRATEGIES, ...tradeStrategies])].sort();
  const uniqueGrades = [...new Set(trades.map(t => (t.quality || 'B').toUpperCase()))].sort();

  const handleSyncPreference = async (type, value) => {
      if (!isSyncing || value === 'all') return;
      const updateData = {};
      if (type === 'asset') updateData.favouritePair = value;
      if (type === 'strategy') updateData.favouriteStrategy = value;
      
      await updateUserProfile(currentUser.uid, updateData);
  };

  const useTerminalDefaults = () => {
      if (userPrefs?.favouritePair) setSelectedAsset(userPrefs.favouritePair);
      if (userPrefs?.favouriteStrategy) setSelectedStrategy(userPrefs.favouriteStrategy);
  };

  const clearFilters = () => {
      setSelectedAsset('all');
      setSelectedStrategy('all');
      setSelectedGrade('all');
      setFilter('all');
      setSearchTerm('');
  };

  const filteredAndSortedTrades = trades
    .filter(t => {
      const matchesSearch = t.pair.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.strategy?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'all' || 
                           (filter === 'profit' && Number(t.pnl) >= 0) || 
                           (filter === 'loss' && Number(t.pnl) < 0);
      
      const matchesAsset = selectedAsset === 'all' || t.pair === selectedAsset;
      const matchesGrade = selectedGrade === 'all' || (t.quality || 'B').toUpperCase() === selectedGrade;
      const matchesStrategy = selectedStrategy === 'all' || (t.strategy || 'RAW_ACTION') === selectedStrategy;

      return matchesSearch && matchesFilter && matchesAsset && matchesGrade && matchesStrategy;
    })
    .sort((a, b) => {
      if (sortBy === 'pnl') return Number(b.pnl) - Number(a.pnl);
      return new Date(b.date) - new Date(a.date);
    });

  const SkeletonCard = () => (
    <div className="glass-panel" style={{ padding: '0.5rem', height: '220px' }}>
      <div className="skeleton" style={{ width: '100%', height: '140px', borderRadius: '4px', marginBottom: '0.5rem' }} />
      <div className="skeleton" style={{ width: '60%', height: '12px', borderRadius: '2px', marginBottom: '0.4rem' }} />
      <div className="skeleton" style={{ width: '40%', height: '10px', borderRadius: '2px' }} />
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: '1400px' }}>
      {/* Header Bar */}
      <header style={{ 
        marginBottom: '1rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
           <button onClick={() => navigate(-1)} className="visual-action-btn">
             <ArrowLeft size={16} />
           </button>
           <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>VISUAL_INTELLIGENCE</h1>
           <div className="badge" style={{ padding: '0.15rem 0.5rem', border: '1px solid var(--primary)' }}>
              {filteredAndSortedTrades.length} RECORDS
           </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
           <button onClick={() => setFilter('all')} className={filter === 'all' ? 'badge bg-primary' : 'badge bg-muted'}>ALL</button>
           <button onClick={() => setFilter('profit')} className={filter === 'profit' ? 'badge bg-success' : 'badge bg-muted'}>WINS</button>
           <button onClick={() => setFilter('loss')} className={filter === 'loss' ? 'badge bg-danger' : 'badge bg-muted'}>LOSS</button>
        </div>
      </header>

      {/* COMPACT_FILTER_BAR */}
      <div className="compact-bar" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 1 240px', minWidth: '150px' }}>
          <Search size={14} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search records..." 
            className="input" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', height: 'auto', background: 'transparent', border: 'none' }}
          />
        </div>

        <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flex: 1 }}>
            <select className="pill-select" value={selectedAsset} onChange={e => { setSelectedAsset(e.target.value); handleSyncPreference('asset', e.target.value); }}>
                <option value="all">SYMBOL: ALL</option>
                {uniqueAssets.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select className="pill-select" value={selectedStrategy} onChange={e => { setSelectedStrategy(e.target.value); handleSyncPreference('strategy', e.target.value); }}>
                <option value="all">STRATEGY: ALL</option>
                {uniqueStrategies.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="pill-select" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)}>
                <option value="all">GRADE: ALL</option>
                {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select className="pill-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="date">SORT: DATE</option>
                <option value="pnl">SORT: P/L</option>
            </select>
        </div>
      </div>

      {/* Active Filter Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {selectedAsset !== 'all' && (
              <div className="badge bg-primary" style={{ gap: '0.5rem' }}>
                  {selectedAsset} <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedAsset('all')} />
              </div>
          )}
          {selectedStrategy !== 'all' && (
              <div className="badge bg-primary" style={{ gap: '0.5rem' }}>
                  {selectedStrategy} <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedStrategy('all')} />
              </div>
          )}
          {selectedGrade !== 'all' && (
              <div className="badge bg-primary" style={{ gap: '0.5rem' }}>
                  GRADE: {selectedGrade} <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedGrade('all')} />
              </div>
          )}
          {(selectedAsset !== 'all' || selectedStrategy !== 'all' || selectedGrade !== 'all') && (
              <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.65rem', cursor: 'pointer', padding: '0 0.5rem' }}>
                  RESET_ALL
              </button>
          )}
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="badge" style={{ cursor: 'pointer', borderColor: isSyncing ? 'var(--primary)' : 'var(--border)' }}>
                <input type="checkbox" checked={isSyncing} onChange={e => setIsSyncing(e.target.checked)} style={{ marginRight: '0.4rem' }} />
                SYNC_TO_TERMINAL
            </label>
            <button onClick={useTerminalDefaults} className="btn-outline" style={{ fontSize: '0.6rem', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                RECALL_DEFAULTS
            </button>
          </div>
      </div>

      {loading ? (
        <div className="visual-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {[1,2,3,4,5,6,7,8].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filteredAndSortedTrades.length === 0 ? (
        <div className="glass-panel" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
           <ImageIcon size={32} style={{ opacity: 0.1, marginBottom: '1rem' }} />
           <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>NO_VISUALS_FOR_SELECTED_PARAMETERS</p>
           <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.5rem' }}>Adjust your filters or return to your terminal defaults.</p>
           <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button onClick={clearFilters} className="btn-primary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.75rem' }}>CLEAR_FILTERS</button>
                <button onClick={useTerminalDefaults} className="btn-outline" style={{ padding: '0.5rem 1.5rem', fontSize: '0.75rem' }}>USE_PROFILE_TARGETS</button>
           </div>
        </div>
      ) : (
        <div className="visual-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
          gap: '1rem' 
        }}>
            {filteredAndSortedTrades.map((trade, idx) => (
              <div
                key={trade.id}
                onClick={() => setSelectedImage(trade.image)}
                className="glass-panel visual-card"
                style={{ 
                  padding: '0.5rem', 
                  cursor: 'pointer', 
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                {/* Image Wrap */}
                <div style={{ borderRadius: '0.25rem', overflow: 'hidden', background: '#000', marginBottom: '0.5rem', aspectRatio: '16/10', position: 'relative' }}>
                   <img 
                     src={trade.image} 
                     alt={trade.pair} 
                     loading="lazy"
                     style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                   />
                   
                   {/* Pnl Pill Top Right */}
                   <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                      <div className={Number(trade.pnl) >= 0 ? "badge bg-success" : "badge bg-danger"} style={{ fontSize: '0.55rem', padding: '0.1rem 0.4rem', borderRadius: '2px', backdropFilter: 'blur(4px)' }}>
                        {Number(trade.pnl) >= 0 ? '+' : ''}{Number(trade.pnl).toFixed(1)}
                      </div>
                   </div>

                   {/* Quick Action Overlay */}
                   <div className="visual-action-overlay">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedImage(trade.image); }} className="visual-action-btn"><Maximize2 size={14} /></button>
                      <button onClick={(e) => handleShare(e, trade)} className="visual-action-btn"><Share2 size={14} /></button>
                      <button onClick={(e) => handleDelete(e, trade.id)} className="visual-action-btn danger"><Trash2 size={14} /></button>
                   </div>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.1rem' }}>
                   <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {trade.pair} <span style={{ opacity: 0.3, fontWeight: 400 }}>|</span> <span className="text-primary" style={{ fontSize: '0.6rem' }}>{(trade.quality || 'B').toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            {new Date(trade.date).toLocaleDateString()} • {trade.strategy || 'RAW'}
                        </div>
                   </div>
                   <ChevronRight size={12} className="text-muted" style={{ opacity: 0.5 }} />
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Fullscreen Overlay */}
      {selectedImage && (
            <div 
                className="modal-overlay"
                style={{ zIndex: 9999, background: 'rgba(0,0,0,0.95)' }}
                onClick={() => setSelectedImage(null)}
            >
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10000 }}>
                    <button onClick={() => setSelectedImage(null)} className="icon-btn-secondary" style={{ width: '40px', height: '40px' }}><X size={24} /></button>
                </div>
                <img 
                    src={selectedImage} 
                    style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '0.5rem', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }} 
                />
            </div>
        )}
    </div>
  );
}
