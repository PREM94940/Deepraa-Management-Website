"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SettingsProvider, useSettings } from '@/components/admin/SettingsProvider';
import './admin.css';

import { getCurrentUserRoleAction } from '@/lib/actions/auth';
import { useRouter } from 'next/navigation';

function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { config } = useSettings();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [userEmail, setUserEmail] = useState('admin@deeprastore.com');
  const [userRoleName, setUserRoleName] = useState('Admin User');

  useEffect(() => {
    let mounted = true;
    async function checkSecurity() {
      // Exclude admin login page from secure layout gating to prevent redirect loops
      if (pathname === '/admin/login') {
        if (mounted) setIsVerifying(false);
        return;
      }
      try {
        const res = await getCurrentUserRoleAction();
        if (!mounted) return;
        if (!res.success || !['Staff', 'Manager'].includes(res.role)) {
          // Absolute security isolation: send unauthorized accounts back to home instantly
          router.replace('/');
          return;
        }
        setUserEmail(res.email || 'admin@deeprastore.com');
        setUserRoleName(res.role === 'Manager' ? 'Manager Account' : 'Staff Account');
        setIsVerifying(false);
      } catch (err) {
        if (mounted) router.replace('/');
      }
    }
    checkSecurity();
    return () => { mounted = false; };
  }, [router, pathname]);

  let sidebarItems = [
    { id: 'overview', label: config.tabLabels.overview || 'Overview', icon: 'fa-chart-line', path: '/admin' },
    { id: 'editor', label: 'Theme Editor', icon: 'fa-paint-roller', path: '/admin/editor' },
    { id: 'activity', label: 'Activity Logs', icon: 'fa-history', path: '/admin/activity' },
    { id: 'orders', label: config.tabLabels.orders || 'Orders', icon: 'fa-shopping-bag', path: '/admin/orders' },
    { id: 'workflow', label: config.tabLabels.workflow || 'Workflow', icon: 'fa-tasks', path: '/admin/workflow' },
    { id: 'products', label: config.tabLabels.products || 'Products', icon: 'fa-tshirt', path: '/admin/products' },
    { id: 'customers', label: config.tabLabels.customers || 'Customers CRM', icon: 'fa-users', path: '/admin/customers' },
    { id: 'complaints', label: config.tabLabels.complaints || 'Complaints', icon: 'fa-exclamation-triangle', path: '/admin/complaints' },
    { id: 'analytics', label: config.tabLabels.analytics || 'Analytics', icon: 'fa-chart-bar', path: '/admin/analytics' },
    { id: 'settings', label: config.tabLabels.settings || 'Settings', icon: 'fa-cog', path: '/admin/settings' },
  ];

  if (config.hideProducts) sidebarItems = sidebarItems.filter(i => i.id !== 'products');
  if (config.hideComplaints) sidebarItems = sidebarItems.filter(i => i.id !== 'complaints');

  if (isVerifying) {
    return (
      <div className="admin-body" style={{ background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw' }}>
        <div style={{ textAlign: 'center', color: '#A3A3A3', fontFamily: 'monospace' }}>
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 'bold' }}>
            SECURE ACCESS GATEWAY: VERIFYING PRIVILEGES...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-body">
      <div className="admin-root">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '20px 0' : '24px' }}>
            
            <div style={{ display: 'flex', width: '100%', justifyContent: isCollapsed ? 'center' : 'space-between', alignItems: 'center' }}>
              {!isCollapsed ? (
                <span className="logo">
                  <i className="fas fa-gem"></i>
                  Deeprastore Admin
                </span>
              ) : (
                <span className="logo" style={{ margin: 0, padding: 0 }}>
                  <i className="fas fa-gem"></i>
                </span>
              )}

              {!isCollapsed && (
                <button 
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', fontSize: '1rem' }}
                  title="Collapse Sidebar"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
              )}
            </div>

            {isCollapsed && (
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}
                title="Expand Sidebar"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            )}

            {!isCollapsed && (
              <Link href="/" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', fontSize: '0.85rem', color: 'white', borderColor: 'rgba(255,255,255,0.5)', background: 'transparent' }}>
                <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> Back to Store
              </Link>
            )}
          </div>
          <div className="sidebar-nav">
            {sidebarItems.map(item => (
              <Link
                key={item.id}
                href={item.path}
                className={`nav-item ${item.path === '/admin' ? (pathname === '/admin' ? 'active' : '') : pathname.startsWith(item.path) ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
                style={{ padding: isCollapsed ? '12px' : '12px 24px', justifyContent: isCollapsed ? 'center' : 'flex-start' }}
              >
                <i className={`fas ${item.icon}`} style={{ margin: isCollapsed ? '0' : undefined }}></i>
                {!isCollapsed && item.label}
              </Link>
            ))}
          </div>
          {!isCollapsed && (
            <div className="sidebar-footer">
              <div className="avatar">{userRoleName[0]}</div>
              <div className="user-info">
                <h4>{userRoleName}</h4>
                <p>{userEmail}</p>
              </div>
            </div>
          )}
        </div>
        <div className={`content ${isCollapsed ? 'expanded' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <AdminSidebar>{children}</AdminSidebar>
    </SettingsProvider>
  );
}
