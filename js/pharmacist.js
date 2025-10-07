// Pharmacist dashboard logic and prescription verification
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db } from './firebase-config.js';

// DOM references
const verifyForm = document.getElementById('verify-form');
const resultsContainer = document.getElementById('results-container');

// Handle verification form submission
verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const prescriptionId = document.getElementById('prescription-id').value.trim();
    
    if (!prescriptionId) {
        showResults('error', 'Please enter a prescription ID');
        return;
    }
    
    try {
        // DSA Logic: Hash Table Lookup using Firestore doc().get()
        const prescriptionDoc = await getDoc(doc(db, 'prescriptions', prescriptionId));
        
        if (!prescriptionDoc.exists()) {
            showResults('error', 'NOT FOUND: Prescription does not exist');
            return;
        }
        
        const prescriptionData = prescriptionDoc.data();
        
        if (prescriptionData.status === 'filled') {
            showResults('error', 'ALREADY FILLED: This prescription has already been dispensed');
            return;
        }
        
        if (prescriptionData.status === 'active') {
            showResults('success', 'VALID: Prescription found', prescriptionData, prescriptionId);
        }
        
    } catch (error) {
        showResults('error', 'Error verifying prescription: ' + error.message);
    }
});

// Display verification results
function showResults(type, message, data = null, prescriptionId = null) {
    resultsContainer.innerHTML = '';
    
    const resultDiv = document.createElement('div');
    resultDiv.className = `result ${type}`;
    
    if (type === 'success' && data) {
        // Handle both old and new data structures
        const patientName = data.patient ? data.patient.name : data.patientName;
        const patientAge = data.patient ? data.patient.age : null;
        const patientGender = data.patient ? data.patient.gender : null;
        const patientContact = data.patient ? data.patient.contact : null;
        
        // Handle medications array or single medication
        let medicationsHTML = '';
        if (data.medications && Array.isArray(data.medications)) {
            medicationsHTML = data.medications.map((med, index) => `
                <div class="medication-item">
                    <h5>Medication ${index + 1}</h5>
                    <p><strong>Name:</strong> ${med.name}</p>
                    ${med.dosage ? `<p><strong>Dosage:</strong> ${med.dosage}</p>` : ''}
                    <p><strong>Frequency:</strong> ${med.frequency}</p>
                    ${med.duration ? `<p><strong>Duration:</strong> ${med.duration}</p>` : ''}
                </div>
            `).join('');
        } else {
            // Old format fallback
            const medicationName = data.medication ? data.medication.name : data.medication;
            const strength = data.medication ? data.medication.strength : null;
            const dosage = data.medication ? data.medication.dosage : data.dosage;
            medicationsHTML = `
                <div class="medication-item">
                    <p><strong>Medication:</strong> ${medicationName}${strength ? ` (${strength})` : ''}</p>
                    <p><strong>Dosage:</strong> ${dosage}</p>
                </div>
            `;
        }
        
        resultDiv.innerHTML = `
            <h3>${message}</h3>
            <div class="prescription-details">
                <div class="detail-section">
                    <h4>📋 Prescription Information</h4>
                    <p><strong>Prescription ID:</strong> <code>${data.prescriptionId}</code></p>
                    <p><strong>Issue Date:</strong> ${new Date(data.issueDate).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${data.status}">${data.status.toUpperCase()}</span></p>
                </div>
                
                <div class="detail-section">
                    <h4>👤 Patient Details</h4>
                    <p><strong>Name:</strong> ${patientName}</p>
                    ${patientAge ? `<p><strong>Age:</strong> ${patientAge} years</p>` : ''}
                    ${patientGender ? `<p><strong>Gender:</strong> ${patientGender}</p>` : ''}
                    ${patientContact ? `<p><strong>Contact:</strong> ${patientContact}</p>` : ''}
                </div>
                
                <div class="detail-section">
                    <h4>💊 Medication Details</h4>
                    ${medicationsHTML}
                </div>
                
                ${data.diagnosis || data.notes || data.allergies ? `
                <div class="detail-section">
                    <h4>📝 Additional Information</h4>
                    ${data.diagnosis ? `<p><strong>Diagnosis:</strong> ${data.diagnosis}</p>` : ''}
                    ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
                    ${data.allergies ? `<p><strong>Allergies:</strong> <span class="allergy-warning">${data.allergies}</span></p>` : ''}
                </div>
                ` : ''}
            </div>
            <button id="mark-filled-btn" class="btn btn-primary">✅ Mark as Filled</button>
        `;
        
        // Add event listener to Mark as Filled button
        const markFilledBtn = resultDiv.querySelector('#mark-filled-btn');
        markFilledBtn.addEventListener('click', () => markAsFilled(prescriptionId));
        
    } else {
        resultDiv.innerHTML = `<h3>${message}</h3>`;
    }
    
    resultsContainer.appendChild(resultDiv);
}

