'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Upload, FileText, Image, File, X, Zap, AlertTriangle,
  CheckCircle2, XCircle, ArrowRight, Shield, Quote, Lightbulb
} from 'lucide-react';
import { ContentSubmission, Finding } from '../data/store';

// Simulated scan engine — in production this would be the FastAPI backend + AI
function simulateScan(text: string, policyCards: import('../data/store').PolicyCard[]): Finding[] {
  const findings: Finding[] = [];
  const lower = text.toLowerCase();

  // Check each active policy card
  for (const card of policyCards) {
    if (card.status !== 'active' && card.status !== 'expired') continue;

    if (card.type === 'offer' && card.status === 'expired') {
      // Check for expired offer references
      const offerMatch = card.content.match(/(\d+%)/);
      if (offerMatch && lower.includes(offerMatch[1].toLowerCase())) {
        findings.push({
          id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'Expired Offer',
          severity: 'block',
          detectionMethod: 'rule-detected',
          originalText: findContext(text, offerMatch[1]),
          issue: `This references a ${offerMatch[1]} discount that expired. Card "${card.title}" is expired.`,
          evidenceQuote: card.content.slice(0, 100),
          sourceCardId: card.id,
          sourceCardVersion: card.version,
          suggestedFix: 'Replace with the current active promotion.',
          confidence: 'high',
          action: 'pending',
        });
      }
    }

    if (card.type === 'term' && card.status === 'active') {
      // Check terminology
      if (card.id === 'TERM_003' && (lower.includes('customer') || lower.includes('user') || lower.includes('subscriber'))) {
        const terms = ['customers', 'customer', 'users', 'user', 'subscribers', 'subscriber'];
        for (const term of terms) {
          if (lower.includes(term)) {
            findings.push({
              id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              type: 'Terminology Violation',
              severity: card.severity,
              detectionMethod: 'rule-detected',
              originalText: findContext(text, term),
              issue: `"${term}" should be replaced with "Members" per brand terminology.`,
              evidenceQuote: card.content.slice(0, 120),
              sourceCardId: card.id,
              sourceCardVersion: card.version,
              suggestedFix: `Replace "${term}" with "Members"`,
              confidence: 'high',
              action: 'pending',
            });
            break;
          }
        }
      }
      if (card.id === 'TERM_004' && (lower.includes('nova shield') || lower.includes('nsp'))) {
        findings.push({
          id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'Product Name Error',
          severity: card.severity,
          detectionMethod: 'rule-detected',
          originalText: findContext(text, 'nova shield'),
          issue: 'Product name format is incorrect. Must be "NovaShield Pro".',
          evidenceQuote: card.content.slice(0, 120),
          sourceCardId: card.id,
          sourceCardVersion: card.version,
          suggestedFix: 'Use "NovaShield Pro™" (first mention should include ™)',
          confidence: 'high',
          action: 'pending',
        });
      }
    }

    if (card.type === 'fact' && card.status === 'active') {
      if (card.id === 'FACT_001' && (lower.includes('founded in 2018') || lower.includes('founded in 2020'))) {
        findings.push({
          id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'Incorrect Fact',
          severity: 'block',
          detectionMethod: 'rule-detected',
          originalText: findContext(text, 'founded in'),
          issue: 'Incorrect founding year. NovaBrand was founded in 2019.',
          evidenceQuote: card.content,
          sourceCardId: card.id,
          sourceCardVersion: card.version,
          suggestedFix: 'Founded in 2019',
          confidence: 'high',
          action: 'pending',
        });
      }
      if (card.id === 'FACT_002') {
        const userCounts = ['3 million', '5 million', '1 million', '4m', '3m'];
        for (const count of userCounts) {
          if (lower.includes(count)) {
            findings.push({
              id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              type: 'Incorrect Fact',
              severity: card.severity,
              detectionMethod: 'rule-detected',
              originalText: findContext(text, count),
              issue: `Unsupported user count "${count}". Approved figure is "2M+ active users".`,
              evidenceQuote: card.content.slice(0, 100),
              sourceCardId: card.id,
              sourceCardVersion: card.version,
              suggestedFix: 'Use "2M+ active users"',
              confidence: 'high',
              action: 'pending',
            });
            break;
          }
        }
      }
    }

    if (card.type === 'claim' && card.status === 'active') {
      if (card.id === 'CLAIM_001' && lower.includes('award')) {
        const hasProperCitation = lower.includes('techventure') || lower.includes('digital excellence');
        if (!hasProperCitation) {
          findings.push({
            id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: 'Unsupported Claim',
            severity: 'block',
            detectionMethod: 'ai-detected',
            originalText: findContext(text, 'award'),
            issue: '"Award-winning" claim without citing the specific award name and year.',
            evidenceQuote: card.content.slice(0, 120),
            sourceCardId: card.id,
            sourceCardVersion: card.version,
            suggestedFix: 'Add citation: "winner of the Digital Excellence Prize 2026"',
            confidence: 'high',
            action: 'pending',
          });
        }
      }
      if (card.id === 'CLAIM_002') {
        const leaderTerms = ['no. 1', 'number 1', '#1', 'industry leader', 'market leader', 'best in'];
        for (const lt of leaderTerms) {
          if (lower.includes(lt)) {
            findings.push({
              id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              type: 'Unsupported Claim',
              severity: 'block',
              detectionMethod: 'ai-detected',
              originalText: findContext(text, lt),
              issue: `Superlative claim "${lt}" requires third-party analyst evidence.`,
              evidenceQuote: card.content.slice(0, 120),
              sourceCardId: card.id,
              sourceCardVersion: card.version,
              suggestedFix: 'Remove or replace with verifiable statement.',
              confidence: 'high',
              action: 'pending',
            });
            break;
          }
        }
      }
    }

    if (card.type === 'tone' && card.status === 'active') {
      const exclamations = (text.match(/!/g) || []).length;
      const capsWords = (text.match(/\b[A-Z]{3,}\b/g) || []).filter(w => !['PDF', 'CEO', 'OCT', 'USA', 'API'].includes(w));
      if (exclamations > 2 || capsWords.length > 1) {
        findings.push({
          id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'Tone Violation',
          severity: 'warning',
          detectionMethod: 'ai-detected',
          originalText: capsWords.length > 0 ? `Uses ALL CAPS: ${capsWords.join(', ')}` : `${exclamations} exclamation marks used`,
          issue: `Brand voice is professional yet approachable. ${exclamations > 2 ? `${exclamations} exclamation marks (max 1). ` : ''}${capsWords.length > 0 ? `ALL CAPS words detected: ${capsWords.join(', ')}.` : ''}`,
          evidenceQuote: card.content.slice(0, 100),
          sourceCardId: card.id,
          sourceCardVersion: card.version,
          suggestedFix: 'Reduce exclamation marks to 1. Remove ALL CAPS unless legally required.',
          confidence: 'medium',
          action: 'pending',
        });
      }
    }
  }

  return findings;
}

