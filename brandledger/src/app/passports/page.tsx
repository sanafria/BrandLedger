'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield, CheckCircle2, AlertTriangle, RefreshCw, XCircle,
  Calendar, User, Link2, Clock, Eye, X, ChevronRight, FileText
} from 'lucide-react';
import { ContentPassport, PassportStatus } from '../data/store';

const statusConfig: Record<PassportStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  valid: { label: 'Valid', color: 'var(--color-forest-700)', bg: '#E8F5E9', icon: <CheckCircle2 size={16} /> },
  revalidation_required: { label: 'Revalidation Required', color: 'var(--color-terracotta-500)', bg: '#FFF3E0', icon: <RefreshCw size={16} /> },
  revoked: { label: 'Revoked', color: '#C62828', bg: '#FFEBEE', icon: <XCircle size={16} /> },
};

export default function PassportsPage() {
  const { passports, revokePassport, policyCards } = useApp();
  const [selectedPassport, setSelectedPassport] = useState<ContentPassport | null>(null);
  const [filter, setFilter] = useState<PassportStatus | 'all'>('all');

  const filtered = passports.filter(p => filter === 'all' || p.status === filter);

  const validCount = passports.filter(p => p.status === 'valid').length;
  const revalCount = passports.filter(p => p.status === 'revalidation_required').length;
  const revokedCount = passports.filter(p => p.status === 'revoked').length;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>Content Passports</h1>
        <p style={{ color: 'var(--color-charcoal-400)', fontSize: 14 }}>
          Digital audit trails of what was checked, what was found, and who approved.
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <SummaryCard
          label="Valid"
          count={validCount}
          color="var(--color-forest-700)"
          bg="#E8F5E9"
          icon={<CheckCircle2 size={20} />}
          onClick={() => setFilter(filter === 'valid' ? 'all' : 'valid')}
          active={filter === 'valid'}
        />
        <SummaryCard
          label="Revalidation Needed"
          count={revalCount}
          color="var(--color-terracotta-500)"
          bg="#FFF3E0"
          icon={<RefreshCw size={20} />}
          onClick={() => setFilter(filter === 'revalidation_required' ? 'all' : 'revalidation_required')}
          active={filter === 'revalidation_required'}
        />
        <SummaryCard
          label="Revoked"
          count={revokedCount}
          color="#C62828"
          bg="#FFEBEE"
          icon={<XCircle size={20} />}
          onClick={() => setFilter(filter === 'revoked' ? 'all' : 'revoked')}
          active={filter === 'revoked'}
        />
      </div>

      {/* Passport List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="stagger">
        {filtered.map(passport => {
          const sc = statusConfig[passport.status];
          return (
            <div
              key={passport.id}
              className="card"
              style={{ padding: 20, cursor: 'pointer' }}
              onClick={() => setSelectedPassport(passport)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 14, flex: 1 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: sc.bg, color: sc.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Shield size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-charcoal-800)' }}>
                        {passport.id}
                      </span>
                      <span
                        className="badge"
                        style={{ background: sc.bg, color: sc.color }}
                      >
                        {sc.icon} {sc.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--color-charcoal-600)', marginTop: 2 }}>
                      {passport.contentTitle}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: 'var(--color-charcoal-400)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User size={12} /> {passport.approvedBy}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} /> {new Date(passport.approvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Link2 size={12} /> {passport.dependencies.length} linked cards
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} /> {passport.findingsResolved} resolved
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--color-charcoal-400)', flexShrink: 0 }} />
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card-flat" style={{ padding: 40, textAlign: 'center', color: 'var(--color-charcoal-400)' }}>
            <Shield size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
            <p>No passports match this filter.</p>
          </div>
        )}
      </div>

      {/* Passport Detail Modal */}
      {selectedPassport && (
        <PassportModal
          passport={selectedPassport}
          policyCards={policyCards}
          onClose={() => setSelectedPassport(null)}
          onRevoke={(id) => { revokePassport(id); setSelectedPassport(null); }}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, count, color, bg, icon, onClick, active }: {
  label: string; count: number; color: string; bg: string; icon: React.ReactNode;
  onClick: () => void; active: boolean;
}) {
  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        padding: 20, cursor: 'pointer',
        border: active ? `2px solid ${color}` : '1px solid var(--color-warm-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-500)' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-charcoal-800)', fontFamily: 'var(--font-heading)' }}>
        {count}
      </div>
    </div>
  );
}