// Mark prescription as filled
async function markAsFilled(prescriptionId) {
    try {
        await updateDoc(doc(db, 'prescriptions', prescriptionId), {
            status: 'filled',
            filledDate: new Date().toISOString()
        });
        
        showResults('success', 'SUCCESS: Prescription marked as filled');
        document.getElementById('prescription-id').value = '';
        
    } catch (error) {
        showResults('error', 'Error updating prescription: ' + error.message);
    }
}

// Real-time prescription monitoring for pharmacist
let activeListener = null;
let recentListener = null;

// Initialize pharmacist dashboard
export function initializePharmacistDashboard() {
    loadPharmacistStats();
    setupRecentActivity();
    initializeCharts();
}

// Load real-time stats for pharmacist
function loadPharmacistStats() {
    const prescriptionsRef = collection(db, 'prescriptions');
    
    // Listen to active prescriptions
    const activeQuery = query(
        prescriptionsRef,
        where('status', '==', 'active'),
        orderBy('issueDate', 'desc')
    );
    
    activeListener = onSnapshot(activeQuery, (snapshot) => {
        const activePrescriptions = snapshot.docs.map(doc => doc.data());
        
        // Update pending verification count
        document.getElementById('pending-verification').textContent = activePrescriptions.length;
        
        // Update active prescriptions list
        updateActivePrescriptions(activePrescriptions);
    });
    
    // Get today's verified count
    const today = new Date().toISOString().split('T')[0];
    const todayQuery = query(
        prescriptionsRef,
        where('status', '==', 'filled'),
        where('filledDate', '>=', today + 'T00:00:00.000Z'),
        where('filledDate', '<=', today + 'T23:59:59.999Z')
    );
    
    recentListener = onSnapshot(todayQuery, (snapshot) => {
        document.getElementById('verified-today').textContent = snapshot.docs.length;
    });
}

// Update active prescriptions display
function updateActivePrescriptions(prescriptions) {
    const activeList = document.getElementById('active-prescriptions-list');
    if (!activeList) return;
    
    if (prescriptions.length === 0) {
        activeList.innerHTML = '<p class="no-data">No active prescriptions awaiting verification.</p>';
        return;
    }
    
    const prescriptionCards = prescriptions.slice(0, 10).map(prescription => `
        <div class="active-prescription-card" onclick="quickVerify('${prescription.prescriptionId}')">
            <div class="prescription-info">
                <span class="prescription-id">${prescription.prescriptionId}</span>
                <span class="patient-name">${prescription.patientName}</span>
                <span class="medication">${prescription.medication}</span>
                <span class="issue-date">${new Date(prescription.issueDate).toLocaleDateString()}</span>
            </div>
            <button class="quick-verify-btn" onclick="event.stopPropagation(); quickVerify('${prescription.prescriptionId}')">
                Quick Verify
            </button>
        </div>
    `).join('');
    
    activeList.innerHTML = prescriptionCards;
}

// Quick verify function
window.quickVerify = function(prescriptionId) {
    document.getElementById('prescription-id').value = prescriptionId;
    document.getElementById('verify-form').dispatchEvent(new Event('submit'));
}

// Setup recent activity monitoring
function setupRecentActivity() {
    const recentActivityList = document.getElementById('recent-activity');
    if (!recentActivityList) return;
    
    const prescriptionsRef = collection(db, 'prescriptions');
    const recentQuery = query(
        prescriptionsRef,
        orderBy('issueDate', 'desc')
    );
    
    onSnapshot(recentQuery, (snapshot) => {
        const recentPrescriptions = snapshot.docs.map(doc => doc.data()).slice(0, 8);
        
        if (recentPrescriptions.length === 0) {
            recentActivityList.innerHTML = '<p class="no-data">No recent activity.</p>';
            return;
        }
        
        const activityItems = recentPrescriptions.map(prescription => `
            <div class="activity-item">
                <div class="activity-icon ${prescription.status}">
                    ${prescription.status === 'active' ? '🟡' : '✅'}
                </div>
                <div class="activity-details">
                    <p><strong>${prescription.patientName}</strong> - ${prescription.medication}</p>
                    <small>${new Date(prescription.issueDate).toLocaleString()}</small>
                </div>
                <span class="activity-status ${prescription.status}">${prescription.status}</span>
            </div>
        `).join('');
        
        recentActivityList.innerHTML = activityItems;
    });
}

