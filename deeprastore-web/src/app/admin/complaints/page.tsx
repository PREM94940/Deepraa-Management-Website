export default function ComplaintsPage() {
    return (
        <div style={{ padding: '24px' }}>
            <div className="content-header">
                <h1>Centralized Complaints & Returns</h1>
                <p>Manage all customer issues in one place. (Coming in Phase 4)</p>
            </div>
            <div style={{ background: '#FFF', padding: '40px', textAlign: 'center', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', color: '#EF4444', marginBottom: '16px' }}></i>
                <h2>Complaints System Setup</h2>
                <p style={{ color: '#64748B', marginTop: '8px' }}>This module will track issues, handle refunds securely, and maintain a full audit trail to avoid consumer court risks.</p>
            </div>
        </div>
    );
}
