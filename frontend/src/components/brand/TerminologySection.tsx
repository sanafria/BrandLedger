'use client';

import React from 'react';
import Link from 'next/link';
import { PolicyCard } from '@/types/policy';
import styles from './TerminologySection.module.css';

interface TerminologySectionProps {
  policies: PolicyCard[];
}

export const TerminologySection: React.FC<TerminologySectionProps> = ({ policies }) => {
  // Extract all terminology rules from approved policies
  const termPolicies = policies.filter((p) => p.category === 'terminology');

  const termsList: Array<{
    prohibited: string;
    replacement: string;
    policyId: string;
    version: string;
    quote: string;
  }> = [];

  termPolicies.forEach((p) => {
    p.rules.forEach((rule) => {
      const r = rule as Record<string, unknown>;
      if (r.prohibited) {
        termsList.push({
          prohibited: String(r.prohibited),
          replacement: String(r.replacement || 'None'),
          policyId: p.id,
          version: p.version,
          quote: String(r.quote || p.content),
        });
      }
    });

    if (p.metadata?.prohibited_terms && Array.isArray(p.metadata.prohibited_terms)) {
      p.metadata.prohibited_terms.forEach((item: { term: string; replacement: string }) => {
        if (!termsList.some((t) => t.prohibited.toLowerCase() === item.term.toLowerCase())) {
          termsList.push({
            prohibited: item.term,
            replacement: item.replacement,
            policyId: p.id,
            version: p.version,
            quote: (p.metadata.quote as string) || p.content,
          });
        }
      });
    }
  });

  return (
    <section className={styles.section} aria-labelledby="terminology-title">
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 id="terminology-title" className={styles.title}>Approved Terminology Dictionary</h2>
          <p className={styles.subtitle}>
            Deterministic boundary checks enforced by Rule 1. Prohibited terms are flagged with exact approved replacements.
          </p>
        </div>
        <Link href="/policies?cat=terminology" className={styles.btnLink}>
          <span>Inspect in Policy Library</span>
          <span>&rarr;</span>
        </Link>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Prohibited Term</th>
              <th className={styles.th}>Mandated Replacement</th>
              <th className={styles.th}>Approved Policy &amp; Version</th>
              <th className={styles.th}>Literal Policy Evidence (&ldquo;No receipt, no flag&rdquo;)</th>
            </tr>
          </thead>
          <tbody>
            {termsList.length > 0 ? (
              termsList.map((item, idx) => (
                <tr key={idx} className={styles.tr}>
                  <td className={styles.td}>
                    <span className={styles.prohibitedBadge}>
                      <span>✕</span>
                      <span>{item.prohibited}</span>
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.approvedBadge}>
                      <span>✓</span>
                      <span>{item.replacement}</span>
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.policyRef}>
                      {item.policyId} v{item.version}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <em style={{ color: 'var(--text-primary)' }}>&ldquo;{item.quote}&rdquo;</em>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className={styles.td} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No terminology policies configured.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