// Load recent verification activity for today
async function loadTodayActivity() {
    try {
        const activityList = document.getElementById('activity-list');
        
        // Import query functions
        const { query, where, orderBy, limit, getDocs, collection } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
        
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Query prescriptions that were filled today
        const q = query(
            collection(db, 'prescriptions'),
            where('status', '==', 'filled'),
            orderBy('issueDate', 'desc'),
            limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            activityList.innerHTML = '<p class="no-data">No prescriptions verified today.</p>';
            return;
        }
        
        let activityHTML = '';
        let todayCount = 0;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const issueDate = new Date(data.issueDate);
            const timeAgo = getTimeAgo(issueDate);
            
            // Count today's verifications
            if (issueDate >= today && issueDate < tomorrow) {
                todayCount++;
            }
            
            activityHTML += `
                <div class="activity-item">
                    <div class="activity-info">
                        <strong>${data.patientName}</strong>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                    <div class="activity-details">
                        <p><strong>ID:</strong> <code>${data.prescriptionId}</code></p>
                        <p><strong>Medication:</strong> ${data.medication}</p>
                        <span class="status-filled">DISPENSED</span>
                    </div>
                </div>
            `;
        });
        
        activityList.innerHTML = activityHTML;
        
        // Stats are updated by updatePharmacistStats function
        
    } catch (error) {
        console.error('Error loading today\'s activity:', error);
        document.getElementById('activity-list').innerHTML = '<p class="error">Error loading activity.</p>';
    }
}

// Helper function to calculate time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
}

// Load activity when pharmacist dashboard is shown
const originalShowPharmacistView = window.showPharmacistView;
window.showPharmacistView = function() {
    originalShowPharmacistView();
    setTimeout(() => {
        loadTodayActivity();
        updatePharmacistStats();
    }, 500);
};

// Reload activity after marking a prescription as filled
const originalMarkAsFilled = markAsFilled;
markAsFilled = async function(prescriptionId) {
    await originalMarkAsFilled(prescriptionId);
    setTimeout(() => {
        loadTodayActivity();
        updatePharmacistStats();
    }, 1000);
};

// Chart instances for cleanup
let dailyActivityChart = null;
let statusTrendsChart = null;
let hourlyPatternChart = null;

// Professional color scheme
const chartColors = {
    primary: '#2563eb',      // Blue
    secondary: '#10b981',    // Emerald  
    accent: '#f59e0b',       // Amber
    danger: '#ef4444',       // Red
    success: '#22c55e',      // Green
    warning: '#f97316',      // Orange
    info: '#06b6d4',         // Cyan
    gray: '#6b7280'          // Gray
};

// Chart configuration defaults
const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                    size: 12,
                    family: "'Inter', sans-serif"
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#f9fafb',
            bodyColor: '#f9fafb',
            borderColor: '#374151',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            intersect: false,
            mode: 'index'
        }
    },
    scales: {
        x: {
            grid: {
                color: 'rgba(156, 163, 175, 0.1)',
                borderColor: 'rgba(156, 163, 175, 0.2)'
            },
            ticks: {
                color: '#6b7280',
                font: {
                    size: 11,
                    family: "'Inter', sans-serif"
                }
            }
        },
        y: {
            grid: {
                color: 'rgba(156, 163, 175, 0.1)',
                borderColor: 'rgba(156, 163, 175, 0.2)'
            },
            ticks: {
                color: '#6b7280',
                font: {
                    size: 11,
                    family: "'Inter', sans-serif"
                }
            },
            beginAtZero: true
        }
    }
};

// Professional Chart Management System
class PharmacyChartManager {
    constructor() {
        this.charts = {};
        this.chartTheme = this.getChartTheme();
        this.initializeCharts();
        this.setupThemeListener();
    }
    
    getChartTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        return {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#ffffff',
            textColor: isDark ? '#e2e8f0' : '#334155',
            gridColor: isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(148, 163, 184, 0.2)',
            borderColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.5)',
            colors: {
                primary: isDark ? '#60a5fa' : '#3b82f6',
                success: isDark ? '#34d399' : '#10b981',
                warning: isDark ? '#fbbf24' : '#f59e0b',
                error: isDark ? '#f87171' : '#ef4444',
                info: isDark ? '#a78bfa' : '#8b5cf6',
                secondary: isDark ? '#94a3b8' : '#64748b'
            }
        };
    }
    
    initializeCharts() {
        this.initializeDailyActivityChart();
        this.initializeStatusTrendsChart();
    }
    
    initializeDailyActivityChart() {
        const ctx = document.getElementById('daily-activity-chart');
        if (!ctx) return;
        
        // Generate sample data for last 7 days
        const labels = [];
        const verificationData = [];
        const approvalData = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            
            // Generate realistic sample data
            verificationData.push(Math.floor(Math.random() * 50) + 20);
            approvalData.push(Math.floor(Math.random() * 45) + 15);
        }
        
        this.charts.dailyActivity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Verifications',
                        data: verificationData,
                        borderColor: this.chartTheme.colors.primary,
                        backgroundColor: `${this.chartTheme.colors.primary}20`,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: this.chartTheme.colors.primary,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 3,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointHoverBackgroundColor: this.chartTheme.colors.primary,
                        pointHoverBorderColor: '#ffffff',
                        pointHoverBorderWidth: 3
                    },
                    {
                        label: 'Approvals',
                        data: approvalData,
                        borderColor: this.chartTheme.colors.success,
                        backgroundColor: `${this.chartTheme.colors.success}20`,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: this.chartTheme.colors.success,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 3,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointHoverBackgroundColor: this.chartTheme.colors.success,
                        pointHoverBorderColor: '#ffffff',
                        pointHoverBorderWidth: 3
                    }
                ]
            },
            options: this.getLineChartOptions('Daily Activity', 'Prescriptions')
        });
    }
    
    initializeStatusTrendsChart() {
        const ctx = document.getElementById('status-trends-chart');
        if (!ctx) return;
        
        // Generate sample data for last 30 days (weekly points)
        const labels = [];
        const activeData = [];
        const filledData = [];
        const expiredData = [];
        
        for (let i = 4; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 7));
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            activeData.push(Math.floor(Math.random() * 40) + 60);
            filledData.push(Math.floor(Math.random() * 35) + 45);
            expiredData.push(Math.floor(Math.random() * 10) + 2);
        }
        
        this.charts.statusTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Active',
                        data: activeData,
                        borderColor: this.chartTheme.colors.primary,
                        backgroundColor: `${this.chartTheme.colors.primary}15`,
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: this.chartTheme.colors.primary,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    },
                    {
                        label: 'Filled',
                        data: filledData,
                        borderColor: this.chartTheme.colors.success,
                        backgroundColor: `${this.chartTheme.colors.success}15`,
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: this.chartTheme.colors.success,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    },
                    {
                        label: 'Expired',
                        data: expiredData,
                        borderColor: this.chartTheme.colors.warning,
                        backgroundColor: `${this.chartTheme.colors.warning}15`,
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: this.chartTheme.colors.warning,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }
                ]
            },
            options: this.getLineChartOptions('Status Trends', 'Prescriptions')
        });
    }
    
    getLineChartOptions(title, yAxisLabel, showArea = false) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: this.chartTheme.textColor,
                        font: {
                            family: 'Inter, system-ui, sans-serif',
                            size: 12,
                            weight: '500'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: this.chartTheme.backgroundColor,
                    titleColor: this.chartTheme.textColor,
                    bodyColor: this.chartTheme.textColor,
                    borderColor: this.chartTheme.borderColor,
                    borderWidth: 1,
                    cornerRadius: 12,
                    padding: 12,
                    titleFont: {
                        family: 'Inter, system-ui, sans-serif',
                        size: 13,
                        weight: '600'
                    },
                    bodyFont: {
                        family: 'Inter, system-ui, sans-serif',
                        size: 12,
                        weight: '500'
                    },
                    displayColors: true,
                    usePointStyle: true,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: this.chartTheme.textColor,
                        font: {
                            family: 'Inter, system-ui, sans-serif',
                            size: 11,
                            weight: '500'
                        }
                    }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    grid: {
                        color: this.chartTheme.gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: this.chartTheme.textColor,
                        font: {
                            family: 'Inter, system-ui, sans-serif',
                            size: 11,
                            weight: '500'
                        },
                        callback: function(value) {
                            return Number.isInteger(value) ? value : null;
                        }
                    }
                }
            },
            elements: {
                line: {
                    borderCapStyle: 'round',
                    borderJoinStyle: 'round'
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutCubic'
            }
        };
    }
    
    setupThemeListener() {
        // Listen for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    this.updateChartsTheme();
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }
    
    updateChartsTheme() {
        this.chartTheme = this.getChartTheme();
        
        Object.keys(this.charts).forEach(chartKey => {
            const chart = this.charts[chartKey];
            if (chart) {
                // Update chart colors based on new theme
                chart.options.plugins.legend.labels.color = this.chartTheme.textColor;
                chart.options.plugins.tooltip.backgroundColor = this.chartTheme.backgroundColor;
                chart.options.plugins.tooltip.titleColor = this.chartTheme.textColor;
                chart.options.plugins.tooltip.bodyColor = this.chartTheme.textColor;
                chart.options.plugins.tooltip.borderColor = this.chartTheme.borderColor;
                chart.options.scales.x.ticks.color = this.chartTheme.textColor;
                chart.options.scales.y.ticks.color = this.chartTheme.textColor;
                chart.options.scales.y.grid.color = this.chartTheme.gridColor;
                
                chart.update('none');
            }
        });
    }
    
    // Method to update charts with real data
    updateChartData(chartName, newData) {
        if (this.charts[chartName]) {
            this.charts[chartName].data = newData;
            this.charts[chartName].update();
        }
    }
    
    // Method to destroy all charts (cleanup)
    destroyCharts() {
        Object.keys(this.charts).forEach(chartKey => {
            if (this.charts[chartKey]) {
                this.charts[chartKey].destroy();
            }
        });
        this.charts = {};
    }
}

