'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield, BookOpen, Layers, CheckCircle2,
  BarChart2, History, Award
} from 'lucide-react';
import styles from './Navbar.module.css';

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.brandGroup}>
          <Link href="/" className={styles.logo}>
            <div className={styles.shieldIcon}>
              <Shield size={18} strokeWidth={2.5} />
            </div>
            <span>BrandLedger</span>
          </Link>
          <span className={styles.memberTag}>Governance Suite</span>
        </div>

        <nav className={styles.navLinks} aria-label="Main Navigation">
          <Link
            href="/workspace"
            className={`${styles.navLink} ${pathname === '/workspace' ? styles.navLinkActive : ''}`}
            title="Interactive Scan Workspace (Member 1 - Sana)"
          >
            <Layers size={15} />
            <span>Workspace</span>
            <span className={styles.teamBadge}>M1</span>
          </Link>

          <Link
            href="/policies"
            className={`${styles.navLink} ${pathname === '/policies' ? styles.navLinkActive : ''}`}
            title="Brand Policy Library (Member 2 - Nimra)"
          >
            <BookOpen size={15} />
            <span>Policies</span>
            <span className={styles.teamBadge}>M2</span>
          </Link>

          <Link
            href="/review"
            className={`${styles.navLink} ${pathname === '/review' ? styles.navLinkActive : ''}`}
            title="Human Reviewer Approval Gate (Member 3 - Zoya)"
          >
            <Shield size={15} />
            <span>Review Gate</span>
          </Link>

          <Link
            href="/passports"
            className={`${styles.navLink} ${pathname === '/passports' ? styles.navLinkActive : ''}`}
            title="Cryptographic Content Passports (Member 3 - Zoya)"
          >
            <CheckCircle2 size={15} />
            <span>Passports</span>
          </Link>

          <Link
            href="/insights"
            className={`${styles.navLink} ${pathname === '/insights' ? styles.navLinkActive : ''}`}
            title="Executive Governance Analytics"
          >
            <BarChart2 size={15} />
            <span>Insights</span>
          </Link>

          <Link
            href="/audit"
            className={`${styles.navLink} ${pathname === '/audit' ? styles.navLinkActive : ''}`}
            title="Immutable Cryptographic Audit Trail"
          >
            <History size={15} />
            <span>Audit Log</span>
          </Link>

          <Link
            href="/brand-passport"
            className={`${styles.navLink} ${pathname === '/brand-passport' ? styles.navLinkActive : ''}`}
            title="Brand Identity & Voice Pillars"
          >
            <Award size={15} />
            <span>Identity</span>
          </Link>
        </nav>

        <div className={styles.rightControls}>
          <div className={styles.tenetBadge} title="Core Governance Tenet: Every finding must cite verified rule evidence">
            <span className={styles.pulseDot} />
            <span>&ldquo;No receipt, no flag&rdquo;</span>
          </div>
        </div>
      </div>
    </header>
  );
};
