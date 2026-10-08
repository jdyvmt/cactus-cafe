// Data storage
const DataManager = {
    STORAGE_KEY_ENTRIES: 'cactus_work_entries',
    STORAGE_KEY_SETTINGS: 'cactus_settings',

    getEntries() {
        const data = localStorage.getItem(this.STORAGE_KEY_ENTRIES);
        return data ? JSON.parse(data) : [];
    },

    saveEntries(entries) {
        localStorage.setItem(this.STORAGE_KEY_ENTRIES, JSON.stringify(entries));
    },

    addEntry(entry) {
        const entries = this.getEntries();
        entry.id = Date.now().toString();
        entries.push(entry);
        this.saveEntries(entries);
        return entry;
    },

    deleteEntry(id) {
        let entries = this.getEntries();
        entries = entries.filter(e => e.id !== id);
        this.saveEntries(entries);
    },

    getSettings() {
        const data = localStorage.getItem(this.STORAGE_KEY_SETTINGS);
        return data ? JSON.parse(data) : {
            hourlyRate: 12.50,
            bikeAllowance: 0.50,
            bonuses: []
        };
    },

    saveSettings(settings) {
        localStorage.setItem(this.STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    }
};

// Calculator
const Calculator = {
    calculateEarnings(entry, settings) {
        const start = new Date(`2000-01-01T${entry.startTime}`);
        const end = new Date(`2000-01-01T${entry.endTime}`);
        
        let hours = (end - start) / (1000 * 60 * 60);
        if (hours < 0) hours += 24; // Handle overnight shifts

        const workDate = new Date(entry.date);
        const dayOfWeek = workDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

        let baseEarnings = hours * settings.hourlyRate;
        let bonusEarnings = 0;

        // Apply bonuses
        if (settings.bonuses) {
            settings.bonuses.forEach(bonus => {
                if (bonus.type === 'percentage') {
                    const bonusAmount = this.calculateBonusPercentage(entry, bonus, settings, hours, dayOfWeek);
                    bonusEarnings += bonusAmount;
                } else if (bonus.type === 'fixed') {
                    if (this.bonusAppliesToDay(bonus, dayOfWeek)) {
                        bonusEarnings += bonus.amount;
                    }
                }
            });
        }

        // Add bike allowance
        let bikeAllowance = 0;
        if (settings.bikeAllowance && settings.bikeAllowance > 0) {
            bikeAllowance = settings.bikeAllowance;
        }

        return {
            baseEarnings: Math.round(baseEarnings * 100) / 100,
            bonusEarnings: Math.round(bonusEarnings * 100) / 100,
            bikeAllowance: Math.round(bikeAllowance * 100) / 100,
            total: Math.round((baseEarnings + bonusEarnings + bikeAllowance) * 100) / 100,
            hours: Math.round(hours * 100) / 100
        };
    },

    calculateBonusPercentage(entry, bonus, settings, hours, dayOfWeek) {
        // Check if bonus applies to this day
        if (!this.bonusAppliesToDay(bonus, dayOfWeek)) {
            return 0;
        }

        // Check if bonus applies to time window
        if (bonus.startHour !== undefined && bonus.endHour !== undefined) {
            const start = new Date(`2000-01-01T${entry.startTime}`);
            const end = new Date(`2000-01-01T${entry.endTime}`);
            const startHour = bonus.startHour;
            const endHour = bonus.endHour;

            // Calculate hours within the bonus time window
            let bonusHours = 0;
            const checkDate = new Date(`2000-01-01T${entry.startTime}`);
            const endCheckDate = new Date(`2000-01-01T${entry.endTime}`);
            if (endCheckDate < checkDate) endCheckDate.setDate(2); // Next day if overnight

            if (checkDate.getHours() >= startHour && checkDate.getHours() < endHour) {
                bonusHours = Math.min(endHour - checkDate.getHours(), (endCheckDate - checkDate) / (1000 * 60 * 60));
            }

            if (bonusHours > 0) {
                return Math.round((bonusHours * settings.hourlyRate * bonus.percentage / 100) * 100) / 100;
            }
        }

        // Apply to all hours
        return Math.round((hours * settings.hourlyRate * bonus.percentage / 100) * 100) / 100;
    },

    bonusAppliesToDay(bonus, dayOfWeek) {
        if (bonus.days && bonus.days.length > 0) {
            return bonus.days.includes(dayOfWeek);
        }
        return true;
    }
};

// UI Manager
const UI = {
    init() {
        this.setupEventListeners();
        this.setDefaultDate();
        this.renderSettings();
        this.renderDashboard();
        this.renderAllEntries();
    },

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Form submissions
        document.getElementById('logWorkForm').addEventListener('submit', (e) => this.handleLogWork(e));
        document.getElementById('settingsForm').addEventListener('submit', (e) => this.handleSettingsSave(e));
        document.getElementById('addBonusBtn').addEventListener('click', () => this.addBonusField());
        document.getElementById('generateReportBtn').addEventListener('click', () => this.generateReport());
    },

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

        // Show selected tab
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Refresh data if needed
        if (tabName === 'dashboard') {
            this.renderDashboard();
        } else if (tabName === 'logwork') {
            this.renderAllEntries();
        }
    },

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('workDate').value = today;
        document.getElementById('reportMonth').value = today.slice(0, 7);
    },

    handleLogWork(e) {
        e.preventDefault();

        const entry = {
            date: document.getElementById('workDate').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            notes: document.getElementById('notes').value
        };

        if (!entry.date || !entry.startTime || !entry.endTime) {
            alert('Vul alstublieft alle vereiste velden in');
            return;
        }

        DataManager.addEntry(entry);
        alert('Werkdag opgeslagen!');
        e.target.reset();
        this.setDefaultDate();
        this.renderAllEntries();
        this.renderDashboard();
    },

    renderAllEntries() {
        const entries = DataManager.getEntries();
        const settings = DataManager.getSettings();
        const allEntriesDiv = document.getElementById('allEntries');

        if (entries.length === 0) {
            allEntriesDiv.innerHTML = '<div class="empty-state"><p>Geen werkdagen geregistreerd</p></div>';
            return;
        }

        // Sort by date descending
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        allEntriesDiv.innerHTML = entries.map(entry => {
            const earnings = Calculator.calculateEarnings(entry, settings);
            const date = new Date(entry.date).toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            return `
                <div class="entry-item">
                    <div class="entry-info">
                        <div class="entry-date">${date}</div>
                        <div class="entry-details">${entry.startTime} - ${entry.endTime} (${earnings.hours}u)</div>
                        <div class="entry-details">Base: €${earnings.baseEarnings.toFixed(2)} + Bonus: €${earnings.bonusEarnings.toFixed(2)} + Fiets: €${earnings.bikeAllowance.toFixed(2)}</div>
                        ${entry.notes ? `<div class="entry-details">📝 ${entry.notes}</div>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <div class="entry-amount">€${earnings.total.toFixed(2)}</div>
                        <button class="btn btn-danger btn-small" onclick="UI.deleteEntry('${entry.id}')">Verwijder</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    deleteEntry(id) {
        if (confirm('Weet je zeker dat je deze entry wilt verwijderen?')) {
            DataManager.deleteEntry(id);
            this.renderAllEntries();
            this.renderDashboard();
        }
    },

    renderDashboard() {
        const entries = DataManager.getEntries();
        const settings = DataManager.getSettings();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Current month entries
        const currentMonthEntries = entries.filter(e => {
            const date = new Date(e.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        // Previous month entries
        const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEntries = entries.filter(e => {
            const date = new Date(e.date);
            return date.getMonth() === previousDate.getMonth() && date.getFullYear() === previousDate.getFullYear();
        });

        // Calculate totals
        const currentMonthTotal = currentMonthEntries.reduce((sum, e) => {
            const earnings = Calculator.calculateEarnings(e, settings);
            return sum + earnings.total;
        }, 0);

        const previousMonthTotal = previousMonthEntries.reduce((sum, e) => {
            const earnings = Calculator.calculateEarnings(e, settings);
            return sum + earnings.total;
        }, 0);

        const averagePerDay = currentMonthEntries.length > 0 ? currentMonthTotal / currentMonthEntries.length : 0;

        // Update cards
        document.getElementById('currentMonthEarnings').textContent = `€ ${currentMonthTotal.toFixed(2)}`;
        document.getElementById('currentMonthDays').textContent = currentMonthEntries.length;
        document.getElementById('averagePerDay').textContent = `€ ${averagePerDay.toFixed(2)}`;
        document.getElementById('previousMonthEarnings').textContent = `€ ${previousMonthTotal.toFixed(2)}`;

        // Render chart
        this.renderChart(currentMonthEntries, settings);

        // Render recent entries
        this.renderRecentEntries(currentMonthEntries, settings);
    },

    renderChart(entries, settings) {
        const ctx = document.getElementById('monthChart').getContext('2d');

        // Group by day
        const byDay = {};
        entries.forEach(entry => {
            const date = new Date(entry.date).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' });
            if (!byDay[date]) byDay[date] = 0;
            const earnings = Calculator.calculateEarnings(entry, settings);
            byDay[date] += earnings.total;
        });

        const labels = Object.keys(byDay).sort();
        const data = labels.map(label => byDay[label]);

        // Destroy previous chart if exists
        if (window.monthChartInstance) {
            window.monthChartInstance.destroy();
        }

        window.monthChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Verdiensten (€)',
                    data: data,
                    backgroundColor: '#2ecc71',
                    borderColor: '#27ae60',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Verdiensten (€)'
                        }
                    }
                }
            }
        });
    },

    renderRecentEntries(entries, settings) {
        const recentList = document.getElementById('recentList');

        if (entries.length === 0) {
            recentList.innerHTML = '<div class="empty-state"><p>Geen ingaven deze maand</p></div>';
            return;
        }

        // Show last 5 entries
        const recent = entries.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

        recentList.innerHTML = recent.map(entry => {
            const earnings = Calculator.calculateEarnings(entry, settings);
            const date = new Date(entry.date).toLocaleDateString('nl-NL', { weekday: 'short', month: 'short', day: 'numeric' });

            return `
                <div class="entry-item">
                    <div class="entry-info">
                        <div class="entry-date">${date}</div>
                        <div class="entry-details">${entry.startTime} - ${entry.endTime}</div>
                    </div>
                    <div class="entry-amount">€${earnings.total.toFixed(2)}</div>
                </div>
            `;
        }).join('');
    },

    renderSettings() {
        const settings = DataManager.getSettings();

        document.getElementById('hourlyRate').value = settings.hourlyRate;
        document.getElementById('bikeAllowance').value = settings.bikeAllowance || 0;

        // Render bonuses
        this.renderBonuses(settings.bonuses || []);
    },

    renderBonuses(bonuses) {
        const bonusList = document.getElementById('bonusList');
        bonusList.innerHTML = '';

        bonuses.forEach((bonus, index) => {
            bonusList.innerHTML += this.createBonusField(bonus, index);
        });
    },

    createBonusField(bonus, index) {
        const days = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
        const selectedDays = bonus.days || [];

        let bonusTypeHTML = '';
        if (bonus.type === 'percentage') {
            bonusTypeHTML = `
                <div class="bonus-row">
                    <div class="form-group">
                        <label>Naam</label>
                        <input type="text" class="bonus-name-${index}" value="${bonus.name || ''}" placeholder="bijv. Nachtwerk">
                    </div>
                    <div class="form-group">
                        <label>Percentage (%)</label>
                        <input type="number" class="bonus-percentage-${index}" step="0.5" min="0" value="${bonus.percentage || 0}">
                    </div>
                    <div class="form-group">
                        <label>Van uur</label>
                        <input type="number" class="bonus-start-${index}" min="0" max="23" value="${bonus.startHour || ''}" placeholder="(optioneel)">
                    </div>
                    <div class="form-group">
                        <label>Tot uur</label>
                        <input type="number" class="bonus-end-${index}" min="0" max="23" value="${bonus.endHour || ''}" placeholder="(optioneel)">
                    </div>
                    <button type="button" class="btn btn-danger btn-small" onclick="UI.removeBonusField(${index})">−</button>
                </div>
                <div class="bonus-row" style="grid-template-columns: 1fr;">
                    <div class="form-group">
                        <label>Toeslag geldt op dagen:</label>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            ${days.map((day, dayIndex) => `
                                <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                                    <input type="checkbox" class="bonus-day-${index}-${dayIndex}" ${selectedDays.includes(dayIndex) ? 'checked' : ''}>
                                    ${day}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="bonus-item">
                <h4>Toeslag ${index + 1}</h4>
                ${bonusTypeHTML}
            </div>
        `;
    },

    addBonusField() {
        const bonusList = document.getElementById('bonusList');
        const newIndex = bonusList.children.length;
        bonusList.innerHTML += this.createBonusField({ type: 'percentage' }, newIndex);
    },

    removeBonusField(index) {
        const bonusList = document.getElementById('bonusList');
        const items = bonusList.querySelectorAll('.bonus-item');
        if (items[index]) {
            items[index].remove();
        }
    },

    handleSettingsSave(e) {
        e.preventDefault();

        const bonuses = [];
        const bonusItems = document.querySelectorAll('.bonus-item');

        bonusItems.forEach((item, index) => {
            const nameInput = item.querySelector(`.bonus-name-${index}`);
            const percentageInput = item.querySelector(`.bonus-percentage-${index}`);
            const startInput = item.querySelector(`.bonus-start-${index}`);
            const endInput = item.querySelector(`.bonus-end-${index}`);

            if (nameInput && percentageInput && percentageInput.value) {
                const days = [];
                for (let i = 0; i < 7; i++) {
                    const dayCheckbox = item.querySelector(`.bonus-day-${index}-${i}`);
                    if (dayCheckbox && dayCheckbox.checked) {
                        days.push(i);
                    }
                }

                bonuses.push({
                    type: 'percentage',
                    name: nameInput.value || `Toeslag ${index + 1}`,
                    percentage: parseFloat(percentageInput.value),
                    startHour: startInput.value ? parseInt(startInput.value) : undefined,
                    endHour: endInput.value ? parseInt(endInput.value) : undefined,
                    days: days.length > 0 ? days : undefined
                });
            }
        });

        const settings = {
            hourlyRate: parseFloat(document.getElementById('hourlyRate').value),
            bikeAllowance: parseFloat(document.getElementById('bikeAllowance').value) || 0,
            bonuses: bonuses
        };

        DataManager.saveSettings(settings);
        alert('Instellingen opgeslagen!');
        this.renderDashboard();
    },

    generateReport() {
        const month = document.getElementById('reportMonth').value;
        const entries = DataManager.getEntries();
        const settings = DataManager.getSettings();

        if (!month) {
            alert('Selecteer alstublieft een maand');
            return;
        }

        const [year, monthNum] = month.split('-');
        const monthDate = new Date(year, monthNum - 1, 1);
        const nextMonth = new Date(year, monthNum, 1);

        // Get entries for selected month
        const monthEntries = entries.filter(e => {
            const date = new Date(e.date);
            return date >= monthDate && date < nextMonth;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Get entries for same month previous year
        const previousYear = new Date(year - 1, monthNum - 1, 1);
        const previousYearEnd = new Date(year - 1, monthNum, 1);
        const previousYearEntries = entries.filter(e => {
            const date = new Date(e.date);
            return date >= previousYear && date < previousYearEnd;
        });

        // Calculate totals
        const monthTotal = monthEntries.reduce((sum, e) => sum + Calculator.calculateEarnings(e, settings).total, 0);
        const previousYearTotal = previousYearEntries.reduce((sum, e) => sum + Calculator.calculateEarnings(e, settings).total, 0);
        const difference = monthTotal - previousYearTotal;
        const percentageDifference = previousYearTotal > 0 ? ((difference / previousYearTotal) * 100).toFixed(2) : 0;

        // Build report HTML
        const reportContent = document.getElementById('reportContent');
        const monthName = monthDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
        const previousMonthName = new Date(year - 1, monthNum - 1, 1).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

        let html = `
            <div class="comparison">
                <div class="comparison-card">
                    <h4>${monthName}</h4>
                    <div class="comparison-amount">€${monthTotal.toFixed(2)}</div>
                    <p>${monthEntries.length} werkdagen</p>
                </div>
                <div class="comparison-card">
                    <h4>${previousMonthName}</h4>
                    <div class="comparison-amount">€${previousYearTotal.toFixed(2)}</div>
                    <p>${previousYearEntries.length} werkdagen</p>
                </div>
            </div>

            <div class="report-summary">
                <h4>Vergelijking</h4>
                <p>Verschil: <span class="${difference >= 0 ? 'positive' : 'negative'}">${difference >= 0 ? '+' : ''}€${difference.toFixed(2)} (${difference >= 0 ? '+' : ''}${percentageDifference}%)</span></p>
            </div>
        `;

        if (monthEntries.length > 0) {
            html += `
                <div class="report-content">
                    <h3>Details ${monthName}</h3>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Datum</th>
                                <th>Uren</th>
                                <th>Basis</th>
                                <th>Bonus</th>
                                <th>Fiets</th>
                                <th>Totaal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${monthEntries.map(entry => {
                                const earnings = Calculator.calculateEarnings(entry, settings);
                                const date = new Date(entry.date).toLocaleDateString('nl-NL');
                                return `
                                    <tr>
                                        <td>${date}</td>
                                        <td>${earnings.hours}</td>
                                        <td>€${earnings.baseEarnings.toFixed(2)}</td>
                                        <td>€${earnings.bonusEarnings.toFixed(2)}</td>
                                        <td>€${earnings.bikeAllowance.toFixed(2)}</td>
                                        <td><strong>€${earnings.total.toFixed(2)}</strong></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            html += '<div class="empty-state"><p>Geen werkdagen in deze maand</p></div>';
        }

        reportContent.innerHTML = html;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});