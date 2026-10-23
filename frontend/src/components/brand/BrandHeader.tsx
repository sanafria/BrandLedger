'use client';

import React from 'react';
import { BrandProfile } from '@/types/policy';
import styles from './BrandHeader.module.css';

interface BrandHeaderProps {
  brand: BrandProfile;
  brands: BrandProfile[];
  onSelectBrand: (brand: BrandProfile) => void;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({ brand, brands, onSelectBrand }) => {
  return (
    <div className={styles.card}>
      <div className={styles.glow} />

      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <div className={styles.brandLabel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Brand Passport Certification • {brand.industry}</span>
          </div>
          <h1 className={styles.brandName}>{brand.name}</h1>
          <p className={styles.tagline}>{brand.tagline}</p>
        </div>

        <div className={styles.scoreCard}>
          <div className={styles.scoreValue}>{brand.governanceScore}%</div>
          <div className={styles.scoreMeta}>
            <span className={styles.scoreTitle}>Governance Score</span>
            <span className={styles.scoreSub}>Verified against 100% of rules</span>
          </div>
        </div>
      </div>

      <div className={styles.missionBox}>
        <strong style={{ color: 'var(--text-primary)' }}>Governance Mission: </strong>
        {brand.mission}
      </div>

      <div className={styles.metaRow}>
        <div className={styles.certBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Certified by: {brand.certifiedBy}</span>
        </div>
        <div>
          <span>Last Audited: {brand.lastCertifiedDate}</span>
        </div>
        {brands.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Active Brand:</span>
            <select
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.8rem',
              }}
              value={brand.id}
              onChange={(e) => {
                const found = brands.find((b) => b.id === e.target.value);
                if (found) onSelectBrand(found);
              }}
              aria-label="Select active brand profile"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
