'use client';

import React from 'react';
import { PolicyCard } from '@/types/policy';
import styles from './PolicyCardItem.module.css';

interface PolicyCardItemProps {
  policy: PolicyCard;
  onSelect: (policy: PolicyCard) => void;
  onEdit: (policy: PolicyCard) => void;
}

export const PolicyCardItem: React.FC<PolicyCardItemProps> = ({ policy, onSelect, onEdit }) => {
  const getCategoryClass = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'terminology':
        return styles.catTerminology;
      case 'offer_validity':
        return styles.catOffer;
      case 'numerical':
        return styles.catNumerical;
      case 'claims':
        return styles.catClaims;
      case 'tone':
        return styles.catTone;
      case 'visual':
        return styles.catVisual;
      default:
        return styles.catClaims;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'terminology':
        return 'Terminology';
      case 'offer_validity':
        return 'Offer Validity';
      case 'numerical':
        return 'Numerical Limits';
      case 'claims':
        return 'Claim Substantiation';
      case 'tone':
        return 'Voice & Tone';
      case 'visual':
        return 'Visual Assets';
      default:
        return cat;
    }
  };

  const getStatusComponent = () => {
    const status = policy.status || 'approved';
    if (status === 'approved') {
      return (
        <span className={styles.statusApproved}>
          <span className={styles.statusDot} />
          <span>Approved</span>
        </span>
      );
    }
    if (status === 'draft') {
      return (
        <span className={styles.statusDraft}>
          <span className={styles.statusDot} />
          <span>Draft</span>
        </span>
      );
    }
    return (
      <span className={styles.statusArchived}>
        <span className={styles.statusDot} />
        <span>Archived</span>
      </span>
    );
  };

  const sourceQuote = (policy.metadata.quote as string) || (policy.rules[0] as { quote?: string })?.quote || '';

  return (
    <article className={`${styles.card} animate-fade-in`}>
      <div className={styles.glowOverlay} />

      <div className={styles.header}>
        <div className={styles.badgeGroup}>
          <span className={styles.idBadge}>{policy.id}</span>
          <span className={styles.versionBadge}>v{policy.version}</span>
        </div>
        {getStatusComponent()}
      </div>

      <div className={styles.titleArea}>
        <span className={`${styles.categoryTag} ${getCategoryClass(policy.category)}`}>
          {getCategoryLabel(policy.category)}
        </span>
        <h3 className={styles.title}>{policy.title}</h3>
      </div>

      <p className={styles.contentSnippet}>{policy.content}</p>

      {sourceQuote && (
        <div className={styles.evidenceCallout}>
          <div className={styles.evidenceHeader}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Verified Source Quote (&ldquo;No receipt, no flag&rdquo;)</span>
          </div>
          <blockquote className={styles.evidenceQuote}>&ldquo;{sourceQuote}&rdquo;</blockquote>
        </div>
      )}

      {/* Rule summaries */}
      <div className={styles.ruleSpecs}>
        {policy.category === 'terminology' && (
          <span className={styles.ruleChip}>
            <strong>Prohibited:</strong>{' '}
            <span style={{ color: 'var(--color-terminology)' }}>
              &quot;{(policy.rules[0] as { prohibited?: string })?.prohibited || 'N/A'}&quot;
            </span>{' '}
            &rarr;{' '}
            <span style={{ color: 'var(--color-success)' }}>
              &quot;{(policy.rules[0] as { replacement?: string })?.replacement || 'N/A'}&quot;
            </span>
          </span>
        )}

        {policy.category === 'offer_validity' && (
          <span className={styles.ruleChip}>
            <strong>Valid Through:</strong>{' '}
            <span style={{ color: 'var(--color-offer)' }}>
              {(policy.metadata.valid_until as string) || (policy.rules[0] as { valid_until?: string })?.valid_until || 'Indefinite'}
            </span>
          </span>
        )}

        {policy.category === 'numerical' && (
          <span className={styles.ruleChip}>
            <strong>Cap:</strong>{' '}
            <span style={{ color: 'var(--color-numerical)' }}>
              {(policy.rules[0] as { value?: number })?.value}{' '}
              {(policy.rules[0] as { unit?: string })?.unit || ''} (
              {(policy.rules[0] as { limit_type?: string })?.limit_type || 'max'})
            </span>
          </span>
        )}

        {policy.category === 'claims' && (
          <span className={styles.ruleChip}>
            <strong>Standard:</strong>{' '}
            <span style={{ color: 'var(--color-claims)' }}>Prior Legal Substantiation Required</span>
          </span>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.dateInfo}>
          {policy.updated_at ? `Updated: ${new Date(policy.updated_at).toLocaleDateString()}` : `v${policy.version}`}
        </span>
        <div className={styles.actionButtons}>
          <button
            type="button"
            className={styles.btnEdit}
            onClick={() => onEdit(policy)}
            title="Edit Policy"
          >
            Edit
          </button>
          <button
            type="button"
            className={styles.btnDetail}
            onClick={() => onSelect(policy)}
            title="Inspect Full Rules and Governance Evidence"
          >
            <span>Inspect Rules</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
};
