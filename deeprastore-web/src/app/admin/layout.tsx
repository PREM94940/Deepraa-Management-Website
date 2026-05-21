"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './admin.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: 'fa-chart-line', path: '/admin' },
    { id: 'orders', label: 'Orders', icon: 'fa-shopping-bag', path: '/admin/orders' },
    { id: 'workflow', label: 'Workflow', icon: 'fa-tasks', path: '/admin/workflow' },
    { id: 'products', label: 'Products', icon: 'fa-tshirt', path: '/admin/products' },
    { id: 'customers', label: 'Customers CRM', icon: 'fa-users', path: '/admin/customers' },
    { id: 'complaints', label: 'Complaints', icon: 'fa-exclamation-triangle', path: '/admin/complaints' },
    { id: 'analytics', label: 'Analytics', icon: 'fa-chart-bar', path: '/admin/analytics' },
    { id: 'settings', label: 'Settings', icon: 'fa-cog', path: '/admin/settings' },
  ];

  return (
    <div className="admin-body">
      <div className="admin-root">
        {/* FontAwesome integration for icons based on prototype */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        
        <div className="sidebar">
          <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
            <span className="logo">
              <i className="fas fa-gem"></i>
              Deeprastore Admin
            </span>
            <Link href="/" className="btn btn-outline" style={{ width: '100%', textAlign: 'center', fontSize: '0.85rem' }}>
              <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> Back to Store
            </Link>
          </div>
          <div className="sidebar-nav">
            {sidebarItems.map(item => (
              <Link
                key={item.id}
                href={item.path}
                className={`nav-item ${pathname === item.path ? 'active' : ''}`}
              >
                <i className={`fas ${item.icon}`}></i>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="sidebar-footer">
            <div className="avatar">A</div>
            <div className="user-info">
              <h4>Admin User</h4>
              <p>admin@deeprastore.com</p>
            </div>
          </div>
        </div>

        <div className="content">
          {children}
        </div>
      </div>
    </div>
  );
}
