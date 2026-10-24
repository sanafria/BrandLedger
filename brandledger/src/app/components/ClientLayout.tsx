'use client';

import React from 'react';
import Sidebar from './Sidebar';
import { useApp } from '../context/AppContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useApp();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          marginLeft: 260,
          padding: '28px 32px',
          minHeight: '100vh',
          transition: 'margin-left 0.3s',
        }}
        className="main-content"
      >
        {children}
      </main>
    </div>
  );
}
