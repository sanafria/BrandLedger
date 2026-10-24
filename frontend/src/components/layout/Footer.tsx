import React from 'react';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          <div className={styles.metaInfo}>
            <div className={styles.title}>Brand Ledger Governance System</div>
            <div className={styles.subtitle}>
              Deterministic Marketing Compliance • Strict Evidence Verification • Zero Hallucinations
            </div>
          </div>
          <div className={styles.teamAttribution}>
            <span>Module Owner:</span>
            <span className={styles.memberPill}>Nimra Fatima Sheikh (Member 2)</span>
          </div>
        </div>

        <div className={styles.bottomRow}>
          <div>
            Brand Ledger Blueprint v1.0 • Integrated with Zynab (M4 Rules Engine) &amp; Sana (M1 Workspace)
          </div>
          <div className={styles.statusIndicator}>
            <span className={styles.greenDot} />
            <span>Policy Store Operational • Fast-Forward Synchronized</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
