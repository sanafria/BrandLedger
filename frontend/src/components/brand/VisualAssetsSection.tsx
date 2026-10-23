'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BrandProfile } from '@/types/policy';
import styles from './VisualAssetsSection.module.css';

interface VisualAssetsSectionProps {
  brand: BrandProfile;
}

export const VisualAssetsSection: React.FC<VisualAssetsSectionProps> = ({ brand }) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  return (
    <section className={styles.section} aria-labelledby="visual-identity-title">
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 id="visual-identity-title" className={styles.title}>Visual Identity &amp; Asset Standards</h2>
          <p className={styles.subtitle}>
            Authorized color palettes, clear-space boundaries, and emblem protection rules.
          </p>
        </div>
        <Link href="/policies?cat=visual" className={styles.btnLink}>
          <span>View Asset Policies</span>
          <span>&rarr;</span>
        </Link>
      </div>

      <div className={styles.row}>
        {/* Color Palette */}
        <div className={styles.col}>
          <h3 className={styles.subTitle}>Authorized Brand Color Palette</h3>
          <div className={styles.swatchesGrid}>
            {brand.colors.map((c, idx) => (
              <div
                key={idx}
                className={styles.swatchCard}
                onClick={() => handleCopy(c.hex)}
                title="Click to copy HEX code"
              >
                <div className={styles.swatchBox} style={{ backgroundColor: c.hex }} />
                <div className={styles.swatchName}>{c.name}</div>
                <div className={styles.swatchHex}>
                  {copiedHex === c.hex ? '✓ Copied' : c.hex}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logo & Asset Usage */}
        <div className={styles.col}>
          <h3 className={styles.subTitle}>Logo Geometry &amp; Emblem Rules</h3>
          <div className={styles.guidelinesBox}>
            <div className={styles.clearspaceRule}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <rect x="7" y="7" width="10" height="10" strokeDasharray="2 2" />
              </svg>
              <span>Mandatory Clear Space: Minimum {brand.logoGuidelines.minClearSpacePx}px on all digital surfaces</span>
            </div>

            <div>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Prohibited Modifications:
              </strong>
              <ul className={styles.ruleUl} style={{ marginTop: '6px' }}>
                {brand.logoGuidelines.prohibitedModifications.map((rule, idx) => (
                  <li key={idx} className={styles.ruleLi}>
                    <span style={{ color: '#f43f5e' }}>✕</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
