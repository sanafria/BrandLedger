'use client';

import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.pillBadge}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8' }} />
          <span>Member 2 Implementation • Policy Core</span>
        </div>

        <h1 className={styles.title}>
          Governed Brand Compliance with <span className={styles.gradientText}>Deterministic Proof</span>
        </h1>

        <p className={styles.subtitle}>
          Brand Ledger eliminates compliance hallucinations before marketing copy is published. 
          Every single finding is anchored in approved brand policies, active offers, and literal citations.
        </p>

        <div className={styles.tenetCallout}>
          <div className={styles.tenetIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div>
            <div className={styles.tenetTitle}>Core Platform Tenet: &ldquo;No receipt, no flag.&rdquo;</div>
            <div className={styles.tenetDesc}>
              Our deterministic rules engine and evidence verifier will never report an issue without citing the exact policy card ID, approved version, and verbatim source quotation.
            </div>
          </div>
        </div>
      </section>

      {/* Main Module Action Cards */}
      <section className={styles.modulesGrid}>
        {/* Card 1: Policy Library */}
        <Link href="/policies" className={styles.moduleCard}>
          <div className={styles.cardGlow} />
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.iconLibrary}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <span className={styles.cardTag}>Core Library</span>
          </div>

          <h2 className={styles.cardTitle}>Policy Library</h2>
          <p className={styles.cardDesc}>
            Search, filter, author, and inspect the approved brand policies that directly feed into Zynab&apos;s rules engine. Includes real-time verbatim quote verification.
          </p>

          <ul className={styles.featuresList}>
            <li className={styles.featureItem}>
              <span style={{ color: '#38bdf8' }}>✓</span>
              <span>Prohibited terminology &amp; approved replacements</span>
            </li>
            <li className={styles.featureItem}>
              <span style={{ color: '#38bdf8' }}>✓</span>
              <span>Promotional validity windows &amp; expiration dates</span>
            </li>
            <li className={styles.featureItem}>
              <span style={{ color: '#38bdf8' }}>✓</span>
              <span>Numerical limits, rewards caps, and standard pricing</span>
            </li>
            <li className={styles.featureItem}>
              <span style={{ color: '#38bdf8' }}>✓</span>
              <span>Policy versioning and audit traceability</span>
            </li>
          </ul>

          <div className={styles.btnCardAction}>
            <span>Open Policy Library</span>
            <span>&rarr;</span>
          </div>
        </Link>

        {/* Card 2: Brand Passport */}
        <Link href="/brand-passport" className={styles.moduleCard}>
          <div className={styles.cardGlow} />
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.iconPassport}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <circle cx="9" cy="10" r="2" />
                <path d="M15 8h2" />
                <path d="M15 12h2" />
                <path d="M7 16h10" />
              </svg>
            </div>
            <span className={styles.cardTag}>Executive Overview</span>
          </div>

          <h2 className={styles.cardTitle}>Brand Passport</h2>
          <p className={styles.cardDesc}>
            The certified single source of truth for brand identity. Consolidates voice pillars, numerical guardrails, claim substantiation standards, and visual assets with interactive deep-links.
          </p>

          <ul className={styles.featuresList}>
            <li className={styles.featureItem}>
              <span style={{ color: '#a855f7' }}>✓</span>
              <span>Governance certification score &amp; mission statement</span>
            </li>
            <li className={styles.featureItem}>
              <span style={{ color: '#a855f7' }}>✓</span>
              <span>Brand voice pillars with explicit Dos and Don&apos;ts</span>
            </li>
            <li className={styles.featureItem}>
              <span style={{ color: '#a855f7' }}>✓</span>
              <span>Approved dictionary comparison table</span>
            </li>
            <li className={styles.featureItem}>
              <span style={{ color: '#a855f7' }}>✓</span>
              <span>One-click Brand Passport JSON export</span>
            </li>
          </ul>

          <div className={styles.btnCardAction}>
            <span>View Brand Passport</span>
            <span>&rarr;</span>
          </div>
        </Link>
      </section>

      {/* Team Architecture Matrix */}
      <section className={styles.teamSection}>
        <h2 className={styles.teamTitle}>Brand Ledger Six-Member Team Architecture</h2>
        <div className={styles.teamGrid}>
          <div className={styles.memberCard}>
            <span className={styles.memberRole}>Member 1 • Sana</span>
            <span className={styles.memberName}>Scan Workspace</span>
            <span className={styles.memberDesc}>Interactive draft submission, real-time finding highlights &amp; reviewer workflow.</span>
          </div>

          <div className={styles.memberCard} style={{ borderColor: 'rgba(56, 189, 248, 0.4)', background: 'rgba(56, 189, 248, 0.05)' }}>
            <span className={styles.memberRole} style={{ color: '#38bdf8' }}>Member 2 • Nimra (You)</span>
            <span className={styles.memberName} style={{ color: '#38bdf8' }}>Policy Library &amp; Brand Passport</span>
            <span className={styles.memberDesc}>Authoritative brand policy management, versioning, and governance passport.</span>
          </div>

          <div className={styles.memberCard}>
            <span className={styles.memberRole}>Member 3 • Zoya</span>
            <span className={styles.memberName}>Database &amp; Shared API</span>
            <span className={styles.memberDesc}>PostgreSQL schema, persistence repository, and core FastAPI routing.</span>
          </div>

          <div className={styles.memberCard} style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <span className={styles.memberRole} style={{ color: '#10b981' }}>Member 4 • Zynab</span>
            <span className={styles.memberName}>Rules Engine &amp; Evidence</span>
            <span className={styles.memberDesc}>Implemented in commit 6f3b261 (4 deterministic rules, AI analysis, quote verification).</span>
          </div>

          <div className={styles.memberCard}>
            <span className={styles.memberRole}>Member 5 • Mahadevi</span>
            <span className={styles.memberName}>Document Ingestion</span>
            <span className={styles.memberDesc}>PDF parsing and automated policy card extraction pipeline.</span>
          </div>

          <div className={styles.memberCard}>
            <span className={styles.memberRole}>Member 6</span>
            <span className={styles.memberName}>Multi-Agent Orchestration</span>
            <span className={styles.memberDesc}>Cross-system coordination, audit logging, and team deployment integration.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
