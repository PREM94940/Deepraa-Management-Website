export default function AnalyticsPage() {
    return (
        <div>
            <div className="content-header">
                <h1>Analytics</h1>
                <p>Gather insights into your store performance.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
                <div className="chart-container">
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Revenue Overview</h3>
                    <div className="chart-bars">
                        {[40, 60, 45, 70, 55, 80, 65, 90, 75, 50, 85, 70].map((h, i) => (
                            <div key={i} className="chart-bar" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 12, color: '#6B7280' }}>
                        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                    </div>
                </div>

                <div className="chart-container">
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Sales by Category</h3>
                    <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 14, fontWeight: 600 }}>Sarees</span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#8B5CF6' }}>₹4,52,000</span>
                            </div>
                            <div style={{ height: 12, background: '#E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: '78%', background: 'linear-gradient(90deg, #8B5CF6 0%, #7C3AED 100%)', borderRadius: 6 }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
