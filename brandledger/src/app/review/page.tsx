'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2, XCircle, AlertTriangle, MessageSquare, Clock,
  ChevronDown, ChevronRight, Quote, Lightbulb, X, Check,
  Edit3, ArrowRight, Shield, Eye, Filter
} from 'lucide-react';
import { ContentSubmission, Finding, ContentStatus } from '../data/store';

export default function ReviewPage() {
  const { submissions, updateSubmissionStatus, updateFindingAction, currentUser } = useApp();
  const [selectedSub, setSelectedSub] = useState<ContentSubmission | null>(null);
  const [filterStatus, setFilterStatus] = useState<ContentStatus | 'all'>('all');
  const [reviewComment, setReviewComment] = useState('');

  const filtered = submissions.filter(s => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  const handleApprove = (sub: ContentSubmission) => {
    updateSubmissionStatus(sub.id, 'approved', currentUser.id, reviewComment || 'Approved after review.');
    setSelectedSub(null);
    setReviewComment('');
  };

  const handleReject = (sub: ContentSubmission) => {
    updateSubmissionStatus(sub.id, 'rejected', currentUser.id, reviewComment || 'Rejected — please address findings.');
    setSelectedSub(null);
    setReviewComment('');
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>Review Workspace</h1>
          <p style={{ color: 'var(--color-charcoal-400)', fontSize: 14 }}>
            {submissions.filter(s => s.status === 'in-review').length} submissions awaiting review
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'in-review', 'approved', 'rejected', 'draft'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: '1px solid var(--color-warm-border)',
                background: filterStatus === status ? 'var(--color-forest-700)' : 'white',
                color: filterStatus === status ? 'white' : 'var(--color-charcoal-500)',
                cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {status === 'all' ? 'All' : status.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedSub ? '380px 1fr' : '1fr', gap: 20 }}>
        {/* Submissions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="stagger">
          {filtered.map(sub => {
            const blockCount = sub.findings.filter(f => f.severity === 'block').length;
            const warnCount = sub.findings.filter(f => f.severity === 'warning').length;
            const isSelected = selectedSub?.id === sub.id;

            return (
              <div
                key={sub.id}
                className="card"
                onClick={() => setSelectedSub(sub)}
                style={{
                  padding: 16, cursor: 'pointer',
                  borderLeft: isSelected ? '3px solid var(--color-forest-600)' : '3px solid transparent',
                  background: isSelected ? 'var(--color-cream-50)' : 'white',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-charcoal-800)' }}>
                      {sub.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-charcoal-400)', marginTop: 2 }}>
                      {sub.id} · {sub.contentType.toUpperCase()} · {formatDate(sub.submittedAt)}
                    </div>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>
                {sub.findings.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    {blockCount > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--color-terracotta-500)', fontWeight: 600 }}>
                        <XCircle size={12} /> {blockCount}
                      </span>
                    )}
                    {warnCount > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--color-amber-500)', fontWeight: 600 }}>
                        <AlertTriangle size={12} /> {warnCount}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--color-charcoal-400)' }}>
                      {sub.findings.filter(f => f.action !== 'pending').length}/{sub.findings.length} resolved
                    </span>
                  </div>
                )}
                {sub.reviewComment && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-charcoal-400)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MessageSquare size={11} /> {sub.reviewComment}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="card-flat" style={{ padding: 40, textAlign: 'center', color: 'var(--color-charcoal-400)' }}>
              <CheckCircle2 size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p>No submissions match this filter.</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedSub && (
          <div className="animate-slide-in" style={{ position: 'sticky', top: 28 }}>
            <div className="card-flat" style={{ overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-warm-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--color-charcoal-800)' }}>{selectedSub.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-charcoal-400)', marginTop: 2 }}>
                    {selectedSub.id} · Submitted {formatDate(selectedSub.submittedAt)}
                  </div>
                </div>
                <button className="btn-ghost" onClick={() => setSelectedSub(null)}>
                  <X size={16} />
                </button>
              </div>

              {/* Content Preview */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-warm-border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-charcoal-400)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                  Content Preview
                </div>
                <div style={{
                  padding: 14, borderRadius: 8, background: 'var(--color-cream-50)',
                  border: '1px solid var(--color-cream-300)', fontSize: 13,
                  lineHeight: 1.7, color: 'var(--color-charcoal-700)',
                  maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap',
                }}>
                  {selectedSub.body}
                </div>
              </div>

              {/* Findings */}
              <div style={{ padding: '16px 24px', maxHeight: 400, overflowY: 'auto' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-charcoal-400)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>
                  Findings ({selectedSub.findings.length})
                </div>
                {selectedSub.findings.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-sage-500)' }}>
                    <CheckCircle2 size={24} style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 13 }}>No issues found. Clean copy.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedSub.findings.map(finding => (
                      <ReviewFinding
                        key={finding.id}
                        finding={finding}
                        subId={selectedSub.id}
                        canAct={selectedSub.status === 'in-review'}
                        onAction={updateFindingAction}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Reviewer Actions */}
              {selectedSub.status === 'in-review' && (currentUser.role === 'reviewer' || currentUser.role === 'manager' || currentUser.role === 'admin') && (
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-warm-border)', background: 'var(--color-cream-50)' }}>
                  <div style={{ marginBottom: 10 }}>
                    <textarea
                      className="input-field"
                      rows={2}
                      placeholder="Add review comment…"
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      style={{ fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn-primary"
                      onClick={() => handleApprove(selectedSub)}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <CheckCircle2 size={14} /> Approve & Issue Passport
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleReject(selectedSub)}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Already decided */}
              {selectedSub.status === 'approved' && (
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-warm-border)', background: '#E8F5E9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-forest-700)' }}>
                    <Shield size={16} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Approved — Content Passport issued</span>
                  </div>
                  {selectedSub.passportId && (
                    <div style={{ fontSize: 12, color: 'var(--color-forest-600)', marginTop: 4 }}>
                      Passport: {selectedSub.passportId}
                    </div>
                  )}
                </div>
              )}
              {selectedSub.status === 'rejected' && (
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-warm-border)', background: '#FFEBEE' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-terracotta-500)' }}>
                    <XCircle size={16} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Rejected</span>
                  </div>
                  {selectedSub.reviewComment && (
                    <div style={{ fontSize: 12, color: 'var(--color-terracotta-600)', marginTop: 4 }}>
                      {selectedSub.reviewComment}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewFinding({ finding, subId, canAct, onAction }: {
  finding: Finding; subId: string; canAct: boolean;
  onAction: (subId: string, findingId: string, action: import('../data/store').FindingAction, reason?: string) => void;
}) {
  const [showDismiss, setShowDismiss] = useState(false);
  const [dismissReason, setDismissReason] = useState('');

  const severityColors = {
    block: { border: 'var(--color-terracotta-400)', icon: <XCircle size={14} /> },
    warning: { border: 'var(--color-amber-400)', icon: <AlertTriangle size={14} /> },
    info: { border: 'var(--color-sage-400)', icon: <CheckCircle2 size={14} /> },
  };
  const sc = severityColors[finding.severity];

  return (
    <div style={{ borderLeft: `3px solid ${sc.border}`, paddingLeft: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ color: sc.border }}>{sc.icon}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-charcoal-800)' }}>{finding.type}</span>
        {finding.action !== 'pending' && (
          <span className={`badge ${finding.action === 'accepted' || finding.action === 'edited' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10 }}>
            {finding.action}
          </span>
        )}
      </div>
      <p style={{ fontSize: 12, color: 'var(--color-charcoal-600)', lineHeight: 1.5, marginBottom: 6 }}>
        {finding.issue}
      </p>
      <div style={{
        padding: '6px 10px', borderRadius: 4, background: 'var(--color-cream-50)',
        fontSize: 11, color: 'var(--color-charcoal-400)', marginBottom: 6,
        fontStyle: 'italic',
      }}>
        <Quote size={10} style={{ display: 'inline', marginRight: 4 }} />
        {finding.evidenceQuote.slice(0, 80)}… — {finding.sourceCardId}
      </div>
      <div style={{
        padding: '6px 10px', borderRadius: 4, background: '#E8F5E9',
        fontSize: 11, color: 'var(--color-forest-700)', marginBottom: 6,
      }}>
        <Lightbulb size={10} style={{ display: 'inline', marginRight: 4 }} />
        {finding.suggestedFix}
      </div>

      {/* Actions */}
      {canAct && finding.action === 'pending' && (
        <div>
          {!showDismiss ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => onAction(subId, finding.id, 'accepted')}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid #C8E6C9',
                  background: '#E8F5E9', color: 'var(--color-forest-700)',
                  cursor: 'pointer', fontSize: 11, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <Check size={12} /> Accept Fix
              </button>
              <button
                onClick={() => onAction(subId, finding.id, 'edited')}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid var(--color-warm-border)',
                  background: 'white', color: 'var(--color-charcoal-600)',
                  cursor: 'pointer', fontSize: 11, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <Edit3 size={12} /> Edit
              </button>
              <button
                onClick={() => setShowDismiss(true)}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid #FFCDD2',
                  background: '#FFEBEE', color: 'var(--color-terracotta-500)',
                  cursor: 'pointer', fontSize: 11, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <X size={12} /> Dismiss
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="input-field"
                placeholder="Reason for dismissal…"
                value={dismissReason}
                onChange={e => setDismissReason(e.target.value)}
                style={{ fontSize: 11, padding: '4px 8px', flex: 1 }}
              />
              <button
                onClick={() => { onAction(subId, finding.id, 'dismissed', dismissReason); setShowDismiss(false); }}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid #FFCDD2',
                  background: 'var(--color-terracotta-500)', color: 'white',
                  cursor: 'pointer', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
                }}
              >
                Confirm Dismiss
              </button>
              <button
                onClick={() => setShowDismiss(false)}
                className="btn-ghost"
                style={{ padding: '4px 8px', fontSize: 11 }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { className: string; label: string }> = {
    'draft': { className: 'badge badge-info', label: 'Draft' },
    'scanning': { className: 'badge badge-info', label: 'Scanning…' },
    'in-review': { className: 'badge badge-warning', label: 'In Review' },
    'approved': { className: 'badge badge-success', label: 'Approved' },
    'rejected': { className: 'badge badge-danger', label: 'Rejected' },
  };
  const { className, label } = map[status] || map['draft'];
  return <span className={className}>{label}</span>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
