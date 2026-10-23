'use client';

import React from 'react';
import { PolicyFilterState } from '@/types/policy';
import styles from './PolicyFilters.module.css';

interface PolicyFiltersProps {
  filters: PolicyFilterState;
  onChange: (newFilters: PolicyFilterState) => void;
  onCreateClick: () => void;
}

export const PolicyFilters: React.FC<PolicyFiltersProps> = ({ filters, onChange, onCreateClick }) => {
  const categories = [
    { id: 'all', label: 'All Policies' },
    { id: 'terminology', label: 'Terminology' },
    { id: 'offer_validity', label: 'Offer Validity' },
    { id: 'numerical', label: 'Numerical Limits' },
    { id: 'claims', label: 'Claims Substantiation' },
    { id: 'tone', label: 'Voice & Tone' },
    { id: 'visual', label: 'Visual Assets' },
  ];

  return (
    <div className={styles.filterContainer}>
      <div className={styles.topRow}>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search policies by title, ID, content, prohibited terms, or metrics..."
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
          />
          {filters.searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => onChange({ ...filters, searchQuery: '' })}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.controlsGroup}>
          <select
            className={styles.selectInput}
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            aria-label="Filter by policy status"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <select
            className={styles.selectInput}
            value={filters.sortBy}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value as PolicyFilterState['sortBy'] })}
            aria-label="Sort policies by"
          >
            <option value="updated_desc">Recently Updated</option>
            <option value="title_asc">Title (A-Z)</option>
            <option value="version_desc">Version (High to Low)</option>
          </select>

          <button
            type="button"
            className={styles.btnCreate}
            onClick={onCreateClick}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Create Policy</span>
          </button>
        </div>
      </div>

      <div className={styles.categoryPills}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`${styles.pill} ${filters.category === cat.id ? styles.pillActive : ''}`}
            onClick={() => onChange({ ...filters, category: cat.id })}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};
