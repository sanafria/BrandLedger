'use client';

import React from 'react';
import Link from 'next/link';
import { PolicyCard } from '@/types/policy';
import styles from './GuardrailsSection.module.css';

interface GuardrailsSectionProps {
  policies: PolicyCard[];
}

export const GuardrailsSection: React.FC<GuardrailsSectionProps> = ({ policies }) => {
  const numPolicies = policies.filter((p) => p.category === 'numerical');
  const offerPolicies = policies.filter((p) => p.category === 'offer_validity');
  const claimPolicies = policies.filter((p) => p.category === 'claims');

  return (
    <div className={styles.section}>
      {/* 1. Numerical Guardrails (Rule 3) */}
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={`${styles.iconWrap} ${styles.iconNum}`}>#</div>
            <h3 className={styles.title}>Numerical Guardrails</h3>
          </div>
          <Link href="/policies?cat=numerical" className={styles.link}>
            View Policies &rarr;
          </Link>
        </div>
        <p className={styles.desc}>
          Deterministic numerical and factual caps enforced by Rule 3. Discrepancies exceeding authorized limits are automatically flagged.
        </p>
        <div className={styles.itemsList}>
          {numPolicies.map((p) => {
            const rule = (p.rules[0] || {}) as Record<string, unknown>;
            return (
              <div key={p.id} className={styles.itemBox}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemTitle}>{p.title}</span>
                  <span className={styles.itemTag} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                    Cap: {String(rule.value || 'N/A')} {String(rule.unit || '')}
                  </span>
                </div>
                <div className={styles.itemQuote}>&ldquo;{(p.metadata.quote as string) || p.content}&rdquo;</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Promotional Validity (Rule 2) */}
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={`${styles.iconWrap} ${styles.iconOffer}`}>📅</div>
            <h3 className={styles.title}>Promotional Windows</h3>
          </div>
          <Link href="/policies?cat=offer_validity" className={styles.link}>
            View Policies &rarr;
          </Link>
        </div>
        <p className={styles.desc}>
          Time-bound campaign constraints enforced by Rule 2. Offers scanned after the expiration date are rejected.
        </p>
        <div className={styles.itemsList}>
          {offerPolicies.map((p) => {
            const exp = (p.metadata.valid_until as string) || (p.rules[0] as { valid_until?: string })?.valid_until;
            return (
              <div key={p.id} className={styles.itemBox}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemTitle}>{p.title}</span>
                  <span className={styles.itemTag} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                    Expires: {exp || 'Indefinite'}
                  </span>
                </div>
                <div className={styles.itemQuote}>&ldquo;{(p.metadata.quote as string) || p.content}&rdquo;</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Claim Substantiation (Rule 4) */}
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={`${styles.iconWrap} ${styles.iconClaim}`}>🛡️</div>
            <h3 className={styles.title}>Claim Substantiation</h3>
          </div>
          <Link href="/policies?cat=claims" className={styles.link}>
            View Policies &rarr;
          </Link>
        </div>
        <p className={styles.desc}>
          Superlative or unconditional guarantee statements require pre-approved legal evidence. Lacking evidence triggers an &ldquo;unverified claim&rdquo; alert.
        </p>
        <div className={styles.itemsList}>
          {claimPolicies.map((p) => (
            <div key={p.id} className={styles.itemBox}>
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{p.title}</span>
                <span className={styles.itemTag} style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  Substantiation Required
                </span>
              </div>
              <div className={styles.itemQuote}>&ldquo;{(p.metadata.quote as string) || p.content}&rdquo;</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
