"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SettingsProvider, useSettings } from '@/components/admin/SettingsProvider';
import './admin.css';

function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { config } = useSettings();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

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

  return (
    <div className="admin-body">
      <div className="admin-root">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '24px 10px' : '24px' }}>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{ position: 'absolute', right: isCollapsed ? '25px' : '15px', top: '25px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', zIndex: 10 }}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'left'}`}></i>
            </button>

            {!isCollapsed && (
              <>
                <span className="logo">
                  <i className="fas fa-gem"></i>
                  Deeprastore Admin
                </span>
                <Link href="/" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', fontSize: '0.85rem' }}>
                  <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> Back to Store
                </Link>
              </>
            )}
            {isCollapsed && (
              <span className="logo" style={{ alignSelf: 'center', margin: 0, padding: 0 }}>
                <i className="fas fa-gem"></i>
              </span>
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
              <div className="avatar">A</div>
              <div className="user-info">
                <h4>Admin User</h4>
                <p>admin@deeprastore.com</p>
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