function findContext(text: string, needle: string): string {
  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx === -1) return needle;
  const start = Math.max(0, idx - 20);
  const end = Math.min(text.length, idx + needle.length + 20);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

export default function ScanPage() {
  const { policyCards, addSubmission, currentUser } = useApp();
  const [contentType, setContentType] = useState<'text' | 'image' | 'pdf'>('text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [progress, setProgress] = useState(0);

  const handleScan = () => {
    if (!title.trim() || !body.trim()) return;
    setScanning(true);
    setScanComplete(false);
    setProgress(0);
    setFindings([]);

    // Simulate scanning progress
    const steps = [10, 25, 40, 55, 70, 85, 95, 100];
    let stepIdx = 0;

    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setProgress(steps[stepIdx]);
        stepIdx++;
      } else {
        clearInterval(interval);
        const results = simulateScan(body, policyCards);
        setFindings(results);
        setScanning(false);
        setScanComplete(true);
      }
    }, 300);
  };

  const handleSubmitForReview = () => {
    const sub: ContentSubmission = {
      id: `SUB_${Date.now().toString().slice(-6)}`,
      title: title.trim(),
      contentType,
      body: body.trim(),
      status: 'in-review',
      submittedBy: currentUser.id,
      submittedAt: new Date().toISOString(),
      findings,
    };
    addSubmission(sub);
    // Reset
    setTitle('');
    setBody('');
    setScanComplete(false);
    setFindings([]);
    setProgress(0);
  };

  const handleReset = () => {
    setTitle('');
    setBody('');
    setScanComplete(false);
    setScanning(false);
    setFindings([]);
    setProgress(0);
  };

  const blockCount = findings.filter(f => f.severity === 'block').length;
  const warnCount = findings.filter(f => f.severity === 'warning').length;
  const infoCount = findings.filter(f => f.severity === 'info').length;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>Upload & Scan</h1>
        <p style={{ color: 'var(--color-charcoal-400)', fontSize: 14 }}>
          Submit content for verification against your Policy Card library.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: scanComplete ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* Left: Input */}
        <div>
          <div className="card-flat" style={{ padding: 24 }}>
            {/* Content Type Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { type: 'text' as const, icon: <FileText size={16} />, label: 'Text' },
                { type: 'image' as const, icon: <Image size={16} />, label: 'Image' },
                { type: 'pdf' as const, icon: <File size={16} />, label: 'PDF' },
              ].map(tab => (
                <button
                  key={tab.type}
                  onClick={() => setContentType(tab.type)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-warm-border)',
                    background: contentType === tab.type ? 'var(--color-forest-700)' : 'white',
                    color: contentType === tab.type ? 'white' : 'var(--color-charcoal-500)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Title */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-600)', marginBottom: 6, display: 'block' }}>Content Title</label>
              <input
                className="input-field"
                placeholder="e.g., October Social Campaign — Instagram Post"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            {/* Body */}
            {contentType === 'text' ? (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-charcoal-600)', marginBottom: 6, display: 'block' }}>Content Body</label>
                <textarea
                  className="input-field"
                  rows={10}
                  placeholder="Paste your draft copy here…"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  style={{ fontFamily: 'var(--font-body)', lineHeight: 1.7 }}
                />
              </div>
            ) : (
              <div
                style={{
                  marginBottom: 16, padding: 40,
                  border: '2px dashed var(--color-cream-300)',
                  borderRadius: 12, textAlign: 'center',
                  color: 'var(--color-charcoal-400)',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setBody('Sample extracted text from uploaded file. This is a demo — in production, OCR and PDF extraction would process the actual file.');
                }}
              >
                <Upload size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                <p style={{ fontSize: 14 }}>Click to upload or drag & drop</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>{contentType === 'image' ? 'PNG, JPG up to 10MB' : 'PDF up to 25MB'}</p>
                <p style={{ fontSize: 11, marginTop: 8, fontStyle: 'italic' }}>(Demo: click to simulate file upload)</p>
              </div>
            )}

            {/* Scan Button */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-primary"
                onClick={handleScan}
                disabled={scanning || !title.trim() || !body.trim()}
                style={{ flex: 1, justifyContent: 'center', opacity: (scanning || !title.trim() || !body.trim()) ? 0.6 : 1 }}
              >
                <Zap size={16} /> {scanning ? 'Scanning…' : 'Scan Against Policy Cards'}
              </button>
              {(scanComplete || body) && (
                <button className="btn-ghost" onClick={handleReset}>
                  <X size={16} /> Reset
                </button>
              )}
            </div>

            {/* Progress */}
            {scanning && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-charcoal-400)' }}>
                    {progress < 40 ? 'Extracting text…' : progress < 70 ? 'Checking rules…' : progress < 95 ? 'AI analysis…' : 'Verifying evidence…'}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-forest-600)' }}>{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Findings */}
        {scanComplete && (
          <div className="animate-slide-in">
            {/* Summary */}
            <div className="card-flat" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                {blockCount > 0 ? (
                  <XCircle size={24} style={{ color: 'var(--color-terracotta-500)' }} />
                ) : (
                  <CheckCircle2 size={24} style={{ color: 'var(--color-sage-500)' }} />
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--color-charcoal-800)' }}>
                    {findings.length === 0 ? 'No Issues Found' : `${findings.length} Finding${findings.length === 1 ? '' : 's'} Detected`}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-charcoal-400)' }}>
                    Scanned against {policyCards.filter(c => c.status === 'active').length} active policy cards
                  </div>
                </div>
              </div>
              {findings.length > 0 && (
                <div style={{ display: 'flex', gap: 16 }}>
                  {blockCount > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--color-terracotta-500)', fontWeight: 600 }}>
                      <XCircle size={14} /> {blockCount} blocking
                    </span>
                  )}
                  {warnCount > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--color-amber-500)', fontWeight: 600 }}>
                      <AlertTriangle size={14} /> {warnCount} warnings
                    </span>
                  )}
                  {infoCount > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--color-charcoal-400)', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> {infoCount} info
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Individual Findings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="stagger">
              {findings.map(finding => (
                <FindingCard key={finding.id} finding={finding} />
              ))}
            </div>

            {/* Submit for Review */}
            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={handleSubmitForReview} style={{ flex: 1, justifyContent: 'center' }}>
                <ArrowRight size={16} /> Submit for Review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const severityColors = {
    block: { bg: '#FFEBEE', border: 'var(--color-terracotta-400)', icon: <XCircle size={16} />, label: 'BLOCK' },
    warning: { bg: '#FFF3E0', border: 'var(--color-amber-400)', icon: <AlertTriangle size={16} />, label: 'WARNING' },
    info: { bg: '#E8F5E9', border: 'var(--color-sage-400)', icon: <CheckCircle2 size={16} />, label: 'INFO' },
  };
  const sc = severityColors[finding.severity];

  return (
    <div
      className="card-flat animate-fade-in"
      style={{ padding: 16, borderLeft: `3px solid ${sc.border}` }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: sc.border }}>{sc.icon}</span>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-charcoal-800)' }}>{finding.type}</span>
          <span className={`badge ${finding.severity === 'block' ? 'badge-danger' : finding.severity === 'warning' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 10 }}>
            {sc.label}
          </span>
        </div>
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 10,
          background: finding.detectionMethod === 'rule-detected' ? 'var(--color-cream-200)' : '#E8EAF6',
          color: 'var(--color-charcoal-500)',
        }}>
          {finding.detectionMethod === 'rule-detected' ? '📏 Rule' : '🤖 AI'}
        </span>
      </div>

      {/* Issue */}
      <p style={{ fontSize: 13, color: 'var(--color-charcoal-700)', lineHeight: 1.6, marginBottom: 10 }}>
        {finding.issue}
      </p>

      {/* Evidence Quote */}
      <div style={{
        padding: '10px 14px', borderRadius: 6,
        background: 'var(--color-cream-50)', border: '1px solid var(--color-cream-300)',
        fontSize: 12, color: 'var(--color-charcoal-500)',
        display: 'flex', gap: 8, marginBottom: 10,
      }}>
        <Quote size={14} style={{ flexShrink: 0, marginTop: 2, opacity: 0.5 }} />
        <div>
          <div style={{ fontStyle: 'italic', lineHeight: 1.5 }}>"{finding.evidenceQuote}"</div>
          <div style={{ marginTop: 4, fontWeight: 600, fontSize: 11, color: 'var(--color-charcoal-400)' }}>
            REF: {finding.sourceCardId} (v{finding.sourceCardVersion})
          </div>
        </div>
      </div>

      {/* Suggested Fix */}
      <div style={{
        padding: '10px 14px', borderRadius: 6,
        background: '#E8F5E9', border: '1px solid #C8E6C9',
        fontSize: 12, display: 'flex', gap: 8,
      }}>
        <Lightbulb size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-sage-500)' }} />
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-forest-700)', marginBottom: 2 }}>Suggested Fix</div>
          <div style={{ color: 'var(--color-charcoal-600)', lineHeight: 1.5 }}>{finding.suggestedFix}</div>
        </div>
      </div>
    </div>
  );
}
