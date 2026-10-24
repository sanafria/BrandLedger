'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.brandGroup}>
          <Link href="/" className={styles.logo}>
            <div className={styles.shieldIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span>Brand Ledger</span>
          </Link>
          <span className={styles.memberTag}>Member 2 • Governance Core</span>
        </div>

        <nav className={styles.navLinks} aria-label="Main Navigation">
          <Link
            href="/policies"
            className={`${styles.navLink} ${pathname === '/policies' ? styles.navLinkActive : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Policy Library</span>
          </Link>

          <Link
            href="/brand-passport"
            className={`${styles.navLink} ${pathname === '/brand-passport' ? styles.navLinkActive : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <circle cx="9" cy="10" r="2" />
              <path d="M15 8h2" />
              <path d="M15 12h2" />
              <path d="M7 16h10" />
            </svg>
            <span>Brand Passport</span>
          </Link>

          <Link
            href="/workspace"
            className={`${styles.navLink} ${pathname === '/workspace' ? styles.navLinkActive : ''}`}
            title="Scan Workspace (Owned by Sana - Member 1)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>Scan Workspace</span>
            <span className={styles.teamBadge}>M1: Sana</span>
          </Link>
        </nav>

        <div className={styles.rightControls}>
          <div className={styles.tenetBadge} title="Core Governance Tenet: Every finding must have approved source evidence">
            <span className={styles.pulseDot} />
            <span>&ldquo;No receipt, no flag&rdquo;</span>
          </div>
        </div>
      </div>
    </header>
  );
};
