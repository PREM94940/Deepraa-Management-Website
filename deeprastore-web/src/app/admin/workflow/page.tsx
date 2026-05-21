export default function WorkflowPage() {
    return (
        <div style={{ padding: '24px' }}>
            <div className="content-header">
                <h1>Order Workflow & Status Engine</h1>
                <p>Track order progress from stitching to delivery. (Coming in Phase 3)</p>
            </div>
            <div style={{ background: '#FFF', padding: '40px', textAlign: 'center', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <i className="fas fa-tasks" style={{ fontSize: '48px', color: '#CBD5E1', marginBottom: '16px' }}></i>
                <h2>Workflow Engine Setup</h2>
                <p style={{ color: '#64748B', marginTop: '8px' }}>This module will track Master notes, Stitching status, and Dispatch updates.</p>
            </div>
        </div>
    );
}
