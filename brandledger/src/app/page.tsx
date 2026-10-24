'use client';

import React from 'react';
import { useApp } from './context/AppContext';
import Link from 'next/link';
import {
  FileText, Upload, ClipboardCheck, Shield, AlertTriangle,
  CheckCircle2, XCircle, Clock, TrendingDown, ArrowRight,
  RefreshCw, Eye
} from 'lucide-react';
import { insightsData } from './data/store';

export default function Dashboard() {
  const { currentUser, policyCards, submissions, passports, auditLog } = useApp();

  const activeCards = policyCards.filter(c => c.status === 'active').length;
  const expiredCards = policyCards.filter(c => c.status === 'expired' || c.status === 'retired').length;
  const inReview = submissions.filter(s => s.status === 'in-review').length;
  const approved = submissions.filter(s => s.status === 'approved').length;
  const rejected = submissions.filter(s => s.status === 'rejected').length;
  const validPassports = passports.filter(p => p.status === 'valid').length;
  const revokedPassports = passports.filter(p => p.status === 'revalidation_required' || p.status === 'revoked').length;
  const totalFindings = submissions.reduce((acc, s) => acc + s.findings.length, 0);
  const blockFindings = submissions.reduce((acc, s) => acc + s.findings.filter(f => f.severity === 'block').length, 0);

  const recentAudit = auditLog.slice(0, 8);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {currentUser.name.split(' ')[0]}
        </h1>
        <p style={{ color: 'var(--color-charcoal-400)', fontSize: 15 }}>
          Here&apos;s what&apos;s happening with your brand content today.
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }} className="stagger">
        <StatCard
          label="Policy Cards"
          value={policyCards.length}
          sub={`${activeCards} active · ${expiredCards} expired`}
          icon={<FileText size={20} />}
          color="var(--color-forest-700)"
          href="/policy-cards"
        />
        <StatCard
          label="In Review"
          value={inReview}
          sub={`${approved} approved · ${rejected} rejected`}
          icon={<ClipboardCheck size={20} />}
          color="var(--color-amber-500)"
          href="/review"
        />
        <StatCard
          label="Valid Passports"
          value={validPassports}
          sub={`${revokedPassports} need revalidation`}
          icon={<Shield size={20} />}
          color="var(--color-sage-500)"
          href="/passports"
        />
        <StatCard
          label="Total Findings"
          value={totalFindings}
          sub={`${blockFindings} blocking publication`}
          icon={<AlertTriangle size={20} />}
          color="var(--color-terracotta-500)"
          href="/review"
        />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        {/* Left: Content Requiring Attention */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>Content Requiring Attention</h2>
            <Link href="/review" className="btn-ghost" style={{ fontSize: 13 }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="stagger">
            {submissions
              .filter(s => s.status === 'in-review' || s.status === 'scanning')
              .map(sub => (
                <ContentRow key={sub.id} submission={sub} />
              ))}
            {submissions.filter(s => s.status === 'in-review' || s.status === 'scanning').length === 0 && (
              <div className="card-flat" style={{ padding: 32, textAlign: 'center', color: 'var(--color-charcoal-400)' }}>
                <CheckCircle2 size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                <p>All content reviewed. Nothing pending.</p>
              </div>
            )}
          </div>

          {/* Passports needing revalidation */}
          {revokedPassports > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <RefreshCw size={18} style={{ color: 'var(--color-terracotta-500)' }} />
                <h2 style={{ fontSize: 18, margin: 0 }}>Passports Needing Revalidation</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {passports
                  .filter(p => p.status === 'revalidation_required' || p.status === 'revoked')
                  .map(p => (
                    <div key={p.id} className="card" style={{ padding: 16, borderLeft: '3px solid var(--color-terracotta-400)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-charcoal-800)' }}>{p.contentTitle}</div>
                          <div style={{ fontSize: 13, color: 'var(--color-charcoal-400)', marginTop: 2 }}>
                            {p.id} · Approved by {p.approvedBy}
                          </div>
                        </div>
                        <span className="badge badge-warning">
                          <RefreshCw size={12} /> Revalidation Required
                        </span>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-charcoal-400)' }}>
                        Depends on: {p.dependencies.map(d => d.cardId).join(', ')}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Activity Feed + Quick Stats */}
        <div>
          {/* Error Trend Mini */}
          <div className="card-flat" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <TrendingDown size={16} style={{ color: 'var(--color-sage-500)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-charcoal-800)' }}>Error Trend</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
              {insightsData.weeklyErrors.map((w, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${(w.count / 40) * 70}px`,
                      background: i === insightsData.weeklyErrors.length - 1
                        ? 'var(--color-forest-600)'
                        : 'var(--color-cream-300)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s',
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--color-charcoal-400)' }}>8 weeks ago</span>
              <span style={{ fontSize: 11, color: 'var(--color-charcoal-400)' }}>This week</span>
            </div>
          </div>

          {/* Activity Feed */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>Activity</h2>
            <Link href="/audit" className="btn-ghost" style={{ fontSize: 13 }}>
              Full log <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-flat" style={{ overflow: 'hidden' }}>
            {recentAudit.map((entry, i) => (
              <div
                key={entry.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: i < recentAudit.length - 1 ? '1px solid var(--color-cream-200)' : 'none',
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AuditIcon action={entry.action} />
                  <span style={{ fontWeight: 500, color: 'var(--color-charcoal-700)' }}>{entry.action}</span>
                  <span style={{ color: 'var(--color-charcoal-400)', fontSize: 12, marginLeft: 'auto' }}>
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
                <div style={{ color: 'var(--color-charcoal-400)', fontSize: 12, marginTop: 2, paddingLeft: 26 }}>
                  {entry.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color, href }: {
  label: string; value: number; sub: string; icon: React.ReactNode; color: string; href: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div className="card animate-fade-in" style={{ padding: 20, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-500)' }}>{label}</span>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${color}12`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: color,
          }}>
            {icon}
          </div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-charcoal-800)', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-charcoal-400)', marginTop: 4 }}>{sub}</div>
      </div>
    </Link>
  );
}

