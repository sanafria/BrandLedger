'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus, Search, Filter, Tag, Calendar, AlertTriangle,
  CheckCircle2, Archive, Edit3, X, ChevronDown, Clock, FileText, 
  Megaphone, Scale, Image, MessageSquare, Accessibility, Eye, Trash2
} from 'lucide-react';
import { PolicyCard, CardType, CardStatus } from '../data/store';

const typeConfig: Record<CardType, { icon: React.ReactNode; label: string; color: string }> = {
  offer: { icon: <Megaphone size={16} />, label: 'Offer', color: 'var(--color-terracotta-400)' },
  term: { icon: <MessageSquare size={16} />, label: 'Term', color: 'var(--color-forest-600)' },
  fact: { icon: <FileText size={16} />, label: 'Fact', color: 'var(--color-amber-500)' },
  claim: { icon: <Scale size={16} />, label: 'Claim', color: '#8B6914' },
  asset: { icon: <Image size={16} />, label: 'Asset', color: 'var(--color-sage-500)' },
  tone: { icon: <MessageSquare size={16} />, label: 'Tone', color: '#7B6B8A' },
  accessibility: { icon: <Accessibility size={16} />, label: 'Accessibility', color: '#5A7A8A' },
};

const statusConfig: Record<CardStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'badge-active' },
  expired: { label: 'Expired', className: 'badge-expired' },
  draft: { label: 'Draft', className: 'badge-info' },
  retired: { label: 'Retired', className: 'badge-danger' },
};

export default function PolicyCardsPage() {
  const { policyCards, addPolicyCard, updatePolicyCard, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<CardType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<CardStatus | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCard, setSelectedCard] = useState<PolicyCard | null>(null);
  const [editingCard, setEditingCard] = useState<PolicyCard | null>(null);

  const filtered = policyCards.filter(c => {
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>Policy Cards</h1>
          <p style={{ color: 'var(--color-charcoal-400)', fontSize: 14 }}>
            {policyCards.length} cards · {policyCards.filter(c => c.status === 'active').length} active
          </p>
        </div>
        {(currentUser.role === 'manager' || currentUser.role === 'admin') && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Card
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-charcoal-400)' }} />
          <input
            className="input-field"
            placeholder="Search cards by title or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <select className="select-field" style={{ width: 160 }} value={filterType} onChange={e => setFilterType(e.target.value as CardType | 'all')}>
          <option value="all">All Types</option>
          {Object.entries(typeConfig).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <select className="select-field" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value as CardStatus | 'all')}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="draft">Draft</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      {/* Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="stagger">
        {filtered.map(card => (
          <div
            key={card.id}
            className="card"
            style={{ padding: 20, cursor: 'pointer' }}
            onClick={() => setSelectedCard(card)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 14, flex: 1 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${typeConfig[card.type].color}14`,
                  color: typeConfig[card.type].color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {typeConfig[card.type].icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-charcoal-800)' }}>{card.title}</span>
                    <span className={`badge ${statusConfig[card.status].className}`}>{statusConfig[card.status].label}</span>
                    {card.severity === 'block' && (
                      <span className="badge badge-danger" style={{ fontSize: 11 }}>
                        <AlertTriangle size={10} /> Blocking
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-charcoal-400)', marginTop: 4, lineHeight: 1.5 }}>
                    {card.content.length > 140 ? card.content.slice(0, 140) + '…' : card.content}
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: 'var(--color-charcoal-400)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Tag size={12} /> {card.id}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> v{card.version}
                    </span>
                    {card.validTo && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} /> Until {new Date(card.validTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {card.tags.slice(0, 3).map(tag => (
                  <span key={tag} style={{
                    padding: '2px 8px', borderRadius: 12, fontSize: 11,
                    background: 'var(--color-cream-200)', color: 'var(--color-charcoal-500)',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card-flat" style={{ padding: 40, textAlign: 'center', color: 'var(--color-charcoal-400)' }}>
            <FileText size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
            <p>No cards match your filters.</p>
          </div>
        )}
      </div>

      {/* Create Card Modal */}
      {showCreate && (
        <CreateCardModal
          onClose={() => setShowCreate(false)}
          onSave={(card) => { addPolicyCard(card); setShowCreate(false); }}
        />
      )}

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onEdit={(card) => {
            setSelectedCard(null);
            setEditingCard(card);
          }}
          canEdit={currentUser.role === 'manager' || currentUser.role === 'admin'}
        />
      )}

      {/* Edit Card Modal */}
      {editingCard && (
        <EditCardModal
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSave={(id, updates) => { updatePolicyCard(id, updates); setEditingCard(null); }}
        />
      )}
    </div>
  );
}

