import { useState, useEffect } from 'react';
import { getTrades, getUserProfile } from '../utils/db';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Maximize2, Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VisualCards() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, profit, loss
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStrategy, setSelectedStrategy] = useState('all');

  useEffect(() => {
    if (currentUser) {
      loadVisuals();
    } else {
      navigate('/');
    }
  }, [currentUser]);

  const loadVisuals = async () => {
    setLoading(true);
    const profile = await getUserProfile(currentUser.uid);
    const data = await getTrades(profile?.activeJournalId || currentUser.uid);
    setTrades(data.filter(t => t.image));
    setLoading(false);
  };

  // Extract unique options for dropdowns
  const uniqueAssets = [...new Set(trades.map(t => t.pair))].sort();
  const uniqueGrades = [...new Set(trades.map(t => (t.quality || 'B').toUpperCase()))].sort();
  const uniqueStrategies = [...new Set(trades.map(t => t.strategy || 'RAW_ACTION'))].sort();

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
      if (sortBy === 'asset') return a.pair.localeCompare(b.pair);
      if (sortBy === 'strategy') return (a.strategy || '').localeCompare(b.strategy || '');
      if (sortBy === 'grade') return (a.quality || 'B').localeCompare(b.quality || 'B');
      return new Date(b.date) - new Date(a.date);
    });

  if (loading) return <div className="page-container loading">INITIALIZING_VISUAL_TERMINAL...</div>;

  return (
    <div className="page-container" style={{ maxWidth: '1200px' }}>
      <header className="header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <button onClick={() => navigate(-1)} className="icon-btn">
             <ArrowLeft size={24} />
           </button>
           <h1 style={{ margin: 0 }}>Visual Intelligence</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
           <button 
             onClick={() => setFilter('all')} 
             className={`badge ${filter === 'all' ? 'bg-primary' : 'bg-muted'}`}
             style={{ cursor: 'pointer', border: 'none', padding: '0.4rem 1rem' }}
           >ALL</button>
           <button 
             onClick={() => setFilter('profit')} 
             className={`badge ${filter === 'profit' ? 'bg-success' : 'bg-muted'}`}
             style={{ cursor: 'pointer', border: 'none', padding: '0.4rem 1rem' }}
           >WINS</button>
           <button 
             onClick={() => setFilter('loss')} 
             className={`badge ${filter === 'loss' ? 'bg-danger' : 'bg-muted'}`}
             style={{ cursor: 'pointer', border: 'none', padding: '0.4rem 1rem' }}
           >LOSSES</button>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '200px' }}>
           <Search size={18} className="text-muted" />
           <input 
             type="text" 
             placeholder="Search session visuals..." 
             className="input" 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             style={{ background: 'transparent', border: 'none', flex: 1, outline: 'none' }}
           />
         </div>
         
         <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
           {/* Asset Filter */}
           <select 
             className="badge bg-muted" 
             value={selectedAsset} 
             onChange={(e) => setSelectedAsset(e.target.value)}
             style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', outline: 'none', padding: '0.4rem' }}
           >
             <option value="all">ALL_ASSETS</option>
             {uniqueAssets.map(asset => <option key={asset} value={asset}>{asset}</option>)}
           </select>

           {/* Grade Filter */}
           <select 
             className="badge bg-muted" 
             value={selectedGrade} 
             onChange={(e) => setSelectedGrade(e.target.value)}
             style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', outline: 'none', padding: '0.4rem' }}
           >
             <option value="all">ALL_GRADES</option>
             {uniqueGrades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
           </select>

           {/* Strategy Filter */}
           <select 
             className="badge bg-muted" 
             value={selectedStrategy} 
             onChange={(e) => setSelectedStrategy(e.target.value)}
             style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', outline: 'none', padding: '0.4rem' }}
           >
             <option value="all">ALL_STRATEGIES</option>
             {uniqueStrategies.map(strat => <option key={strat} value={strat}>{strat}</option>)}
           </select>

           {/* Sort Option */}
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem', borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
             <Filter size={14} className="text-primary" />
             <select 
               className="badge bg-muted" 
               value={sortBy} 
               onChange={(e) => setSortBy(e.target.value)}
               style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', outline: 'none', fontSize: '0.65rem' }}
             >
               <option value="date">SORT: DATE</option>
               <option value="pnl">SORT: P/L</option>
             </select>
           </div>
         </div>
      </div>

      {filteredAndSortedTrades.length === 0 ? (
        <div className="empty-state" style={{ padding: '6rem 2rem' }}>
           <ImageIcon size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
           <p style={{ color: 'var(--text-muted)' }}>No visual evidence found for this query.</p>
           <button onClick={() => navigate('/add')} className="btn-outline" style={{ marginTop: '1rem' }}>UPLOAD_FIRST_CARD</button>
        </div>
      ) : (
        <div className="visual-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '1.5rem' 
        }}>
          <AnimatePresence>
            {filteredAndSortedTrades.map((trade, idx) => (
              <motion.div
                key={trade.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                onClick={() => navigate(`/trade/${trade.id}`)}
                className="glass-panel visual-card"
                style={{ 
                  padding: '0.75rem', 
                  cursor: 'pointer', 
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  position: 'relative'
                }}
              >
                {/* Tactical Header Overlay */}
                <div style={{ 
                  position: 'absolute', top: '1.25rem', left: '1.25rem', right: '1.25rem', zIndex: 10,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  pointerEvents: 'none'
                }}>
                   <div className="badge bg-primary" style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                      {trade.pair}
                   </div>
                   <div className={Number(trade.pnl) >= 0 ? "glow-text-success" : "glow-text-danger"} style={{ fontWeight: 800, fontSize: '0.8rem', textShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
                      {Number(trade.pnl) >= 0 ? '▲' : '▼'} ${Math.abs(Number(trade.pnl)).toFixed(2)}
                   </div>
                </div>

                {/* Main Visual Image */}
                <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#000', marginBottom: '0.75rem', aspectRatio: '16/9' }}>
                   <img 
                     src={trade.image} 
                     alt={trade.pair} 
                     style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} 
                   />
                </div>

                {/* Footer Metadata */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(trade.date).toLocaleDateString()} | {trade.strategy || 'RAW_ACTION'}
                   </div>
                   <button className="icon-btn" style={{ padding: '0.4rem' }}>
                      <Maximize2 size={14} />
                   </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
