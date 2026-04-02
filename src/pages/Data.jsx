import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Plus, List, Clock, Hash, Tag, FileText } from 'lucide-react';

const Data = () => {
  // 👉 FEATURE 2: Store Trades (DATASET ONLY)
  // Single source of truth (Local in-memory array)
  const [trades, setTrades] = useState([]);
  
  // 👉 FEATURE 1: Add Trade Form State
  const [formData, setFormData] = useState({
    pair: '',
    datetime: '',
    entry: '',
    sl: '',
    tp: '',
    notes: ''
  });

  const handleAddTrade = (e) => {
    e.preventDefault();
    if (!formData.pair || !formData.datetime) return;

    const newTrade = {
      id: Date.now(), // 👉 FEATURE 2: unique id
      ...formData
    };

    setTrades([...trades, newTrade]);
    setFormData({
      pair: '',
      datetime: '',
      entry: '',
      sl: '',
      tp: '',
      notes: ''
    });
  };

  // 👉 🔢 TRADE NUMBER LOGIC (IMPORTANT)
  // 1. Take trades from Data section
  // 2. Sort by datetime (ascending: oldest → newest)
  // 3. Assign number dynamically
  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  }, [trades]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'monospace', color: '#fff', background: '#0a0a0a', minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', margin: 0 }}>
          <Database size={24} color="#00f3ff" /> DATA_COLLECTION_SYSTEM (CORE_V1)
        </h1>
        <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.5rem' }}>👉 Step 1: In-Memory Datetime-Based Indexing</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
        {/* 👉 FEATURE 1: Add Trade Form */}
        <section className="glass-panel" style={{ background: '#111', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333' }}>
          <h2 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: '#00f3ff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> ADD_NEW_SESSION
          </h2>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleAddTrade} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '0.4rem' }}>PAIR (e.g. BTC/USDT)</label>
              <input 
                type="text" required 
                value={formData.pair} 
                onChange={(e) => setFormData({...formData, pair: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', background: '#000', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '0.4rem' }}>DATE & TIME</label>
              <input 
                type="datetime-local" required 
                value={formData.datetime} 
                onChange={(e) => setFormData({...formData, datetime: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', background: '#000', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '0.4rem' }}>ENTRY</label>
                <input 
                  type="number" step="any" required 
                  value={formData.entry} 
                  onChange={(e) => setFormData({...formData, entry: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', background: '#000', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '0.4rem' }}>STOP LOSS</label>
                <input 
                  type="number" step="any" required 
                  value={formData.sl} 
                  onChange={(e) => setFormData({...formData, sl: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', background: '#000', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '0.4rem' }}>TAKE PROFIT</label>
              <input 
                type="number" step="any" required 
                value={formData.tp} 
                onChange={(e) => setFormData({...formData, tp: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', background: '#000', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '0.4rem' }}>NOTES (OPTIONAL)</label>
              <textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', background: '#000', border: '1px solid #444', color: '#fff', borderRadius: '4px', height: '60px', resize: 'none' }}
              ></textarea>
            </div>
            <button type="submit" style={{ padding: '0.75rem', background: '#00f3ff', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 800, cursor: 'pointer', marginTop: '0.5rem' }}>
              RECORD_TRADE
            </button>
          </form>
        </section>

        {/* 👉 FEATURE 3: Trade List View */}
        <section>
          <h2 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <List size={16} /> ACTIVE_DATA_SET ({trades.length}_ENTRIES)
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #333', background: '#111' }}>
                <th style={{ padding: '1rem', color: '#888' }}>#</th>
                <th style={{ padding: '1rem' }}>PAIR</th>
                <th style={{ padding: '1rem' }}>DATE_TIME</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>ENTRY</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {sortedTrades.map((trade, index) => (
                  <motion.tr 
                    key={trade.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{ borderBottom: '1px solid #222' }}
                  >
                    {/* 👉 🔢 TRADE NUMBER LOGIC: dynamic calculation */}
                    <td style={{ padding: '1rem', color: '#00f3ff', fontWeight: 800 }}>#{String(index + 1).padStart(3, '0')}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{trade.pair.toUpperCase()}</td>
                    <td style={{ padding: '1rem', color: '#aaa', fontSize: '0.75rem' }}>
                      <Clock size={10} style={{ display: 'inline', marginRight: '4px' }} />
                      {new Date(trade.datetime).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>${trade.entry}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {trades.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#444' }}>
                    --- NO_RECORDS_INITIALIZED ---
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default Data;
