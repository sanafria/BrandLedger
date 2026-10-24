'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Sparkles, Play, Shield, CheckCircle2, ChevronDown, ChevronUp,
  ExternalLink, Layers, Award, FileText, Zap
} from 'lucide-react';

export const DemoToolbar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const acts = [
    {
      act: 'Act 1',
      title: 'The Pitch',
      time: '0:00 - 0:30',
      href: '/',
      desc: 'No receipt, no flag · 6-Member Team Architecture',
      color: '#38bdf8',
    },
    {
      act: 'Act 2',
      title: 'Marketer Scan (Snippet A)',
      time: '0:30 - 1:15',
      href: '/workspace',
      desc: 'Disallowed addressing & expired promotion violations',
      color: '#fb7185',
    },
    {
      act: 'Act 3',
      title: 'One-Click Resolution (Snippet B)',
      time: '1:15 - 1:50',
      href: '/workspace',
      desc: 'Members standard pricing · Clean bill of health',
      color: '#34d399',
    },
    {
      act: 'Act 4',
      title: 'Reviewer Gate & Passport Mint',
      time: '1:50 - 2:25',
      href: '/review',
      desc: 'Role authorization · 403 Creator Gate · Minting',
      color: '#f59e0b',
    },
    {
      act: 'Act 5',
      title: 'SHA-256 Tamper Verification',
      time: '2:25 - 3:00',
      href: '/passports',
      desc: 'Canonical cryptographic certificate · Tamper test',
      color: '#a855f7',
    },
  ];

  return (
    <aside
      aria-label="Hackathon Demo Navigator"
      style={{
        position: 'fixed',
        bottom: 18,
        right: 18,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      {/* Expanded Menu */}
      {!collapsed && (
        <div style={{
          marginBottom: 10,
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.15)',
          width: 330,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>
              <Zap size={14} color="#38bdf8" />
              <span>3-Minute Demo Presentation Script</span>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>docs/demo-script.md</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
            {acts.map((item, idx) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    router.push(item.href);
                    setCollapsed(true);
                  }}
                  style={{
                    background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isActive ? item.color : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: item.color }}>
                      {item.act}: {item.title}
                    </span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                      {item.time}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {item.desc}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: 4 }}>
            Click any act to instantly jump during presentation
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          border: '1px solid rgba(56, 189, 248, 0.5)',
          borderRadius: 24,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.8rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 18px rgba(2, 132, 199, 0.45)',
          transition: 'all 0.2s ease',
        }}
      >
        <Sparkles size={14} color="#fde68a" />
        <span>3-Min Demo Navigator</span>
        {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
    </aside>
  );
};
