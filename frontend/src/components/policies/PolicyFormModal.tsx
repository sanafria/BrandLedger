'use client';

import React, { useState, useEffect } from 'react';
import { PolicyCard, PolicyCategory, PolicyStatus, LimitType } from '@/types/policy';
import { policyClient } from '@/lib/api/policyClient';
import styles from './PolicyFormModal.module.css';

interface PolicyFormModalProps {
  initialPolicy?: PolicyCard | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (policy: PolicyCard) => void;
}

export const PolicyFormModal: React.FC<PolicyFormModalProps> = ({
  initialPolicy,
  isOpen,
  onClose,
  onSaved,
}) => {
  const isEdit = !!initialPolicy;

  const [id, setId] = useState('');
  const [version, setVersion] = useState('1.0');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PolicyCategory>('terminology');
  const [status, setStatus] = useState<PolicyStatus>('approved');
  const [content, setContent] = useState('');
  const [quote, setQuote] = useState('');
  const [author, setAuthor] = useState('');
  const [approvedBy, setApprovedBy] = useState('');

  // Category specific states
  const [prohibited, setProhibited] = useState('');
  const [replacement, setReplacement] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [offerName, setOfferName] = useState('');
  const [metric, setMetric] = useState('');
  const [numValue, setNumValue] = useState<number | ''>('');
  const [unit, setUnit] = useState('');
  const [limitType, setLimitType] = useState<LimitType>('max');
  const [requiresEvidence, setRequiresEvidence] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPolicy) {
      setId(initialPolicy.id);
      setVersion(initialPolicy.version);
      setTitle(initialPolicy.title);
      setCategory(initialPolicy.category as PolicyCategory);
      setStatus(initialPolicy.status || 'approved');
      setContent(initialPolicy.content);

      const q = (initialPolicy.metadata.quote as string) || (initialPolicy.rules[0] as { quote?: string })?.quote || '';
      setQuote(q);

      setAuthor(String(initialPolicy.metadata.author || ''));
      setApprovedBy(String(initialPolicy.metadata.approved_by || ''));

      // Category specific
      const r = (initialPolicy.rules[0] || {}) as Record<string, unknown>;
      setProhibited(String(r.prohibited || ''));
      setReplacement(String(r.replacement || ''));
      setValidUntil(String(initialPolicy.metadata.valid_until || r.valid_until || ''));
      setOfferName(String(initialPolicy.metadata.offer_name || r.offer_name || ''));
      setMetric(String(r.metric || ''));
      setNumValue(r.value !== undefined ? Number(r.value) : '');
      setUnit(String(r.unit || ''));
      setLimitType((r.limit_type as LimitType) || 'max');
      setRequiresEvidence(r.requires_evidence !== undefined ? Boolean(r.requires_evidence) : true);
    } else {
      // Default new policy
      setId(`pol_${category}_${Math.floor(100 + Math.random() * 900)}`);
      setVersion('1.0');
      setTitle('');
      setCategory('terminology');
      setStatus('approved');
      setContent('');
      setQuote('');
      setAuthor('Brand Governance Team');
      setApprovedBy('Legal Director');
      setProhibited('');
      setReplacement('');
      setValidUntil('');
      setOfferName('');
      setMetric('');
      setNumValue('');
      setUnit('');
      setLimitType('max');
      setRequiresEvidence(true);
    }
    setError(null);
  }, [initialPolicy, isOpen, category]);

  if (!isOpen) return null;

  // Live quote check
  const quoteCheck = quote ? policyClient.verifyQuoteIntegrity(content, quote) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!id.trim() || !title.trim() || !content.trim() || !version.trim()) {
      setError('ID, Title, Version, and Policy Content are required.');
      return;
    }

    if (quote.trim()) {
      const check = policyClient.verifyQuoteIntegrity(content, quote);
      if (!check.isValid) {
        setError(check.error || 'Quote verification failed.');
        return;
      }
    }

    // Build structured rule matching category
    let constructedRules: Record<string, unknown>[] = [];
    if (category === 'terminology') {
      constructedRules = [
        {
          type: 'terminology',
          prohibited: prohibited.trim(),
          replacement: replacement.trim(),
          quote: quote.trim() || content.trim(),
        },
      ];
    } else if (category === 'offer_validity') {
      constructedRules = [
        {
          type: 'offer_validity',
          offer_name: offerName.trim() || title.trim(),
          valid_until: validUntil.trim(),
          quote: quote.trim() || content.trim(),
        },
      ];
    } else if (category === 'numerical') {
      constructedRules = [
        {
          type: 'numerical',
          metric: metric.trim(),
          value: Number(numValue) || 0,
          unit: unit.trim(),
          limit_type: limitType,
          quote: quote.trim() || content.trim(),
        },
      ];
    } else if (category === 'claims') {
      constructedRules = [
        {
          type: 'claim_verification',
          requires_evidence: requiresEvidence,
          quote: quote.trim() || content.trim(),
        },
      ];
    } else {
      constructedRules = [
        {
          type: `${category}_rule`,
          quote: quote.trim() || content.trim(),
        },
      ];
    }

    const payload: Omit<PolicyCard, 'created_at' | 'updated_at'> = {
      id: id.trim(),
      version: version.trim(),
      title: title.trim(),
      category,
      status,
      content: content.trim(),
      rules: constructedRules,
      metadata: {
        brand_id: initialPolicy?.metadata?.brand_id || 'brand_apex_01',
        brand_name: initialPolicy?.metadata?.brand_name || 'Apex Health Technologies',
        author: author.trim(),
        approved_by: approvedBy.trim(),
        quote: quote.trim() || content.trim(),
        ...(category === 'offer_validity' ? { valid_until: validUntil.trim(), offer_name: offerName.trim() } : {}),
        ...(category === 'terminology' && prohibited ? { prohibited_terms: [{ term: prohibited.trim(), replacement: replacement.trim() }] } : {}),
      },
    };

    try {
      if (isEdit) {
        const updated = await policyClient.updatePolicy(id, payload);
        onSaved(updated);
      } else {
        const created = await policyClient.createPolicy(payload);
        onSaved(created);
      }
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to save policy');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEdit ? `Edit Policy ${id}` : 'Create Brand Policy'}</h2>
          <button type="button" className={styles.btnClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>
                Policy ID <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={id}
                onChange={(e) => setId(e.target.value)}
                disabled={isEdit}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Version <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0"
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Policy Title <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Brand Terminology Policy"
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>
                Category <span className={styles.required}>*</span>
              </label>
              <select
                className={styles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value as PolicyCategory)}
              >
                <option value="terminology">Terminology (Rule 1)</option>
                <option value="offer_validity">Offer Validity (Rule 2)</option>
                <option value="numerical">Numerical Limits (Rule 3)</option>
                <option value="claims">Claim Substantiation (Rule 4)</option>
                <option value="tone">Voice &amp; Tone</option>
                <option value="visual">Visual Assets &amp; Logo</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Governance Status</label>
              <select
                className={styles.select}
                value={status}
                onChange={(e) => setStatus(e.target.value as PolicyStatus)}
              >
                <option value="approved">Approved</option>
                <option value="draft">Draft (Under Review)</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Full Policy Content <span className={styles.required}>*</span>
            </label>
            <textarea
              className={styles.textarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="The exact legal or governance text approved for this brand requirement..."
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Verified Source Quotation (&ldquo;No receipt, no flag&rdquo;)
            </label>
            <input
              type="text"
              className={styles.input}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Must be an EXACT, literal substring from the content above..."
            />
            {quote && (
              <div
                className={`${styles.quoteValidationBox} ${
                  quoteCheck?.isValid ? styles.quoteValid : styles.quoteInvalid
                }`}
              >
                {quoteCheck?.isValid ? (
                  <span>✓ Quote matches verbatim in content text (&ldquo;No receipt, no flag&rdquo; compliant)</span>
                ) : (
                  <span>✕ Quote was NOT found verbatim in the content text above!</span>
                )}
              </div>
            )}
          </div>

          {/* Category-specific fields */}
          <div className={styles.categoryCard}>
            <span className={styles.categoryTitle}>{category.replace('_', ' ')} Specifications</span>

            {category === 'terminology' && (
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Prohibited Term</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={prohibited}
                    onChange={(e) => setProhibited(e.target.value)}
                    placeholder="e.g. Customers"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Approved Replacement</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={replacement}
                    onChange={(e) => setReplacement(e.target.value)}
                    placeholder="e.g. Members"
                  />
                </div>
              </div>
            )}

            {category === 'offer_validity' && (
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Offer Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={offerName}
                    onChange={(e) => setOfferName(e.target.value)}
                    placeholder="e.g. Summer Discount"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Valid Until (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
              </div>
            )}

            {category === 'numerical' && (
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Metric Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                    placeholder="e.g. reward"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Cap / Limit Value</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={numValue}
                    onChange={(e) => setNumValue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 500"
                  />
                </div>
              </div>
            )}

            {category === 'claims' && (
              <div className={styles.field}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={requiresEvidence}
                    onChange={(e) => setRequiresEvidence(e.target.checked)}
                  />
                  <span>Mandate prior legal substantiation and clinical documentation</span>
                </label>
              </div>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Author</label>
              <input
                type="text"
                className={styles.input}
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Clinical Governance Board"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Approved By</label>
              <input
                type="text"
                className={styles.input}
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                placeholder="e.g. Legal Counsel"
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnSubmit}>
              {isEdit ? 'Save Changes' : 'Create Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
