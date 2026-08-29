import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './admin.css';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s — Admin' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  // admin-scope isolates our CSS variables from the portfolio's global vars
  return <div className="admin-scope">{children}</div>;
}
