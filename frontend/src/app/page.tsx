'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield, Layers, BookOpen, Award, BarChart2,
  History, ArrowRight, Sparkles, CheckCircle2, Lock
} from 'lucide-react';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.pillBadge}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8' }} />
          <span>Future Stack Hackathon • Enterprise Brand Governance</span>
        </div>

        <h1 className={styles.title}>
          Governed Brand Compliance with <span className={styles.gradientText}>Deterministic Proof</span>
        </h1>

        <p className={styles.subtitle}>
          BrandLedger eliminates compliance hallucinations before marketing copy is published. 
          Every single finding is anchored in approved brand policies, active offers, and verbatim citations.
        </p>

        <div className={styles.tenetCallout}>
          <div className={styles.tenetIcon}>
            <Shield size={24} color="#10b981" />
          </div>
          <div>
            <div className={styles.tenetTitle}>Core Platform Tenet: &ldquo;No receipt, no flag.&rdquo;</div>
            <div className={styles.tenetDesc}>
              Our deterministic rules engine and AdaptionLabs AI Blueprint will never flag an issue without citing the exact policy card ID, active version snapshot, and a literal verbatim source quotation.
            </div>
          </div>
        </div>

        {/* Quick CTA to Workspace */}
        <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
          <Link
            href="/workspace"
            style={{
              background: 'var(--gradient-brand)',
              color: 'white',
              padding: '14px 28px',
              borderRadius: 8,
              fontSize: '1rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <Layers size={18} />
            <span>Open Scan Workspace</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/policies"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-primary)',
              padding: '14px 24px',
              borderRadius: 8,
              fontSize: '1rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <BookOpen size={18} />
            <span>Policy Library</span>
          </Link>
        </div>
      </section>

      {/* Main Module Action Cards */}
      <section className={styles.modulesGrid}>
        {/* Card 1: Scan Workspace */}
        <Link href="/workspace" className={styles.moduleCard} style={{ borderColor: 'rgba(56, 189, 248, 0.4)' }}>
          <div className={styles.cardGlow} />
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.iconLibrary}`} style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Layers size={24} />
            </div>
            <span className={styles.cardTag} style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
              Member 1 • Core Scanner
            </span>
          </div>

          <h2 className={styles.cardTitle}>Scan Workspace</h2>
          <p className={styles.cardDesc}>
            Interactive draft scanner powered by Zynab&apos;s deterministic rules engine and AdaptionLabs AI Blueprint. Features live text evidence highlighting and 1-click auto-fixes.
          </p>

          <ul className={styles.featuresList}>
            <li className={styles.featureItem}>
              <span style={{ color: '#38bdf8' }}>✓</span>
              <span>Pre-staged Snippet A (Violations) and Snippet B (Compliant)</span>
            </li>
            <li className={styles.featureItem}>
              <span style={{ color: '#38bdf8' }}>✓</span>
              <span>AdaptionLabs AI Blueprint &amp; Hallucination Mitigation</span>
            </li>
            <li className={styles.featureItem}>
              <span style={{ color: '#38bdf8' }}>✓</span>
              <span>Verbatim &ldquo;No receipt, no flag&rdquo; evidence citations</span>
            </li>
          </ul>

          <div className={styles.btnCardAction}>
            <span>Launch Scanner</span>
            <span>&rarr;</span>
          </div>
        </Link>

        {/* Card 2: Policy Library */}
        <Link href="/policies" className={styles.moduleCard}>
          <div className={styles.cardGlow} />
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.iconLibrary}`}>
              <BookOpen size={24} />
            </div>
            <span className={styles.cardTag}>Member 2 • Core Library</span>
          </div>

          <h2 className={styles.cardTitle}>Policy Library</h2>
          <p className={styles.cardDesc}>
            Authoritative brand rulebook with automated versioning. Search, filter, and author approved policy cards across terminology, offers, and factual metrics.
          </p>

          <ul className={styles.featuresList}>
            <li className={styles.featureItem}>
              <span style={{ color: '#38bdf8' }}>✓</span>
              <span>Prohibited terms &amp; approved replacements</span>
            </li>
            <li className={styles.featureItem}>
              <span style={{ color: '#38bdf8' }}>✓</span>
              <span>Promotional validity calendars &amp; expiration dates</span>
            </li>
            <li className={styles.featureItem}>
              <span style={{ color: '#38bdf8' }}>✓</span>
              <span>Quote integrity checker (&ldquo;No receipt, no flag&rdquo;)</span>
            </li>
          </ul>

          <div className={styles.btnCardAction}>
            <span>Open Policy Library</span>
            <span>&rarr;</span>
          </div>
        </Link>

        {/* Card 3: Executive Insights */}
        <Link href="/insights" className={styles.moduleCard}>
          <div className={styles.cardGlow} />
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon}`} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <BarChart2 size={24} />
            </div>
            <span className={styles.cardTag} style={{ color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
              Phase 2 • Analytics
            </span>
          </div>

          <h2 className={styles.cardTitle}>Executive Insights</h2>
          <p className={styles.cardDesc}>
            Governance analytics tracking compliance score trends, violation category breakdowns, channel risk levels, and high-impact policy leaderboards.
          </p>

          <ul className={styles.featuresList}>
            <li className={styles.featureItem}>
              <span style={{ color: '#c084fc' }}>✓</span>
              <span>94.2% overall compliance score &amp; MoM improvements</span>
            </li>
            <li className={styles.featureItem}>
              <span style={{ color: '#c084fc' }}>✓</span>
              <span>Category breakdown: Terminology, Offers, Claims</span>
            </li>
            <li className={styles.featureItem}>
              <span style={{ color: '#c084fc' }}>✓</span>
              <span>Channel assessment: Social, Web Banners, Newsletters</span>
            </li>
          </ul>

          <div className={styles.btnCardAction}>
            <span>View Executive Insights</span>
            <span>&rarr;</span>
          </div>
        </Link>

        {/* Card 4: Cryptographic Audit Trail */}
        <Link href="/audit" className={styles.moduleCard}>
          <div className={styles.cardGlow} />
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon}`} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <History size={24} />
            </div>
            <span className={styles.cardTag} style={{ color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              Phase 2 • Cryptographic Audit
            </span>
          </div>

          <h2 className={styles.cardTitle}>Audit Ledger</h2>
          <p className={styles.cardDesc}>
            Chronological, immutable audit trail recording every scan evaluation, policy version increment, reviewer decision, and SHA-256 fingerprint.
          </p>

          <ul className={styles.featuresList}>
            <li className={styles.featureItem}>
              <span style={{ color: '#34d399' }}>✓</span>
              <span>Real-time SHA-256 tamper verification check</span>
            </li>
            <li className={styles.featureItem}>
              <span style={{ color: '#34d399' }}>✓</span>
              <span>Filter by actor, action type, and target draft ID</span>
            </li>
            <li className={styles.featureItem}>
              <span style={{ color: '#34d399' }}>✓</span>
              <span>Provable mathematical auditability for enterprise compliance</span>
            </li>
          </ul>

          <div className={styles.btnCardAction}>
            <span>Open Audit Ledger</span>
            <span>&rarr;</span>
          </div>
        </Link>
      </section>

      {/* Team Architecture Matrix */}
      <section className={styles.teamSection}>
        <h2 className={styles.teamTitle}>BrandLedger Six-Member Team Architecture</h2>
        <div className={styles.teamGrid}>
          <div className={styles.memberCard} style={{ borderColor: 'rgba(56, 189, 248, 0.4)', background: 'rgba(56, 189, 248, 0.05)' }}>
            <span className={styles.memberRole} style={{ color: '#38bdf8' }}>Member 1 • Sana Fria</span>
            <span className={styles.memberName} style={{ color: '#38bdf8' }}>Scan Workspace &amp; Frontend</span>
            <span className={styles.memberDesc}>Interactive draft submission, real-time finding highlights &amp; reviewer workflow (/workspace).</span>
          </div>

          <div className={styles.memberCard}>
            <span className={styles.memberRole}>Member 2 • Nimra Tariq</span>
            <span className={styles.memberName}>Policy Library &amp; Brand Passport</span>
            <span className={styles.memberDesc}>Authoritative brand policy management, versioning, and governance passport (/policies, /brand-passport).</span>
          </div>

          <div className={styles.memberCard}>
            <span className={styles.memberRole}>Member 3 • Zoya Nadeem</span>
            <span className={styles.memberName}>Database &amp; Shared API</span>
            <span className={styles.memberDesc}>PostgreSQL schema, persistence repository, and core FastAPI review orchestration.</span>
          </div>

          <div className={styles.memberCard} style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <span className={styles.memberRole} style={{ color: '#10b981' }}>Member 4 • Zynab Farhan</span>
            <span className={styles.memberName}>Rules Engine &amp; Evidence</span>
            <span className={styles.memberDesc}>Deterministic rules (terminology, expired offers, facts, claims) and &ldquo;No receipt, no flag&rdquo; verifier.</span>
          </div>

          <div className={styles.memberCard}>
            <span className={styles.memberRole}>Member 5 • Mahadevi Sabarad</span>
            <span className={styles.memberName}>Document &amp; OCR Ingestion</span>
            <span className={styles.memberDesc}>PyMuPDF vector text extraction, Tesseract OCR, and visual quality flags.</span>
          </div>

          <div className={styles.memberCard}>
            <span className={styles.memberRole}>Member 6 • Umme Haany Tandur</span>
            <span className={styles.memberName}>QA, Testing &amp; Submission</span>
            <span className={styles.memberDesc}>Acceptance test suite, demo script &amp; verification checklist (docs/demo-script.md).</span>
          </div>
        </div>
      </section>
    </div>
  );
}