function PassportModal({ passport, policyCards, onClose, onRevoke }: {
  passport: ContentPassport;
  policyCards: import('../data/store').PolicyCard[];
  onClose: () => void;
  onRevoke: (id: string) => void;
}) {
  const sc = statusConfig[passport.status];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 0, maxWidth: 640 }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px', borderBottom: '1px solid var(--color-warm-border)',
          background: sc.bg,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Shield size={28} style={{ color: sc.color }} />
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, color: 'var(--color-charcoal-800)' }}>
                  Content Passport
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-charcoal-500)' }}>
                  {passport.id}
                </div>
              </div>
            </div>
            <button className="btn-ghost" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div style={{ padding: 28 }}>
          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span className="badge" style={{ background: sc.bg, color: sc.color, fontSize: 13, padding: '6px 14px' }}>
              {sc.icon} {sc.label}
            </span>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <DetailItem label="Content" value={passport.contentTitle} />
            <DetailItem label="Content ID" value={passport.contentId} />
            <DetailItem label="Approved By" value={passport.approvedBy} />
            <DetailItem label="Approved At" value={new Date(passport.approvedAt).toLocaleString()} />
            <DetailItem label="Findings Resolved" value={String(passport.findingsResolved)} />
            <DetailItem label="Findings Dismissed" value={String(passport.findingsDismissed)} />
          </div>

          {/* Dependencies */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-charcoal-400)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em' }}>
              Policy Card Dependencies ({passport.dependencies.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {passport.dependencies.map(dep => {
                const card = policyCards.find(c => c.id === dep.cardId);
                const isChanged = card && card.version > dep.version;
                return (
                  <div
                    key={dep.cardId}
                    style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: isChanged ? '#FFF3E0' : 'var(--color-cream-50)',
                      border: `1px solid ${isChanged ? '#FFE0B2' : 'var(--color-cream-300)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-700)' }}>
                        {dep.cardTitle}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-charcoal-400)', marginTop: 2 }}>
                        {dep.cardId} · Approved at v{dep.version}
                        {isChanged && ` → Now v${card.version}`}
                      </div>
                    </div>
                    {isChanged ? (
                      <span className="badge badge-warning" style={{ fontSize: 10 }}>
                        <AlertTriangle size={10} /> Changed
                      </span>
                    ) : (
                      <span className="badge badge-success" style={{ fontSize: 10 }}>
                        <CheckCircle2 size={10} /> Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-charcoal-400)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em' }}>
              Passport Timeline
            </div>
            <div style={{ borderLeft: '2px solid var(--color-cream-300)', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <TimelineEntry
                icon={<FileText size={12} />}
                title="Content Submitted"
                time={passport.approvedAt}
                color="var(--color-charcoal-400)"
              />
              <TimelineEntry
                icon={<Eye size={12} />}
                title="Scan Completed"
                time={passport.approvedAt}
                color="var(--color-amber-500)"
              />
              {passport.findingsResolved > 0 && (
                <TimelineEntry
                  icon={<CheckCircle2 size={12} />}
                  title={`${passport.findingsResolved} findings resolved`}
                  time={passport.approvedAt}
                  color="var(--color-sage-500)"
                />
              )}
              <TimelineEntry
                icon={<Shield size={12} />}
                title={`Approved by ${passport.approvedBy}`}
                time={passport.approvedAt}
                color="var(--color-forest-600)"
              />
              <TimelineEntry
                icon={<Shield size={12} />}
                title="Passport Issued"
                time={passport.approvedAt}
                color="var(--color-forest-700)"
              />
              {passport.status === 'revalidation_required' && (
                <TimelineEntry
                  icon={<RefreshCw size={12} />}
                  title="Revalidation Required — linked card updated"
                  time={new Date().toISOString()}
                  color="var(--color-terracotta-500)"
                />
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {passport.status === 'valid' && (
          <div style={{ padding: '16px 28px', borderTop: '1px solid var(--color-warm-border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-danger" onClick={() => onRevoke(passport.id)}>
              <XCircle size={14} /> Revoke Passport
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-charcoal-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--color-charcoal-700)', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function TimelineEntry({ icon, title, time, color }: { icon: React.ReactNode; title: string; time: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
      <div style={{
        position: 'absolute', left: -23,
        width: 14, height: 14, borderRadius: '50%',
        background: 'white', border: `2px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-700)' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--color-charcoal-400)' }}>
          {new Date(time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