function ContentRow({ submission }: { submission: import('./data/store').ContentSubmission }) {
  const blockCount = submission.findings.filter(f => f.severity === 'block').length;
  const warnCount = submission.findings.filter(f => f.severity === 'warning').length;

  return (
    <Link href="/review" style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: 16, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-charcoal-800)' }}>
              {submission.title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-charcoal-400)', marginTop: 2 }}>
              {submission.id} · {submission.contentType.toUpperCase()} · Submitted {formatTime(submission.submittedAt)}
            </div>
          </div>
          <StatusBadge status={submission.status} />
        </div>
        {submission.findings.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            {blockCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-terracotta-500)', fontWeight: 500 }}>
                <XCircle size={14} /> {blockCount} blocking
              </span>
            )}
            {warnCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-amber-500)', fontWeight: 500 }}>
                <AlertTriangle size={14} /> {warnCount} warnings
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
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

function AuditIcon({ action }: { action: string }) {
  const iconStyle = { flexShrink: 0 as const };
  if (action.includes('Approved')) return <CheckCircle2 size={14} style={{ ...iconStyle, color: 'var(--color-sage-500)' }} />;
  if (action.includes('Rejected')) return <XCircle size={14} style={{ ...iconStyle, color: 'var(--color-terracotta-500)' }} />;
  if (action.includes('Revoked')) return <RefreshCw size={14} style={{ ...iconStyle, color: 'var(--color-terracotta-400)' }} />;
  if (action.includes('Submitted')) return <Upload size={14} style={{ ...iconStyle, color: 'var(--color-amber-500)' }} />;
  if (action.includes('Passport')) return <Shield size={14} style={{ ...iconStyle, color: 'var(--color-forest-600)' }} />;
  if (action.includes('Scan')) return <Eye size={14} style={{ ...iconStyle, color: 'var(--color-charcoal-400)' }} />;
  return <Clock size={14} style={{ ...iconStyle, color: 'var(--color-charcoal-400)' }} />;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
