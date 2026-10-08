function toMinutesFromValue(value) {
    if (value === undefined || value === null || value === '') return null;

    if (typeof value === 'string' && value.includes(':')) {
        const [hours, minutes = '0'] = value.split(':');
        return (Number(hours) || 0) * 60 + (Number(minutes) || 0);
    }

    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    return num * 60;
}

function formatTimeValue(value) {
    if (value === undefined || value === null || value === '') return '';

    if (typeof value === 'string' && value.includes(':')) return value;

    const num = Number(value);
    if (!Number.isFinite(num)) return '';

    const hours = Math.floor(num);
    const minutes = Math.round((num - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Data storage
const DataManager = {
    STORAGE_KEY_ENTRIES: 'cactus_work_entries',
    STORAGE_KEY_SETTINGS: 'cactus_settings',
    STORAGE_KEY_ACTUALS: 'cactus_actuals',

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
        if (!data) {
            return {
                hourlyRates: [{ id: Date.now(), amount: 12.50, validFrom: new Date().toISOString().split('T')[0] }],
                bikeAllowances: [{ id: Date.now(), amount: 0.50, validFrom: new Date().toISOString().split('T')[0] }],
                bonuses: []
            };
        }
        return JSON.parse(data);
    },

    saveSettings(settings) {
        localStorage.setItem(this.STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    },

    getActuals() {
        const data = localStorage.getItem(this.STORAGE_KEY_ACTUALS);
        return data ? JSON.parse(data) : {};
    },

    saveActuals(actuals) {
        localStorage.setItem(this.STORAGE_KEY_ACTUALS, JSON.stringify(actuals));
    },

    saveActual(yearMonth, amount) {
        const actuals = this.getActuals();
        actuals[yearMonth] = Number(amount) || 0;
        this.saveActuals(actuals);
    },

    getActual(yearMonth) {
        const actuals = this.getActuals();
        return actuals[yearMonth] || null;
    }
};

// Calculator
const Calculator = {
    calculateEarnings(entry, settings) {
        const start = new Date(`2000-01-01T${entry.startTime}`);
        const end = new Date(`2000-01-01T${entry.endTime}`);

        let hours = (end - start) / (1000 * 60 * 60);
        if (hours < 0) hours += 24;

        const workDate = new Date(entry.date);
        const dayOfWeek = workDate.getDay();

        const hourlyRate = this.getEffectiveRate(settings.hourlyRates, entry.date);
        const bikeAllowance = this.getEffectiveRate(settings.bikeAllowances, entry.date);

        let baseEarnings = hours * hourlyRate;
        let bonusEarnings = 0;

        if (settings.bonuses && Array.isArray(settings.bonuses)) {
            settings.bonuses.forEach(bonus => {
                if (bonus.type === 'percentage') {
                    const bonusAmount = this.calculateBonusPercentage(entry, bonus, hourlyRate, hours, dayOfWeek);
                    bonusEarnings += bonusAmount;
                } else if (bonus.type === 'fixed') {
                    if (this.bonusAppliesToDay(bonus, dayOfWeek)) {
                        bonusEarnings += bonus.amount;
                    }
                }
            });
        }

        return {
            baseEarnings: Math.round(baseEarnings * 100) / 100,
            bonusEarnings: Math.round(bonusEarnings * 100) / 100,
            bikeAllowance: Math.round(bikeAllowance * 100) / 100,
            total: Math.round((baseEarnings + bonusEarnings + bikeAllowance) * 100) / 100,
            hours: Math.round(hours * 100) / 100
        };
    },

    getEffectiveRate(rates, dateValue) {
        if (!Array.isArray(rates) || rates.length === 0) return 0;

        const date = new Date(`${dateValue}T00:00:00`);
        let effective = rates[0];

        rates.forEach(rate => {
            const validFrom = new Date(`${rate.validFrom}T00:00:00`);
            if (validFrom <= date) {
                effective = rate;
            }
        });

        return Number(effective.amount) || 0;
    },

    calculateBonusPercentage(entry, bonus, hourlyRate, hours, dayOfWeek) {
        if (!this.bonusAppliesToDay(bonus, dayOfWeek)) {
            return 0;
        }

        const startMinutes = toMinutesFromValue(entry.startTime);
        const endMinutes = toMinutesFromValue(entry.endTime);
        let shiftStart = startMinutes;
        let shiftEnd = endMinutes;

        if (shiftEnd === null || shiftStart === null) return 0;
        if (shiftEnd <= shiftStart) shiftEnd += 24 * 60;

        const bonusStart = toMinutesFromValue(bonus.startHour);
        const bonusEnd = toMinutesFromValue(bonus.endHour);

        if (bonusStart === null || bonusEnd === null) {
            return Math.round((hours * hourlyRate * Number(bonus.percentage || 0) / 100) * 100) / 100;
        }

        let bonusWindowStart = bonusStart;
        let bonusWindowEnd = bonusEnd;
        if (bonusWindowEnd <= bonusWindowStart) bonusWindowEnd += 24 * 60;

        const overlapStart = Math.max(shiftStart, bonusWindowStart);
        const overlapEnd = Math.min(shiftEnd, bonusWindowEnd);
        const overlapMinutes = Math.max(0, overlapEnd - overlapStart);
        const bonusHours = overlapMinutes / 60;

        if (bonusHours <= 0) return 0;
        return Math.round((bonusHours * hourlyRate * Number(bonus.percentage || 0) / 100) * 100) / 100;
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
    currentReportYear: null,
    currentReportMonth: null,

    init() {
        this.setupEventListeners();
        this.setDefaultDate();
        this.renderSettings();
        this.renderDashboard();
        this.renderAllEntries();
    },

    setupEventListeners() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        document.getElementById('logWorkForm').addEventListener('submit', (e) => this.handleLogWork(e));
        document.getElementById('bulkWorkForm')?.addEventListener('submit', (e) => this.handleBulkLogWork(e));
        document.getElementById('settingsForm').addEventListener('submit', (e) => this.handleSettingsSave(e));

        const addRateBtn = document.getElementById('addRateHistoryBtn');
        if (addRateBtn) addRateBtn.addEventListener('click', () => this.addRateHistoryRow());

        const addBikeBtn = document.getElementById('addBikeAllowanceBtn');
        if (addBikeBtn) addBikeBtn.addEventListener('click', () => this.addBikeAllowanceRow());

        const addBonusBtn = document.getElementById('addBonusBtn');
        if (addBonusBtn) addBonusBtn.addEventListener('click', () => this.addBonusField());

        const genReportBtn = document.getElementById('generateReportBtn');
        if (genReportBtn) genReportBtn.addEventListener('click', () => this.generateReport());
    },

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

        const tab = document.getElementById(tabName);
        if (tab) tab.classList.add('active');

        const btn = document.querySelector(`[data-tab="${tabName}"]`);
        if (btn) btn.classList.add('active');

        if (tabName === 'dashboard') this.renderDashboard();
        if (tabName === 'logwork') this.renderAllEntries();
        if (tabName === 'settings') this.renderSettings();
        if (tabName === 'report') this.renderReportYearSelect();
    },

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        const workDate = document.getElementById('workDate');
        if (workDate) workDate.value = today;

        const bulkStartDate = document.getElementById('bulkStartDate');
        if (bulkStartDate) bulkStartDate.value = today;
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

    handleBulkLogWork(e) {
        e.preventDefault();

        const startDate = new Date(document.getElementById('bulkStartDate').value);
        const entries = [];
        const days = parseInt(document.getElementById('bulkDays').value) || 1;
        const startTime = document.getElementById('bulkStartTime').value;
        const endTime = document.getElementById('bulkEndTime').value;
        const notes = document.getElementById('bulkNotes').value;

        if (!startDate || !startTime || !endTime || days < 1) {
            alert('Vul alstublieft alle vereiste velden in');
            return;
        }

        for (let i = 0; i < days; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + i);
            const dateString = currentDate.toISOString().split('T')[0];

            const entry = {
                date: dateString,
                startTime: startTime,
                endTime: endTime,
                notes: notes
            };
            DataManager.addEntry(entry);
            entries.push(entry);
        }

        alert(`${days} werkdagen opgeslagen!`);
        e.target.reset();
        this.setDefaultDate();
        this.renderAllEntries();
        this.renderDashboard();
    },

    renderDashboard() {
        const entries = DataManager.getEntries();
        const settings = DataManager.getSettings();
        const now = new Date();

        // Current month
        const currentMonthEntries = entries.filter(e => {
            const date = new Date(`${e.date}T00:00:00`);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });

        const totalCurrent = currentMonthEntries.reduce((sum, e) => sum + Calculator.calculateEarnings(e, settings).total, 0);
        const avgPerDay = currentMonthEntries.length ? totalCurrent / currentMonthEntries.length : 0;

        // Previous year same month
        const sameMonthLastYearEntries = entries.filter(e => {
            const date = new Date(`${e.date}T00:00:00`);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() - 1;
        });
        const totalLastYear = sameMonthLastYearEntries.reduce((sum, e) => sum + Calculator.calculateEarnings(e, settings).total, 0);

        // All years total
        const allYearsTotal = entries.reduce((sum, e) => sum + Calculator.calculateEarnings(e, settings).total, 0);

        document.getElementById('currentMonthEarnings').textContent = `€ ${totalCurrent.toFixed(2)}`;
        document.getElementById('currentMonthDays').textContent = currentMonthEntries.length;
        document.getElementById('averagePerDay').textContent = `€ ${avgPerDay.toFixed(2)}`;
        document.getElementById('previousMonthEarnings').textContent = `€ ${totalLastYear.toFixed(2)}`;
        
        const allYearsEl = document.getElementById('allYearsEarnings');
        if (allYearsEl) allYearsEl.textContent = `€ ${allYearsTotal.toFixed(2)}`;

        this.renderChart(currentMonthEntries, settings);
        this.renderRecentEntries(currentMonthEntries, settings);
    },

    renderChart(entries, settings) {
        const ctx = document.getElementById('monthChart')?.getContext('2d');
        if (!ctx) return;

        const byDay = {};
        entries.forEach(entry => {
            const date = new Date(`${entry.date}T00:00:00`).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' });
            if (!byDay[date]) byDay[date] = 0;
            const earnings = Calculator.calculateEarnings(entry, settings);
            byDay[date] += earnings.total;
        });

        const labels = Object.keys(byDay).sort();
        const data = labels.map(label => byDay[label]);

        if (window.monthChartInstance) window.monthChartInstance.destroy();

        window.monthChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Verdiensten (€)',
                    data,
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
        if (!recentList) return;

        if (entries.length === 0) {
            recentList.innerHTML = '<div class="empty-state"><p>Geen ingaven deze maand</p></div>';
            return;
        }

        const recent = [...entries].sort((a, b) => new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`)).slice(0, 5);

        recentList.innerHTML = recent.map(entry => {
            const earnings = Calculator.calculateEarnings(entry, settings);
            const date = new Date(`${entry.date}T00:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', month: 'short', day: 'numeric' });
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

    renderAllEntries() {
        const entries = DataManager.getEntries();
        const settings = DataManager.getSettings();
        const allEntriesDiv = document.getElementById('allEntries');
        if (!allEntriesDiv) return;

        if (entries.length === 0) {
            allEntriesDiv.innerHTML = '<div class="empty-state"><p>Geen werkdagen geregistreerd</p></div>';
            return;
        }

        const sortedEntries = [...entries].sort((a, b) => new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`));
        allEntriesDiv.innerHTML = sortedEntries.map(entry => {
            const earnings = Calculator.calculateEarnings(entry, settings);
            const date = new Date(`${entry.date}T00:00:00`).toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            return `
                <div class="entry-item">
                    <div class="entry-info">
                        <div class="entry-date">${date}</div>
                        <div class="entry-details">${entry.startTime} - ${entry.endTime} (${earnings.hours}u)</div>
                        <div class="entry-details">Basis: €${earnings.baseEarnings.toFixed(2)} + Bonus: €${earnings.bonusEarnings.toFixed(2)} + Fiets: €${earnings.bikeAllowance.toFixed(2)}</div>
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

    renderSettings() {
        const settings = DataManager.getSettings();
        this.renderRateHistory(settings.hourlyRates || []);
        this.renderBikeAllowanceHistory(settings.bikeAllowances || []);
        this.renderBonuses(settings.bonuses || []);
    },

    renderRateHistory(rates) {
        const container = document.getElementById('hourlyRateHistory');
        if (!container) return;

        const sortedRates = [...rates].sort((a, b) => new Date(`${a.validFrom || '2000-01-01'}T00:00:00`) - new Date(`${b.validFrom || '2000-01-01'}T00:00:00`));

        container.innerHTML = sortedRates.map((rate, index) => `
            <div class="history-item">
                <div class="history-fields">
                    <div class="form-group">
                        <label>Vanaf datum</label>
                        <input type="date" class="rate-valid-from-${index}" value="${rate.validFrom || ''}">
                    </div>
                    <div class="form-group">
                        <label>Bedrag (€)</label>
                        <input type="number" step="0.01" min="0" class="rate-amount-${index}" value="${Number(rate.amount || 0).toFixed(2)}">
                    </div>
                    <button type="button" class="btn btn-danger btn-small" onclick="UI.removeRateHistoryEntry(${index})">Verwijder</button>
                </div>
            </div>
        `).join('');
    },

    renderBikeAllowanceHistory(allowances) {
        const container = document.getElementById('bikeAllowanceHistory');
        if (!container) return;

        const sortedAllowances = [...allowances].sort((a, b) => new Date(`${a.validFrom || '2000-01-01'}T00:00:00`) - new Date(`${b.validFrom || '2000-01-01'}T00:00:00`));

        container.innerHTML = sortedAllowances.map((item, index) => `
            <div class="history-item">
                <div class="history-fields">
                    <div class="form-group">
                        <label>Vanaf datum</label>
                        <input type="date" class="bike-valid-from-${index}" value="${item.validFrom || ''}">
                    </div>
                    <div class="form-group">
                        <label>Bedrag (€)</label>
                        <input type="number" step="0.01" min="0" class="bike-amount-${index}" value="${Number(item.amount || 0).toFixed(2)}">
                    </div>
                    <button type="button" class="btn btn-danger btn-small" onclick="UI.removeBikeAllowanceEntry(${index})">Verwijder</button>
                </div>
            </div>
        `).join('');
    },

    addRateHistoryRow() {
        const container = document.getElementById('hourlyRateHistory');
        if (!container) return;
        const nextIndex = container.querySelectorAll('.history-item').length;
        const today = new Date().toISOString().split('T')[0];

        container.insertAdjacentHTML('beforeend', `
            <div class="history-item">
                <div class="history-fields">
                    <div class="form-group">
                        <label>Vanaf datum</label>
                        <input type="date" class="rate-valid-from-${nextIndex}" value="${today}">
                    </div>
                    <div class="form-group">
                        <label>Bedrag (€)</label>
                        <input type="number" step="0.01" min="0" class="rate-amount-${nextIndex}" value="0">
                    </div>
                    <button type="button" class="btn btn-danger btn-small" onclick="UI.removeRateHistoryEntry(${nextIndex})">Verwijder</button>
                </div>
            </div>
        `);
    },

    addBikeAllowanceRow() {
        const container = document.getElementById('bikeAllowanceHistory');
        if (!container) return;
        const nextIndex = container.querySelectorAll('.history-item').length;
        const today = new Date().toISOString().split('T')[0];

        container.insertAdjacentHTML('beforeend', `
            <div class="history-item">
                <div class="history-fields">
                    <div class="form-group">
                        <label>Vanaf datum</label>
                        <input type="date" class="bike-valid-from-${nextIndex}" value="${today}">
                    </div>
                    <div class="form-group">
                        <label>Bedrag (€)</label>
                        <input type="number" step="0.01" min="0" class="bike-amount-${nextIndex}" value="0">
                    </div>
                    <button type="button" class="btn btn-danger btn-small" onclick="UI.removeBikeAllowanceEntry(${nextIndex})">Verwijder</button>
                </div>
            </div>
        `);
    },

    removeRateHistoryEntry(index) {
        const container = document.getElementById('hourlyRateHistory');
        if (!container) return;
        const items = container.querySelectorAll('.history-item');
        if (items[index]) items[index].remove();
    },

    removeBikeAllowanceEntry(index) {
        const container = document.getElementById('bikeAllowanceHistory');
        if (!container) return;
        const items = container.querySelectorAll('.history-item');
        if (items[index]) items[index].remove();
    },

    renderBonuses(bonuses) {
        const bonusList = document.getElementById('bonusList');
        if (!bonusList) return;

        bonusList.innerHTML = (bonuses || []).map((bonus, index) => this.createBonusField(bonus, index)).join('');
    },

    createBonusField(bonus, index) {
        const days = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
        const selectedDays = bonus.days || [];
        const today = new Date().toISOString().split('T')[0];

        return `
            <div class="bonus-item">
                <div class="bonus-header-row">
                    <h4>Toeslag ${index + 1}</h4>
                    <button type="button" class="btn btn-danger btn-small" onclick="UI.removeBonusField(${index})">Verwijder</button>
                </div>

                <div class="bonus-row">
                    <div class="form-group">
                        <label>Vanaf datum</label>
                        <input type="date" class="bonus-valid-from-${index}" value="${bonus.validFrom || today}">
                    </div>
                    <div class="form-group">
                        <label>Naam</label>
                        <input type="text" class="bonus-name-${index}" value="${bonus.name || ''}" placeholder="bijv. Nachtwerk">
                    </div>
                    <div class="form-group">
                        <label>Percentage (%)</label>
                        <input type="number" step="0.01" min="0" class="bonus-percentage-${index}" value="${Number(bonus.percentage || 0).toFixed(2)}">
                    </div>
                    <div class="form-group">
                        <label>Vanaf hoe laat</label>
                        <input type="time" class="bonus-start-${index}" value="${formatTimeValue(bonus.startHour)}" placeholder="22:00">
                    </div>
                    <div class="form-group">
                        <label>Tot hoe laat</label>
                        <input type="time" class="bonus-end-${index}" value="${formatTimeValue(bonus.endHour)}" placeholder="06:00">
                    </div>
                </div>

                <div class="bonus-row-checkboxes">
                    ${days.map((day, dayIndex) => `
                        <label class="checkbox-inline">
                            <input type="checkbox" class="bonus-day-${index}-${dayIndex}" ${selectedDays.includes(dayIndex) ? 'checked' : ''}>
                            ${day}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    },

    addBonusField() {
        const bonusList = document.getElementById('bonusList');
        if (!bonusList) return;

        const newIndex = bonusList.querySelectorAll('.bonus-item').length;
        bonusList.insertAdjacentHTML('beforeend', this.createBonusField({
            name: '',
            percentage: 0,
            validFrom: new Date().toISOString().split('T')[0],
            startHour: '22:00',
            endHour: '06:00',
            days: [0, 1, 2, 3, 4, 5, 6]
        }, newIndex));
    },

    removeBonusField(index) {
        const bonusList = document.getElementById('bonusList');
        if (!bonusList) return;
        const items = bonusList.querySelectorAll('.bonus-item');
        if (items[index]) items[index].remove();
    },

    handleSettingsSave(e) {
        e.preventDefault();

        const hourlyRates = [];
        const rateItems = document.querySelectorAll('#hourlyRateHistory .history-item');
        rateItems.forEach((item, index) => {
            const validFromInput = item.querySelector(`.rate-valid-from-${index}`);
            const amountInput = item.querySelector(`.rate-amount-${index}`);
            if (validFromInput && amountInput && validFromInput.value && amountInput.value !== '') {
                hourlyRates.push({
                    id: Date.now() + index,
                    amount: Number(amountInput.value) || 0,
                    validFrom: validFromInput.value
                });
            }
        });

        const bikeAllowances = [];
        const bikeItems = document.querySelectorAll('#bikeAllowanceHistory .history-item');
        bikeItems.forEach((item, index) => {
            const validFromInput = item.querySelector(`.bike-valid-from-${index}`);
            const amountInput = item.querySelector(`.bike-amount-${index}`);
            if (validFromInput && amountInput && validFromInput.value && amountInput.value !== '') {
                bikeAllowances.push({
                    id: Date.now() + index,
                    amount: Number(amountInput.value) || 0,
                    validFrom: validFromInput.value
                });
            }
        });

        const bonuses = [];
        const bonusItems = document.querySelectorAll('#bonusList .bonus-item');
        bonusItems.forEach((item, index) => {
            const validFromInput = item.querySelector(`.bonus-valid-from-${index}`);
            const nameInput = item.querySelector(`.bonus-name-${index}`);
            const percentageInput = item.querySelector(`.bonus-percentage-${index}`);
            const startInput = item.querySelector(`.bonus-start-${index}`);
            const endInput = item.querySelector(`.bonus-end-${index}`);

            if (!nameInput || !percentageInput) return;
            const percentage = Number(percentageInput.value) || 0;
            if (!percentage) return;

            const days = [];
            for (let i = 0; i < 7; i++) {
                const dayCheck = item.querySelector(`.bonus-day-${index}-${i}`);
                if (dayCheck && dayCheck.checked) days.push(i);
            }

            const bonusStart = startInput && startInput.value ? startInput.value : undefined;
            const bonusEnd = endInput && endInput.value ? endInput.value : undefined;

            bonuses.push({
                id: Date.now() + index,
                type: 'percentage',
                name: nameInput.value || `Toeslag ${index + 1}`,
                validFrom: validFromInput && validFromInput.value ? validFromInput.value : new Date().toISOString().split('T')[0],
                percentage: percentage,
                startHour: bonusStart,
                endHour: bonusEnd,
                days: days.length ? days : [0, 1, 2, 3, 4, 5, 6]
            });
        });

        const settings = {
            hourlyRates: hourlyRates.length ? hourlyRates : [{ id: Date.now(), amount: 12.50, validFrom: new Date().toISOString().split('T')[0] }],
            bikeAllowances: bikeAllowances.length ? bikeAllowances : [{ id: Date.now(), amount: 0.50, validFrom: new Date().toISOString().split('T')[0] }],
            bonuses: bonuses
        };

        DataManager.saveSettings(settings);
        alert('Instellingen opgeslagen!');
        this.renderSettings();
        this.renderDashboard();
    },

    renderReportYearSelect() {
        const entries = DataManager.getEntries();
        const reportContainer = document.getElementById('reportContainer');
        if (!reportContainer) return;

        const years = new Set();
        entries.forEach(entry => {
            const year = new Date(`${entry.date}T00:00:00`).getFullYear();
            years.add(year);
        });

        if (years.size === 0) {
            reportContainer.innerHTML = '<div class="empty-state"><p>Geen werkdagen geregistreerd</p></div>';
            return;
        }

        const sortedYears = Array.from(years).sort((a, b) => b - a);

        reportContainer.innerHTML = `
            <div class="report-selector">
                <h3>Selecteer een jaar</h3>
                <div class="year-buttons">
                    ${sortedYears.map(year => `
                        <button class="btn btn-primary" onclick="UI.selectReportYear(${year})">${year}</button>
                    `).join('')}
                </div>
                <div id="reportContent"></div>
            </div>
        `;
    },

    selectReportYear(year) {
        this.currentReportYear = year;
        const entries = DataManager.getEntries();
        const reportContainer = document.getElementById('reportContent');

        const yearEntries = entries.filter(e => {
            const entryYear = new Date(`${e.date}T00:00:00`).getFullYear();
            return entryYear === year;
        });

        const months = new Set();
        yearEntries.forEach(entry => {
            const month = new Date(`${entry.date}T00:00:00`).getMonth();
            months.add(month);
        });

        const sortedMonths = Array.from(months).sort((a, b) => b - a);
        const monthNames = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

        reportContainer.innerHTML = `
            <h3>Maanden in ${year}</h3>
            <div class="month-buttons">
                ${sortedMonths.map(month => {
                    const date = new Date(year, month, 1);
                    const monthName = date.toLocaleDateString('nl-NL', { month: 'long' });
                    const yearMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
                    return `
                        <button class="btn btn-secondary" onclick="UI.selectReportMonth(${year}, ${month})">${monthName}</button>
                    `;
                }).join('')}
                <button class="btn btn-success" onclick="UI.showYearSummary(${year})">Heel jaar ${year}</button>
                <button class="btn btn-default" onclick="UI.renderReportYearSelect()">Terug</button>
            </div>
            <div id="reportMonthContent"></div>
        `;
    },

    selectReportMonth(year, month) {
        this.currentReportYear = year;
        this.currentReportMonth = month;

        const entries = DataManager.getEntries();
        const settings = DataManager.getSettings();
        const reportContainer = document.getElementById('reportMonthContent');

        const monthEntries = entries.filter(e => {
            const date = new Date(`${e.date}T00:00:00`);
            return date.getFullYear() === year && date.getMonth() === month;
        }).sort((a, b) => new Date(`${a.date}T00:00:00`) - new Date(`${b.date}T00:00:00`));

        const monthTotal = monthEntries.reduce((sum, e) => sum + Calculator.calculateEarnings(e, settings).total, 0);
        const yearMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
        const actualAmount = DataManager.getActual(yearMonth);

        const monthName = new Date(year, month, 1).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

        let html = `
            <h4>${monthName}</h4>
            <div class="report-summary">
                <p><strong>Berekend:</strong> €${monthTotal.toFixed(2)}</p>
                <div class="form-group">
                    <label>Daadwerkelijk ontvangen (€):</label>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="number" step="0.01" id="actualAmount" value="${actualAmount || ''}" placeholder="0,00">
                        <button class="btn btn-primary" onclick="UI.saveActualAmount('${yearMonth}')">Opslaan</button>
                    </div>
                </div>
        `;

        if (actualAmount) {
            const difference = actualAmount - monthTotal;
            const diffClass = difference >= 0 ? 'positive' : 'negative';
            html += `<p><strong>Verschil:</strong> <span class="${diffClass}">${difference >= 0 ? '+' : ''}€${difference.toFixed(2)}</span></p>`;
        }

        html += `</div><table class="report-table"><thead><tr><th>Datum</th><th>Uren</th><th>Basis</th><th>Bonus</th><th>Fiets</th><th>Totaal</th></tr></thead><tbody>`;

        monthEntries.forEach(entry => {
            const earnings = Calculator.calculateEarnings(entry, settings);
            const date = new Date(`${entry.date}T00:00:00`).toLocaleDateString('nl-NL');
            html += `<tr><td>${date}</td><td>${earnings.hours}</td><td>€${earnings.baseEarnings.toFixed(2)}</td><td>€${earnings.bonusEarnings.toFixed(2)}</td><td>€${earnings.bikeAllowance.toFixed(2)}</td><td><strong>€${earnings.total.toFixed(2)}</strong></td></tr>`;
        });

        html += `</tbody></table><button class="btn btn-default" onclick="UI.selectReportYear(${year})">Terug</button>`;

        reportContainer.innerHTML = html;
    },

    saveActualAmount(yearMonth) {
        const amount = document.getElementById('actualAmount').value;
        if (amount === '') {
            alert('Voer een bedrag in');
            return;
        }
        DataManager.saveActual(yearMonth, amount);
        alert('Bedrag opgeslagen!');
        this.renderDashboard();
        const [year, month] = yearMonth.split('-');
        this.selectReportMonth(parseInt(year), parseInt(month) - 1);
    },

    showYearSummary(year) {
        const entries = DataManager.getEntries();
        const settings = DataManager.getSettings();
        const reportContainer = document.getElementById('reportMonthContent');

        const yearEntries = entries.filter(e => {
            const entryYear = new Date(`${e.date}T00:00:00`).getFullYear();
            return entryYear === year;
        }).sort((a, b) => new Date(`${a.date}T00:00:00`) - new Date(`${b.date}T00:00:00`));

        const yearTotal = yearEntries.reduce((sum, e) => sum + Calculator.calculateEarnings(e, settings).total, 0);

        const actuals = DataManager.getActuals();
        let actualYearTotal = 0;
        for (let month = 0; month < 12; month++) {
            const yearMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
            if (actuals[yearMonth]) {
                actualYearTotal += actuals[yearMonth];
            }
        }

        let html = `
            <h4>Overzicht ${year}</h4>
            <div class="report-summary">
                <p><strong>Berekend totaal:</strong> €${yearTotal.toFixed(2)}</p>
        `;

        if (actualYearTotal > 0) {
            const difference = actualYearTotal - yearTotal;
            const diffClass = difference >= 0 ? 'positive' : 'negative';
            html += `
                <p><strong>Daadwerkelijk ontvangen:</strong> €${actualYearTotal.toFixed(2)}</p>
                <p><strong>Verschil:</strong> <span class="${diffClass}">${difference >= 0 ? '+' : ''}€${difference.toFixed(2)}</span></p>
            `;
        }

        html += `</div><table class="report-table"><thead><tr><th>Maand</th><th>Berekend</th><th>Ontvangen</th><th>Verschil</th></tr></thead><tbody>`;

        const monthNames = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];

        for (let month = 0; month < 12; month++) {
            const yearMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
            const monthEntries = yearEntries.filter(e => {
                const entryMonth = new Date(`${e.date}T00:00:00`).getMonth();
                return entryMonth === month;
            });

            const monthTotal = monthEntries.reduce((sum, e) => sum + Calculator.calculateEarnings(e, settings).total, 0);
            const actualAmount = actuals[yearMonth];
            const difference = actualAmount ? actualAmount - monthTotal : 0;

            if (monthTotal > 0 || actualAmount) {
                const diffClass = difference >= 0 ? 'positive' : 'negative';
                html += `<tr><td>${monthNames[month]}</td><td>€${monthTotal.toFixed(2)}</td><td>${actualAmount ? `€${actualAmount.toFixed(2)}` : '-'}</td><td>${difference ? `<span class="${diffClass}">${difference >= 0 ? '+' : ''}€${difference.toFixed(2)}</span>` : '-'}</td></tr>`;
            }
        }

        html += `</tbody></table><button class="btn btn-default" onclick="UI.selectReportYear(${year})">Terug</button>`;

        reportContainer.innerHTML = html;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