// Initialize charts when DOM is loaded
let pharmacyChartManager = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts after a short delay to ensure DOM is ready
    setTimeout(() => {
        pharmacyChartManager = new PharmacyChartManager();
        console.log('✅ Pharmacy charts initialized');
    }, 500);
});

// Export for potential external use
window.pharmacyChartManager = pharmacyChartManager;

// Force enable paste functionality for prescription ID input
document.addEventListener('DOMContentLoaded', function() {
    const prescriptionInput = document.getElementById('prescription-id');
    
    if (prescriptionInput) {
        // Ensure paste events are not blocked
        prescriptionInput.addEventListener('paste', function(e) {
            console.log('Paste event triggered');
            // Let the default paste behavior work
        });
        
        // Add keyboard shortcut listener
        prescriptionInput.addEventListener('keydown', function(e) {
            // Cmd+V on Mac or Ctrl+V on Windows
            if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
                console.log('Paste shortcut detected');
                // Let the default paste behavior work
            }
        });
        
        // Remove any conflicting styles
        prescriptionInput.style.userSelect = 'text';
        prescriptionInput.style.webkitUserSelect = 'text';
        prescriptionInput.style.pointerEvents = 'auto';
    }
});

// Manual paste function using clipboard API
window.pasteFromClipboard = async function() {
    try {
        const prescriptionInput = document.getElementById('prescription-id');
        prescriptionInput.focus();
        
        // Try clipboard API
        if (navigator.clipboard) {
            try {
                const text = await navigator.clipboard.readText();
                prescriptionInput.value = text.trim();
                console.log('Successfully pasted:', text);
                return;
            } catch (err) {
                console.log('Clipboard API failed, trying execCommand');
            }
        }
        
        // Fallback: Use execCommand
        prescriptionInput.value = '';
        prescriptionInput.focus();
        
        // Try to trigger paste with execCommand
        if (document.execCommand('paste')) {
            console.log('execCommand paste worked');
        } else {
            // Final fallback - show instructions
            const userInput = prompt('Paste the prescription ID here:');
            if (userInput) {
                prescriptionInput.value = userInput.trim();
            }
        }
        
    } catch (error) {
        console.error('All paste methods failed:', error);
        // Final fallback
        const userInput = prompt('Paste the prescription ID here:');
        if (userInput) {
            document.getElementById('prescription-id').value = userInput.trim();
        }
    }
};

// Initialize dashboard and test paste functionality when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing pharmacist dashboard...');
    
    // Initialize dashboard features after authentication is verified
    setTimeout(() => {
        initializePharmacistDashboard();
    }, 1000);
    
    // Test paste functionality
    const testTextarea = document.createElement('textarea');
    testTextarea.style.position = 'absolute';
    testTextarea.style.left = '-9999px';
    document.body.appendChild(testTextarea);
    
    testTextarea.focus();
    testTextarea.select();
    
    // Test if paste works
    setTimeout(() => {
        if (document.execCommand('paste')) {
            console.log('✅ Paste is working on this page');
        } else {
            console.log('❌ Paste might be blocked');
        }
        document.body.removeChild(testTextarea);
    }, 100);
    
    // Make sure prescription input allows paste
    const prescriptionInput = document.getElementById('prescription-id');
    if (prescriptionInput) {
        prescriptionInput.addEventListener('input', function() {
            // Clean up the input - keep only prescription ID format
            let value = this.value.replace(/\s+/g, '').trim();
            if (value !== this.value) {
                this.value = value;
            }
        });
    }
});
