import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Search, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageList({ title, icon: Icon, items, onAdd, onRemove, onEdit, onReorder, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  const filteredItems = items.filter(i => i.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = (e) => {
    e.preventDefault();
    if (newValue.trim()) {
      onAdd(newValue.trim());
      setNewValue('');
    }
  };

  const handleSaveEdit = (idx, oldVal) => {
    if (editValue.trim() && editValue !== oldVal) {
      onEdit(oldVal, editValue.trim());
    }
    setEditingIdx(null);
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('sourceIndex', index.toString());
  };
  
  const handleDrop = (e, targetIndex) => {
    const sourceIndex = e.dataTransfer.getData('sourceIndex');
    if (sourceIndex !== '') {
      onReorder(parseInt(sourceIndex), targetIndex);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '1rem', padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }}>
      <div 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Icon size={16} className="text-primary" />
          <h2 style={{ fontSize: '1rem', margin: 0, fontWeight: 600 }}>{title} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.25rem' }}>({items.length})</span></h2>
        </div>
        <button className="icon-btn text-muted" style={{ padding: '0.25rem' }}>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexDirection: 'row', alignItems: 'stretch' }}>
                <form onSubmit={handleAdd} style={{ display: 'flex', flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder={`Add new ${placeholder}...`}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    style={{ flex: 1, paddingRight: '4rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem', height: '34px' }}
                  />
                  <button type="submit" className="text-primary" style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Plus size={14} /> Add
                  </button>
                </form>
                
                <div style={{ position: 'relative', width: '150px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text"
                    className="input"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '0.4rem 0.5rem 0.4rem 1.75rem', fontSize: '0.85rem', height: '34px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.4rem' }}>
                {filteredItems.length === 0 ? (
                  <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center' }}>
                    {search ? 'No matches found.' : `No ${placeholder} added yet.`}
                  </div>
                ) : (
                  filteredItems.map((item, idx) => (
                    <div 
                      key={item} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, items.indexOf(item))}
                      onDrop={(e) => handleDrop(e, items.indexOf(item))}
                      onDragOver={handleDragOver}
                      style={{ 
                        display: 'flex', alignItems: 'center', padding: '0.4rem 0.5rem', 
                        backgroundColor: 'var(--surface-light)', borderRadius: '0.4rem', 
                        border: '1px solid var(--border)', transition: 'all 0.2s', gap: '0.5rem',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex' }}><GripVertical size={14} /></div>
                      
                      {editingIdx === items.indexOf(item) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1 }}>
                          <input 
                            autoFocus
                            type="text" 
                            className="input" 
                            value={editValue} 
                            onChange={(e) => setEditValue(e.target.value)} 
                            style={{ flex: 1, padding: '0.15rem 0.4rem', fontSize: '0.8rem', height: '26px' }}
                          />
                          <button onClick={() => handleSaveEdit(items.indexOf(item), item)} className="text-success hover-primary" style={{background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem'}}><Check size={14}/></button>
                          <button onClick={() => setEditingIdx(null)} className="text-muted hover-danger" style={{background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem'}}><X size={14}/></button>
                        </div>
                      ) : (
                        <>
                          <span style={{ fontSize: '0.8rem', flex: 1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
                          <div style={{ display: 'flex', gap: '0.2rem' }}>
                            <button onClick={() => { setEditingIdx(items.indexOf(item)); setEditValue(item); }} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }} className="hover-primary"><Edit2 size={12} /></button>
                            <button onClick={() => onRemove(item)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }} className="hover-danger"><Trash2 size={12} /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
