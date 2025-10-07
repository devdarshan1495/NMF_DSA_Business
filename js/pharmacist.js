// Pharmacist dashboard logic and prescription verification
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db } from './firebase-config.js';

// Wait for DOM to be ready before attaching event listeners
let verifyForm = null;
let resultsContainer = null;

// Initialize form after DOM loads
function initializeVerifyForm() {
    verifyForm = document.getElementById('verify-form');
    resultsContainer = document.getElementById('results-container');
    
    if (verifyForm) {
        verifyForm.addEventListener('submit', handleVerifySubmit);
        console.log('✅ Verify form initialized successfully');
    } else {
        console.error('❌ Verify form not found');
    }
}

// Handle verification form submission
async function handleVerifySubmit(e) {
    e.preventDefault();
    
    const prescriptionId = document.getElementById('prescription-id').value.trim();
    
    if (!prescriptionId) {
        showResults('error', 'Please enter a prescription ID');
        return;
    }
    
    try {
        console.log('🔍 Verifying prescription:', prescriptionId);
        
        // DSA Logic: Hash Table Lookup using Firestore doc().get()
        const prescriptionDoc = await getDoc(doc(db, 'prescriptions', prescriptionId));
        
        if (!prescriptionDoc.exists()) {
            showResults('error', 'NOT FOUND: Prescription does not exist');
            return;
        }
        
        const prescriptionData = prescriptionDoc.data();
        
        // Update status to "viewed" when pharmacist views it
        if (prescriptionData.status === 'active') {
            await updatePrescriptionStatus(prescriptionId, 'viewed');
            prescriptionData.status = 'viewed'; // Update local data
            console.log('✅ Prescription status updated to "viewed"');
        }
        
        if (prescriptionData.status === 'filled') {
            showResults('error', 'ALREADY FILLED: This prescription has already been dispensed', prescriptionData, prescriptionId);
            return;
        }
        
        // Show success for active or viewed prescriptions
        if (prescriptionData.status === 'viewed' || prescriptionData.status === 'active') {
            showResults('success', 'VALID: Prescription found', prescriptionData, prescriptionId);
        }
        
    } catch (error) {
        console.error('❌ Error verifying prescription:', error);
        showResults('error', 'Error verifying prescription: ' + error.message);
    }
}

// Update prescription status in Firebase
async function updatePrescriptionStatus(prescriptionId, newStatus) {
    try {
        await updateDoc(doc(db, 'prescriptions', prescriptionId), {
            status: newStatus,
            viewedDate: newStatus === 'viewed' ? new Date().toISOString() : null,
            viewedAt: newStatus === 'viewed' ? new Date().toISOString() : null
        });
        console.log(`✅ Prescription ${prescriptionId} status updated to ${newStatus}`);
    } catch (error) {
        console.error('❌ Error updating prescription status:', error);
        throw error;
    }
}

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
}

// Load real-time stats for pharmacist
function loadPharmacistStats() {
    const prescriptionsRef = collection(db, 'prescriptions');
    
    // Listen to all unfilled prescriptions (active + viewed)
    onSnapshot(prescriptionsRef, (snapshot) => {
        const allPrescriptions = snapshot.docs.map(doc => doc.data());
        
        // Count pending (active + viewed, not filled)
        const pendingCount = allPrescriptions.filter(p => 
            p.status === 'active' || p.status === 'viewed'
        ).length;
        
        // Count filled prescriptions
        const filledCount = allPrescriptions.filter(p => p.status === 'filled').length;
        
        // Update UI
        const pendingElement = document.getElementById('pending-verification');
        const totalElement = document.getElementById('total-verified');
        
        if (pendingElement) pendingElement.textContent = pendingCount;
        if (totalElement) totalElement.textContent = filledCount;
        
        // Update active prescriptions list
        const activePrescriptions = allPrescriptions.filter(p => 
            p.status === 'active' || p.status === 'viewed'
        ).sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
        
        updateActivePrescriptions(activePrescriptions);
    });
    
    // Get today's filled count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split('T')[0];
    
    onSnapshot(prescriptionsRef, (snapshot) => {
        const todayFilled = snapshot.docs.filter(doc => {
            const data = doc.data();
            if (data.status === 'filled' && data.filledDate) {
                const filledDate = new Date(data.filledDate);
                return filledDate.toISOString().split('T')[0] === todayISO;
            }
            return false;
        }).length;
        
        const verifiedTodayElement = document.getElementById('verified-today');
        if (verifiedTodayElement) {
            verifiedTodayElement.textContent = todayFilled;
        }
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

// Update pharmacist dashboard statistics
async function updatePharmacistStats() {
    try {
        const { query, where, getDocs, collection } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
        
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Get all prescriptions
        const allQuery = query(collection(db, 'prescriptions'));
        const allSnapshot = await getDocs(allQuery);
        
        let verifiedToday = 0;
        let pendingVerification = 0;
        let totalVerified = 0;
        
        allSnapshot.forEach((doc) => {
            const data = doc.data();
            const issueDate = new Date(data.issueDate);
            
            if (data.status === 'filled') {
                totalVerified++;
                // Check if filled today (approximate)
                if (issueDate >= today && issueDate < tomorrow) {
                    verifiedToday++;
                }
            } else if (data.status === 'active') {
                pendingVerification++;
            }
        });
        
        // Update the UI
        document.getElementById('verified-today').textContent = verifiedToday;
        document.getElementById('pending-verification').textContent = pendingVerification;
        document.getElementById('total-verified').textContent = totalVerified;
        
    } catch (error) {
        console.error('Error updating pharmacist stats:', error);
    }
}

// Cleanup function
export function cleanupPharmacistDashboard() {
    if (activeListener) {
        activeListener();
        activeListener = null;
    }
    if (recentListener) {
        recentListener();
        recentListener = null;
    }
}

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
    console.log('📋 Page loaded, initializing pharmacist dashboard...');
    
    // Initialize the verify form first
    initializeVerifyForm();
    
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
