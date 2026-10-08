:root {
    --primary: #2ecc71;
    --secondary: #27ae60;
    --dark: #2c3e50;
    --light: #ecf0f1;
    --border: #bdc3c7;
    --text: #2c3e50;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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
    margin-bottom: 30px;
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

header h1 {
    font-size: 2.5em;
    color: var(--primary);
    margin-bottom: 10px;
}

.subtitle {
    color: #7f8c8d;
    font-size: 0.9em;
}

.navbar {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    flex-wrap: wrap;
    background: white;
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.toolbar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 30px;
}

.nav-btn {
    padding: 10px 20px;
    border: 2px solid var(--border);
    background: white;
    color: var(--text);
    cursor: pointer;
    border-radius: 5px;
    font-size: 1em;
    transition: all 0.3s;
}

.nav-btn:hover {
    background: var(--light);
}

.nav-btn.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
}

.tab-content {
    display: none;
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 2px 15px rgba(0,0,0,0.1);
}

.tab-content.active {
    display: block;
}

.tab-content h2 {
    margin-bottom: 25px;
    color: var(--primary);
}

.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.card {
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
    padding: 25px;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
}

.card h3 {
    font-size: 0.9em;
    opacity: 0.9;
    margin-bottom: 10px;
}

.card .amount {
    font-size: 2em;
    font-weight: bold;
    margin-bottom: 5px;
}

.chart-container {
    margin-bottom: 30px;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 10px;
}

.chart-container h3 {
    margin-bottom: 15px;
    color: var(--primary);
}

.form-container {
    background: #f9f9f9;
    padding: 25px;
    border-radius: 10px;
    margin-bottom: 30px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: var(--text);
}

.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    padding: 12px;
    border: 2px solid var(--border);
    border-radius: 5px;
    font-size: 1em;
    transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--primary);
    background: #f0f9f6;
}

.form-group textarea {
    resize: vertical;
    min-height: 80px;
}

.btn {
    padding: 12px 25px;
    border: none;
    border-radius: 5px;
    font-size: 1em;
    cursor: pointer;
    transition: all 0.3s;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.btn-primary {
    background: var(--primary);
    color: white;
}

.btn-primary:hover {
    background: var(--secondary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
}

.btn-secondary {
    background: var(--light);
    color: var(--text);
    border: 2px solid var(--border);
}

.btn-secondary:hover {
    background: #e0e0e0;
}

.btn-danger {
    background: #e74c3c;
    color: white;
}

.btn-danger:hover {
    background: #c0392b;
}

.btn-small {
    padding: 6px 12px;
    font-size: 0.9em;
}

.upload-btn {
    cursor: pointer;
}

.entries-list,
.recent-entries {
    margin-top: 30px;
}

.entries-list h3,
.recent-entries h3 {
    margin-bottom: 15px;
    color: var(--primary);
}

.entry-item {
    background: #f9f9f9;
    padding: 15px;
    margin-bottom: 10px;
    border-left: 4px solid var(--primary);
    border-radius: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.entry-info {
    flex-grow: 1;
}

.entry-date {
    font-weight: 600;
    color: var(--primary);
    margin-bottom: 5px;
}

.entry-details {
    font-size: 0.9em;
    color: #7f8c8d;
    margin-bottom: 5px;
}

.entry-amount {
    font-size: 1.3em;
    font-weight: bold;
    color: var(--primary);
}

.entry-actions {
    margin-left: 15px;
}

.history-panel {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
    padding: 20px;
}

.history-panel h3 {
    color: var(--primary);
    margin-bottom: 15px;
}

.history-item {
    margin-bottom: 15px;
    padding: 15px;
    background: #f9f9f9;
    border-radius: 8px;
}

.history-fields {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 12px;
    align-items: end;
}

.bonus-item {
    background: #f9f9f9;
    padding: 20px;
    margin-bottom: 15px;
    border: 2px solid var(--border);
    border-radius: 5px;
}

.bonus-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.bonus-item h4 {
    color: var(--primary);
}

.bonus-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 12px;
}

.bonus-row-checkboxes {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 12px;
}

.checkbox-inline {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 15px;
}

.button-stack {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 20px;
}

.report-selector {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 30px;
    display: flex;
    gap: 15px;
    align-items: center;
    flex-wrap: wrap;
}

.report-selector label {
    font-weight: 600;
}

.report-selector input {
    padding: 10px;
    border: 2px solid var(--border);
    border-radius: 5px;
}

.report-content {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 10px;
}

.report-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
}

.report-table th,
.report-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid var(--border);
}

.report-table th {
    background: var(--primary);
    color: white;
    font-weight: 600;
}

.report-table tr:hover {
    background: #f0f9f6;
}

.report-summary {
    background: white;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
    border-left: 4px solid var(--primary);
}

.report-summary h4 {
    color: var(--primary);
    margin-bottom: 10px;
}

.comparison {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

.comparison-card {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
}

.comparison-card h4 {
    color: var(--primary);
    margin-bottom: 10px;
}

.comparison-amount {
    font-size: 1.8em;
    font-weight: bold;
    color: var(--primary);
    margin-bottom: 10px;
}

.comparison-diff {
    font-size: 1.1em;
    font-weight: 600;
}

.positive { color: #27ae60; }
.negative { color: #e74c3c; }

.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #95a5a6;
}

.empty-state p {
    font-size: 1.1em;
}

@media (max-width: 768px) {
    header h1 {
        font-size: 1.8em;
    }

    .navbar {
        flex-direction: column;
    }

    .nav-btn {
        width: 100%;
        text-align: left;
    }

    .toolbar {
        flex-direction: column;
    }

    .dashboard-grid {
        grid-template-columns: 1fr;
    }

    .history-fields,
    .bonus-row {
        grid-template-columns: 1fr;
    }

    .comparison {
        grid-template-columns: 1fr;
    }

    .entry-item {
        flex-direction: column;
        align-items: flex-start;
    }

    .entry-actions {
        margin-left: 0;
        margin-top: 10px;
        width: 100%;
    }
}
