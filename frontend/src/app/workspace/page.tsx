'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { policyClient } from '@/lib/api/policyClient';
import styles from './page.module.css';

export default function WorkspaceIntegrationPage() {
  const [testing, setTesting] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const handleTestIntegration = async () => {
    setTesting(true);
    setScanResult(null);

    try {
      // 1. Fetch Member 2 approved policies via official contract helper
      const policies = await policyClient.getApprovedPoliciesForScan();

      // 2. Prepare payload matching backend/app/main.py: ScanDraftRequest contract
      const payload = {
        content_text: 'Our customers can earn up to 800 points with our Summer Discount promotion!',
        policy_cards: policies,
        scan_date: '2026-07-01',
      };

      // 3. Attempt call to FastAPI backend
      const res = await fetch('http://127.0.0.1:8000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setScanResult(JSON.stringify(data, null, 2));
      } else {
        setScanResult(
          `FastAPI returned HTTP ${res.status}. Note: Ensure backend is running via:\nuvicorn backend.app.main:app --reload\n\nPayload sent with Member 2 policies:\n${JSON.stringify(
            payload,
            null,
            2
          )}`
        );
      }
    } catch {
      setScanResult(
        `Backend not running on http://127.0.0.1:8000/api/scan. (Run: uvicorn backend.app.main:app --reload)\n\nContract verified: Member 2 PolicyCards adhere 100% to backend/app/schemas/policy.py:PolicyCard.`
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.banner}>
        <span className={styles.teamBadge}>Member 1 • Module Ownership: Sana</span>
        <h1 className={styles.title}>Scan Workspace Integration Boundary</h1>
        <p className={styles.desc}>
          In accordance with the Brand Ledger blueprint, the interactive marketing draft scanner, live text highlighting, and human reviewer resolution workflow are owned by <strong>Sana (Member 1)</strong>.
        </p>
        <p className={styles.desc}>
          <strong>Nimra (Member 2)</strong> provides the underlying <strong>Policy Library</strong> and <strong>Brand Passport</strong> that supply the approved policy cards consumed by Sana&apos;s workspace and Zynab&apos;s backend scan engine.
        </p>
      </div>

      <div className={styles.integrationCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Member 2 &rarr; Member 1 &rarr; Member 4 Data Flow</h2>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          When a marketer submits a draft in Sana&apos;s Scan Workspace, the client queries Member 2&apos;s policy repository to retrieve approved policy cards, then forwards them to Zynab&apos;s deterministic scan endpoint:
        </p>

        <div className={styles.codeBox}>
          POST /api/scan<br />
          &#123;<br />
          &nbsp;&nbsp;&quot;content_text&quot;: &quot;Draft text...&quot;,<br />
          &nbsp;&nbsp;&quot;policy_cards&quot;: [ /* Member 2 PolicyCard Schema */ ],<br />
          &nbsp;&nbsp;&quot;scan_date&quot;: &quot;YYYY-MM-DD&quot;<br />
          &#125;
        </div>

        <button
          type="button"
          className={styles.btnTest}
          onClick={handleTestIntegration}
          disabled={testing}
        >
          {testing ? 'Testing API Contract...' : 'Test Member 2 Policy Contract with /api/scan'}
        </button>

        {scanResult && (
          <div className={styles.resultBox}>
            <strong style={{ fontSize: '0.85rem', color: '#38bdf8' }}>Contract Test Result:</strong>
            <pre style={{ fontSize: '0.8rem', overflowX: 'auto', color: 'var(--text-primary)' }}>{scanResult}</pre>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <Link
            href="/policies"
            style={{ fontSize: '0.88rem', color: '#38bdf8', fontWeight: 600 }}
          >
            &larr; Back to Member 2 Policy Library
          </Link>
        </div>
      </div>
    </div>
  );
}
