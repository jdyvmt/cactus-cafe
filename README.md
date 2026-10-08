:root {
    --primary: #2ecc71;
    --secondary: #27ae60;
    --dark: #2c3e50;
    --light: #ecf0f1;
    --border: #bdc3c7;
    --text: #2c3e50;
    --panel: #ffffff;
    --soft: #f6faf7;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #f5f7fa 0%, #dfeaf7 100%);
    color: var(--text);
    min-height: 100vh;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

header {
    text-align: center;
    margin-bottom: 24px;
    background: white;
    padding: 28px 20px;
    border-radius: 14px;
    box-shadow: 0 10px 25px rgba(44, 62, 80, 0.08);
}

header h1 {
    font-size: 2.6rem;
    margin: 0 0 8px;
    color: var(--primary);
}

.subtitle { color: #7b8a93; font-size: 0.95rem; }

.navbar {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
    background: white;
    padding: 14px;
    border-radius: 12px;
    box-shadow: 0 8px 18px rgba(44, 62, 80, 0.06);
    flex-wrap: wrap;
}

.nav-btn {
    border: 1px solid var(--border);
    background: white;
    color: var(--text);
    padding: 10px 18px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.98rem;
    font-weight: 600;
    transition: all 0.2s ease;
}

.nav-btn:hover { background: var(--light); }
.nav-btn.active {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
}

.toolbar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 26px;
}

.btn {
    border: none;
    border-radius: 8px;
    padding: 11px 18px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.btn:hover { transform: translateY(-1px); }
.btn-primary {
    background: var(--primary);
    color: white;
    box-shadow: 0 8px 18px rgba(46, 204, 113, 0.24);
}
.btn-secondary {
    background: #f3f7f4;
    color: var(--text);
    border: 1px solid var(--border);
}
.btn-danger {
    background: #e74c3c;
    color: white;
}
.btn-small {
    padding: 7px 12px;
    font-size: 0.85rem;
}

.upload-btn { cursor: pointer; }

.tab-content {
    display: none;
    background: white;
    border-radius: 14px;
    box-shadow: 0 10px 25px rgba(44, 62, 80, 0.06);
    padding: 28px;
}
.tab-content.active { display: block; }

.tab-content h2 {
    margin: 0 0 24px;
    color: var(--primary);
    font-size: 1.75rem;
}

.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 18px;
    margin-bottom: 26px;
}

.card {
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
    padding: 22px 18px;
    border-radius: 14px;
    text-align: center;
    box-shadow: 0 12px 20px rgba(46, 204, 113, 0.18);
}
.card h3 {
    margin: 0 0 12px;
    font-size: 0.9rem;
    opacity: 0.95;
}
.card .amount {
    margin: 0;
    font-size: clamp(1.8rem, 2.2vw, 2.5rem);
    font-weight: 800;
}

.chart-container,
.report-content,
.form-container,
.history-panel,
.report-summary,
.comparison-card {
    background: var(--soft);
    border: 1px solid #e7f0ea;
    border-radius: 12px;
}

.chart-container {
    padding: 18px 18px 10px;
    margin-bottom: 24px;
}
.chart-container h3 { margin: 0 0 12px; color: var(--primary); }

.recent-entries h3,
.entries-list h3 { margin: 0 0 14px; color: var(--primary); }

.entry-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
    background: #fafdfb;
    border-left: 4px solid var(--primary);
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 12px;
}
.entry-info { flex: 1; }
.entry-date { font-weight: 700; color: var(--primary); margin-bottom: 6px; }
.entry-details { color: #6f7b80; font-size: 0.9rem; margin-top: 3px; }
.entry-amount { font-size: 1.3rem; font-weight: 800; color: var(--primary); }

.form-container {
    padding: 20px;
}
.form-group {
    margin-bottom: 16px;
}
.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 700;
    color: var(--dark);
}
.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    padding: 11px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    font-size: 1rem;
    background: white;
}
.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.10);
}
textarea { min-height: 90px; resize: vertical; }

.history-panel {
    padding: 18px;
}
.history-panel h3 {
    color: var(--primary);
    margin: 0 0 16px;
}
.history-item {
    background: white;
    border: 1px solid #e5efe8;
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 12px;
}
.history-fields {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 12px;
    align-items: end;
}

.bonus-item {
    background: white;
    border: 1px solid #e5efe8;
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 12px;
}
.bonus-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}
.bonus-header-row h4 { margin: 0; color: var(--primary); }
.bonus-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 10px;
}
.bonus-row-checkboxes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
}
.checkbox-inline {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 7px 9px;
    background: #f7faf8;
}

.cloud-config {
    padding: 18px;
    background: #f9fdfb;
    border: 1px solid #e7f0ea;
    border-radius: 12px;
}
.cloud-config h3 {
    margin: 0 0 16px;
    color: var(--primary);
}
.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
}
.button-stack {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 16px;
}

.report-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    background: #f9fdfb;
    border: 1px solid #e7f0ea;
    border-radius: 12px;
    padding: 18px;
    margin-bottom: 24px;
}
.report-selector label { font-weight: 700; }
.report-selector input {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: white;
}

.report-content {
    padding: 18px;
}
.report-summary {
    padding: 18px;
    margin-bottom: 18px;
}
.report-summary h4 {
    margin: 0 0 10px;
    color: var(--primary);
}
.report-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
}
.report-table th,
.report-table td {
    padding: 12px 10px;
    text-align: left;
    border-bottom: 1px solid #edf3ef;
}
.report-table th {
    background: var(--primary);
    color: white;
    font-weight: 700;
}
.report-table tr:hover { background: #f7faf8; }

.comparison {
    display: grid;
    grid-template-columns: repeat(2, minmax(220px, 1fr));
    gap: 18px;
    margin-bottom: 18px;
}
.comparison-card {
    padding: 18px;
    text-align: center;
}
.comparison-card h4 { margin: 0 0 12px; color: var(--primary); }
.comparison-amount {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--primary);
}
.positive { color: #27ae60; font-weight: 700; }
.negative { color: #e74c3c; font-weight: 700; }

.empty-state {
    text-align: center;
    color: #7a8b90;
    padding: 40px 20px;
}

@media (max-width: 768px) {
    .container { padding: 14px; }
    header h1 { font-size: 2rem; }
    .navbar { flex-direction: column; }
    .nav-btn { width: 100%; }
    .history-fields,
    .bonus-row,
    .comparison { grid-template-columns: 1fr; }
    .entry-item {
        flex-direction: column;
        align-items: flex-start;
    }
    .button-stack,
    .toolbar { flex-direction: column; }
    .btn { width: 100%; }
}

@media (max-width: 480px) {
    .tab-content { padding: 18px; }
}

