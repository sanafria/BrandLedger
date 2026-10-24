'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  PolicyCard, ContentSubmission, ContentPassport, AuditEntry, User,
  initialPolicyCards, initialSubmissions, initialPassports, initialAuditLog, users,
  ContentStatus, PassportStatus, FindingAction, Finding
} from '../data/store';

interface AppContextType {
  // Current user
  currentUser: User;
  setCurrentUser: (user: User) => void;
  
  // Policy Cards
  policyCards: PolicyCard[];
  addPolicyCard: (card: PolicyCard) => void;
  updatePolicyCard: (id: string, updates: Partial<PolicyCard>) => void;
  
  // Submissions
  submissions: ContentSubmission[];
  addSubmission: (sub: ContentSubmission) => void;
  updateSubmissionStatus: (id: string, status: ContentStatus, reviewerId?: string, reviewComment?: string) => void;
  updateFindingAction: (subId: string, findingId: string, action: FindingAction, reason?: string) => void;
  
  // Passports
  passports: ContentPassport[];
  addPassport: (passport: ContentPassport) => void;
  revokePassport: (id: string) => void;
  
  // Audit
  auditLog: AuditEntry[];
  addAuditEntry: (entry: AuditEntry) => void;
  
  // Users
  allUsers: User[];

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(users[0]); // Default: Alex (Manager)
  const [policyCards, setPolicyCards] = useState<PolicyCard[]>(initialPolicyCards);
  const [submissions, setSubmissions] = useState<ContentSubmission[]>(initialSubmissions);
  const [passports, setPassports] = useState<ContentPassport[]>(initialPassports);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(initialAuditLog);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const addPolicyCard = (card: PolicyCard) => {
    setPolicyCards(prev => [card, ...prev]);
    addAuditEntry({
      id: `a${Date.now()}`,
      action: 'Card Created',
      actor: currentUser.name,
      target: card.id,
      timestamp: new Date().toISOString(),
      details: `Created "${card.title}" policy card`,
    });
  };

  const updatePolicyCard = (id: string, updates: Partial<PolicyCard>) => {
    setPolicyCards(prev => prev.map(c => c.id === id ? { ...c, ...updates, version: c.version + 1, updatedAt: new Date().toISOString() } : c));
    
    // Change Impact Loop: revoke passports that depend on this card
    setPassports(prev => prev.map(p => {
      const depends = p.dependencies.some(d => d.cardId === id);
      if (depends && p.status === 'valid') {
        addAuditEntry({
          id: `a${Date.now()}_revoke`,
          action: 'Passport Revoked',
          actor: 'System',
          target: p.id,
          timestamp: new Date().toISOString(),
          details: `Revoked — linked card ${id} was updated`,
        });
        return { ...p, status: 'revalidation_required' as PassportStatus };
      }
      return p;
    }));
    
    addAuditEntry({
      id: `a${Date.now()}`,
      action: 'Card Updated',
      actor: currentUser.name,
      target: id,
      timestamp: new Date().toISOString(),
      details: `Updated "${updates.title || id}" policy card`,
    });
  };

  const addSubmission = (sub: ContentSubmission) => {
    setSubmissions(prev => [sub, ...prev]);
    addAuditEntry({
      id: `a${Date.now()}`,
      action: 'Content Submitted',
      actor: currentUser.name,
      target: sub.id,
      timestamp: new Date().toISOString(),
      details: `Submitted "${sub.title}"`,
    });
  };

  const updateSubmissionStatus = (id: string, status: ContentStatus, reviewerId?: string, reviewComment?: string) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status, reviewerId, reviewComment } : s));
    
    if (status === 'approved') {
      const sub = submissions.find(s => s.id === id);
      if (sub) {
        const passportId = `PASSPORT_${Date.now().toString().slice(-6)}`;
        const cardIds = [...new Set(sub.findings.map(f => f.sourceCardId))];
        const deps = cardIds.map(cid => {
          const card = policyCards.find(c => c.id === cid);
          return { cardId: cid, cardTitle: card?.title || cid, version: card?.version || 1 };
        });
        const newPassport: ContentPassport = {
          id: passportId,
          contentId: id,
          contentTitle: sub.title,
          status: 'valid',
          approvedBy: currentUser.name,
          approvedAt: new Date().toISOString(),
          findingsResolved: sub.findings.filter(f => f.action === 'accepted' || f.action === 'edited').length,
          findingsDismissed: sub.findings.filter(f => f.action === 'dismissed').length,
          dependencies: deps,
        };
        addPassport(newPassport);
        setSubmissions(prev => prev.map(s => s.id === id ? { ...s, passportId } : s));
      }
    }
    
    addAuditEntry({
      id: `a${Date.now()}`,
      action: status === 'approved' ? 'Content Approved' : status === 'rejected' ? 'Content Rejected' : 'Status Changed',
      actor: currentUser.name,
      target: id,
      timestamp: new Date().toISOString(),
      details: `${reviewComment || `Status changed to ${status}`}`,
    });
  };

  const updateFindingAction = (subId: string, findingId: string, action: FindingAction, reason?: string) => {
    setSubmissions(prev => prev.map(s => {
      if (s.id !== subId) return s;
      return {
        ...s,
        findings: s.findings.map(f => f.id === findingId ? { ...f, action, dismissReason: reason } : f),
      };
    }));
  };

  const addPassport = (passport: ContentPassport) => {
    setPassports(prev => [passport, ...prev]);
    addAuditEntry({
      id: `a${Date.now()}_p`,
      action: 'Passport Issued',
      actor: 'System',
      target: passport.id,
      timestamp: new Date().toISOString(),
      details: `Passport issued for "${passport.contentTitle}"`,
    });
  };

  const revokePassport = (id: string) => {
    setPassports(prev => prev.map(p => p.id === id ? { ...p, status: 'revoked' as PassportStatus } : p));
    addAuditEntry({
      id: `a${Date.now()}`,
      action: 'Passport Revoked',
      actor: currentUser.name,
      target: id,
      timestamp: new Date().toISOString(),
      details: `Passport ${id} manually revoked`,
    });
  };

  const addAuditEntry = (entry: AuditEntry) => {
    setAuditLog(prev => [entry, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      policyCards, addPolicyCard, updatePolicyCard,
      submissions, addSubmission, updateSubmissionStatus, updateFindingAction,
      passports, addPassport, revokePassport,
      auditLog, addAuditEntry,
      allUsers: users,
      sidebarOpen, setSidebarOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