function CreateCardModal({ onClose, onSave }: { onClose: () => void; onSave: (card: PolicyCard) => void }) {
  const [type, setType] = useState<CardType>('fact');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [severity, setSeverity] = useState<'block' | 'warning' | 'info'>('warning');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [tags, setTags] = useState('');

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    const card: PolicyCard = {
      id: `${type.toUpperCase()}_${String(Date.now()).slice(-4)}`,
      type,
      title: title.trim(),
      content: content.trim(),
      severity,
      status: 'active',
      version: 1,
      createdBy: 'u1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      ...(validFrom && { validFrom }),
      ...(validTo && { validTo }),
    };
    onSave(card);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-warm-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Create Policy Card</h2>
          <button className="btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-600)', marginBottom: 6, display: 'block' }}>Type</label>
            <select className="select-field" value={type} onChange={e => setType(e.target.value as CardType)}>
              {Object.entries(typeConfig).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-600)', marginBottom: 6, display: 'block' }}>Title</label>
            <input className="input-field" placeholder="e.g., 15% Holiday Promotion" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-600)', marginBottom: 6, display: 'block' }}>Content / Rule</label>
            <textarea className="input-field" rows={4} placeholder="The exact rule, fact, or requirement…" value={content} onChange={e => setContent(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-600)', marginBottom: 6, display: 'block' }}>Severity</label>
            <select className="select-field" value={severity} onChange={e => setSeverity(e.target.value as 'block' | 'warning' | 'info')}>
              <option value="block">Block Publication</option>
              <option value="warning">Warning Only</option>
              <option value="info">Informational</option>
            </select>
          </div>
          {(type === 'offer') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-600)', marginBottom: 6, display: 'block' }}>Valid From</label>
                <input className="input-field" type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-600)', marginBottom: 6, display: 'block' }}>Valid To</label>
                <input className="input-field" type="date" value={validTo} onChange={e => setValidTo(e.target.value)} />
              </div>
            </div>
          )}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-600)', marginBottom: 6, display: 'block' }}>Tags (comma-separated)</label>
            <input className="input-field" placeholder="e.g., discount, campaign, q4" value={tags} onChange={e => setTags(e.target.value)} />
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-warm-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!title.trim() || !content.trim()}>Create Card</button>
        </div>
      </div>
    </div>
  );
}

function CardDetailModal({ card, onClose, onEdit, canEdit }: { card: PolicyCard; onClose: () => void; onEdit: (card: PolicyCard) => void; canEdit: boolean }) {
  const tc = typeConfig[card.type];
  const sc = statusConfig[card.status];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-warm-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: `${tc.color}14`, color: tc.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {tc.icon}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--color-charcoal-800)' }}>{card.title}</div>
              <div style={{ fontSize: 12, color: 'var(--color-charcoal-400)' }}>{card.id} · v{card.version}</div>
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <span className={`badge ${sc.className}`}>{sc.label}</span>
            <span className="badge badge-info">{tc.label}</span>
            {card.severity === 'block' && <span className="badge badge-danger"><AlertTriangle size={10} /> Blocking</span>}
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-charcoal-400)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Rule Content</div>
            <div style={{
              padding: 16, borderRadius: 8, background: 'var(--color-cream-50)',
              border: '1px solid var(--color-cream-300)', fontSize: 14,
              lineHeight: 1.7, color: 'var(--color-charcoal-700)',
            }}>
              {card.content}
            </div>
          </div>
          {(card.validFrom || card.validTo) && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-charcoal-400)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Validity Period</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
                {card.validFrom && <span><Calendar size={14} style={{ marginRight: 4 }} />From: {new Date(card.validFrom).toLocaleDateString()}</span>}
                {card.validTo && <span><Calendar size={14} style={{ marginRight: 4 }} />To: {new Date(card.validTo).toLocaleDateString()}</span>}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {card.tags.map(tag => (
              <span key={tag} style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, background: 'var(--color-cream-200)', color: 'var(--color-charcoal-500)' }}>
                {tag}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-charcoal-400)' }}>
            Created: {new Date(card.createdAt).toLocaleString()} · Updated: {new Date(card.updatedAt).toLocaleString()}
          </div>
        </div>
        {canEdit && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-warm-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn-secondary" onClick={() => onEdit(card)}>
              <Edit3 size={14} /> Edit Card
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EditCardModal({ card, onClose, onSave }: { card: PolicyCard; onClose: () => void; onSave: (id: string, updates: Partial<PolicyCard>) => void }) {
  const [title, setTitle] = useState(card.title);
  const [content, setContent] = useState(card.content);
  const [severity, setSeverity] = useState(card.severity);
  const [status, setStatus] = useState(card.status);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-warm-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Edit: {card.id}</h2>
          <button className="btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ padding: '12px 24px 4px' }}>
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: '#FFF3E0', border: '1px solid #FFE0B2',
            fontSize: 13, color: '#E65100',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertTriangle size={16} />
            Editing this card will create a new version and may revoke passports that depend on it.
          </div>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-600)', marginBottom: 6, display: 'block' }}>Title</label>
            <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-600)', marginBottom: 6, display: 'block' }}>Content / Rule</label>
            <textarea className="input-field" rows={4} value={content} onChange={e => setContent(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-600)', marginBottom: 6, display: 'block' }}>Severity</label>
              <select className="select-field" value={severity} onChange={e => setSeverity(e.target.value as 'block' | 'warning' | 'info')}>
                <option value="block">Block Publication</option>
                <option value="warning">Warning Only</option>
                <option value="info">Informational</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-600)', marginBottom: 6, display: 'block' }}>Status</label>
              <select className="select-field" value={status} onChange={e => setStatus(e.target.value as CardStatus)}>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="draft">Draft</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-warm-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(card.id, { title, content, severity, status })}>
            Save & Create Version {card.version + 1}
          </button>
        </div>
      </div>
    </div>
  );
}
