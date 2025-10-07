// Doctor dashboard logic and prescription ID generation
import { doc, setDoc, collection, query, where, onSnapshot, orderBy, limit, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db, auth } from './firebase-config.js';

// DSA Implementation: Hash function (djb2 algorithm)
function generatePrescriptionId(dataString) {
    let hash = 5381;
    for (let i = 0; i < dataString.length; i++) {
        hash = ((hash << 5) + hash) + dataString.charCodeAt(i);
    }
    return Math.abs(hash);
}

// Handle prescription form submission
async function handlePrescriptionSubmission(e) {
    e.preventDefault();
    
    console.log('✅ handlePrescriptionSubmission called successfully!');
    
    // Patient Information
    const patientName = document.getElementById('patient-name').value;
    const patientAge = document.getElementById('patient-age').value;
    const patientGender = document.getElementById('patient-gender').value;
    const patientContact = document.getElementById('patient-contact').value;
    
    // Collect medications data
    const medications = collectMedicationsData();
    
    // Additional Information
    const diagnosis = document.getElementById('diagnosis').value;
    const notes = document.getElementById('notes').value;
    const allergies = document.getElementById('allergies').value;

    
    try {
        // Create unique seed string
        const seedString = auth.currentUser.uid + patientName + Date.now();
        
        // Generate hash and create prescription ID
        const hashValue = generatePrescriptionId(seedString);
        const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const prescriptionId = `${currentDate}-${hashValue}`;
        
        // Create comprehensive prescription data object
        const prescriptionData = {
            prescriptionId: prescriptionId,
            doctorId: auth.currentUser.uid,
            issueDate: new Date().toISOString(),
            status: 'active',
            
            // Patient Information
            patient: {
                name: patientName,
                age: patientAge || null,
                gender: patientGender || null,
                contact: patientContact || null
            },
            
            // Medications array
            medications: medications,
            
            // Additional Information
            diagnosis: diagnosis || null,
            notes: notes || null,
            allergies: allergies || null
        };
        
        // Save to Firestore using prescription ID as document ID
        console.log('Saving prescription:', prescriptionData);
        await setDoc(doc(db, 'prescriptions', prescriptionId), prescriptionData);
        console.log('Prescription saved successfully to Firestore with ID:', prescriptionId);
        
        // Show success message with prescription ID
        showSuccessMessage(prescriptionId);
        
        // Reset form
        resetPrescriptionForm();
        
        // Reload dashboard data
        reloadDashboardData();
        
        console.log('✅ Prescription creation completed successfully');
        
    } catch (error) {
        console.error('❌ Error creating prescription:', error);
        alert('Error creating prescription: ' + error.message);
    }
    
    // CRITICAL: Always return false to prevent any form submission
    return false;
}

// Show success message with prescription ID
function showSuccessMessage(prescriptionId) {
    console.log('showSuccessMessage called with ID:', prescriptionId);
    
    // Create a modal overlay
    const modalHTML = `
        <div id="prescription-id-modal" class="prescription-modal-overlay">
            <div class="prescription-modal">
                <div class="prescription-modal-header">
                    <h3>✅ Prescription Created!</h3>
                    <button class="prescription-modal-close" onclick="closePrescriptionIDModal()">&times;</button>
                </div>
                <div class="prescription-modal-body">
                    <p style="margin-bottom: 1rem; color: var(--text-secondary);">Share this ID with the patient:</p>
                    <div class="prescription-id-box">
                        <code id="prescription-id-text">${prescriptionId}</code>
                    </div>
                    <button type="button" class="btn btn-primary" onclick="copyPrescriptionId('${prescriptionId}')" style="width: 100%; margin-top: 1rem;">
                        📋 Copy Prescription ID
                    </button>
                    <p style="margin-top: 1rem; font-size: 0.875rem; color: var(--text-secondary); text-align: center;">
                        Patient needs this ID for pharmacy verification
                    </p>
                </div>
            </div>
        </div>
    `;
    
    console.log('Modal HTML created');
    
    // Remove existing modal if any
    const existingModal = document.getElementById('prescription-id-modal');
    if (existingModal) {
        console.log('Removing existing modal');
        existingModal.remove();
    }
    
    // Add modal to body
    console.log('Adding modal to body');
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Verify modal was added
    const addedModal = document.getElementById('prescription-id-modal');
    console.log('Modal added to DOM:', addedModal ? 'YES' : 'NO');
    if (addedModal) {
        console.log('Modal element:', addedModal);
        console.log('Modal display:', window.getComputedStyle(addedModal).display);
        console.log('Modal z-index:', window.getComputedStyle(addedModal).zIndex);
        console.log('Modal opacity:', window.getComputedStyle(addedModal).opacity);
    }
    
    // Show modal immediately for testing, then add animation class
    const modal = document.getElementById('prescription-id-modal');
    if (modal) {
        console.log('Adding show class immediately');
        modal.classList.add('show');
        console.log('Show class added, modal should be visible');
        console.log('Modal classes:', modal.className);
    }
}

// Close prescription ID modal
window.closePrescriptionIDModal = function() {
    const modal = document.getElementById('prescription-id-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// Copy prescription ID to clipboard
window.copyPrescriptionId = function(prescriptionId) {
    // Try clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(prescriptionId).then(() => {
            showCopySuccess();
        }).catch(err => {
            console.error('Clipboard API failed: ', err);
            fallbackCopy(prescriptionId);
        });
    } else {
        // Fallback for non-HTTPS or older browsers
        fallbackCopy(prescriptionId);
    }
    
    function showCopySuccess() {
        const copyBtn = event.target;
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copied!';
        copyBtn.style.background = '#28a745';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);
    }
    
    function fallbackCopy(text) {
        // Create temporary textarea for fallback copy
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showCopySuccess();
        } catch (err) {
            alert('Copy failed. Please copy manually: ' + text);
        }
        
        document.body.removeChild(textArea);
    }
    
    return false;
};

// Real-time prescription monitoring
let prescriptionListener = null;

// Initialize real-time features when dashboard loads
export function initializeDoctorDashboard() {
    if (!auth.currentUser) {
        console.log('No authenticated user, skipping dashboard initialization');
        return;
    }
    
    console.log('Initializing doctor dashboard for user:', auth.currentUser.uid);
    loadPrescriptionStats();
    setupRecentPrescriptions();
    loadRecentPrescriptions();
}

// Load prescription statistics
async function loadPrescriptionStats() {
    if (!auth.currentUser) return;
    
    const prescriptionsRef = collection(db, 'prescriptions');
    const doctorQuery = query(
        prescriptionsRef, 
        where('doctorId', '==', auth.currentUser.uid)
    );
    
    // Real-time listener for stats
    prescriptionListener = onSnapshot(doctorQuery, (snapshot) => {
        const prescriptions = snapshot.docs.map(doc => doc.data());
        
        // Sort prescriptions by issue date (most recent first)
        prescriptions.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
        
        // Calculate stats
        const total = prescriptions.length;
        const active = prescriptions.filter(p => p.status === 'active').length;
        const filled = prescriptions.filter(p => p.status === 'filled').length;
        
        // Update UI
        document.getElementById('total-prescriptions').textContent = total;
        document.getElementById('active-prescriptions').textContent = active;
        document.getElementById('filled-prescriptions').textContent = filled;
        
        // Update recent prescriptions list
        updateRecentPrescriptions(prescriptions.slice(0, 5));
    });
}

// Update doctor dashboard statistics
async function updateDoctorStats() {
    try {
        if (!auth.currentUser) return;
        
        const { query, where, getDocs, collection } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
        
        // Get all prescriptions by this doctor
        const doctorQuery = query(
            collection(db, 'prescriptions'),
            where('doctorId', '==', auth.currentUser.uid)
        );
        
        const querySnapshot = await getDocs(doctorQuery);
        
        let totalCount = 0;
        let activeCount = 0;
        let filledCount = 0;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            totalCount++;
            
            if (data.status === 'active') {
                activeCount++;
            } else if (data.status === 'filled') {
                filledCount++;
            }
        });
        
        // Update the UI
        document.getElementById('total-prescriptions').textContent = totalCount;
        document.getElementById('active-prescriptions').textContent = activeCount;
        document.getElementById('filled-prescriptions').textContent = filledCount;
        
    } catch (error) {
        console.error('Error updating doctor stats:', error);
    }
}

// Setup recent prescriptions display
function setupRecentPrescriptions() {
    const recentList = document.getElementById('recent-list');
    if (!recentList) {
        console.log('Recent list element not found');
        return;
    }
    
    console.log('Setting up recent prescriptions display');
    recentList.innerHTML = '<div class="loading">Loading recent prescriptions...</div>';
    
    // Load prescriptions immediately after setup
    setTimeout(() => {
        loadRecentPrescriptions();
    }, 100);
}

// Update recent prescriptions list
function updateRecentPrescriptions(prescriptions) {
    const recentList = document.getElementById('recent-list');
    if (!recentList) return;
    
    if (prescriptions.length === 0) {
        recentList.innerHTML = '<p class="no-data">No prescriptions created yet.</p>';
        return;
    }
    
    const prescriptionCards = prescriptions.map(prescription => `
        <div class="prescription-card ${prescription.status}">
            <div class="prescription-header">
                <span class="prescription-id">${prescription.prescriptionId}</span>
                <span class="status-badge ${prescription.status}">${prescription.status.toUpperCase()}</span>
            </div>
            <div class="prescription-details">
                <p><strong>Patient:</strong> ${prescription.patientName}</p>
                <p><strong>Medication:</strong> ${prescription.medication}</p>
                <p><strong>Dosage:</strong> ${prescription.dosage}</p>
                <p><strong>Date:</strong> ${new Date(prescription.issueDate).toLocaleDateString()}</p>
            </div>
        </div>
    `).join('');
    
    recentList.innerHTML = prescriptionCards;
}

// Load recent prescriptions for the current doctor
async function loadRecentPrescriptions() {
    try {
        const recentList = document.getElementById('recent-list');
        
        if (!auth.currentUser) {
            recentList.innerHTML = '<p class="no-data">Please log in to view prescriptions.</p>';
            return;
        }
        
        // Show loading state
        recentList.innerHTML = '<div class="loading-state"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg><p>Loading recent prescriptions...</p></div>';
        
        // Import query functions from existing import
        const { query, where, orderBy, limit, getDocs, collection } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
        
        console.log('Loading prescriptions for doctor:', auth.currentUser.uid);
        
        // Get recent prescriptions for this doctor (simplified query to avoid index requirement)
        const doctorQuery = query(
            collection(db, 'prescriptions'),
            where('doctorId', '==', auth.currentUser.uid),
            limit(10) // Get more to sort client-side
        );
        
        const querySnapshot = await getDocs(doctorQuery);
        console.log('Prescriptions for this doctor:', querySnapshot.size);
        
        if (querySnapshot.empty) {
            recentList.innerHTML = '<p class="no-data">No prescriptions created yet. Create your first prescription above!</p>';
            return;
        }
        
        // Collect all prescriptions and sort client-side
        let prescriptions = [];
        querySnapshot.forEach((doc) => {
            prescriptions.push(doc.data());
        });
        
        // Sort by issue date (most recent first) and limit to 5
        prescriptions.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
        prescriptions = prescriptions.slice(0, 5);
        
        let prescriptionsHTML = '';
        prescriptions.forEach((prescription) => {
            console.log('Prescription data:', prescription);
            
            const issueDate = new Date(prescription.issueDate).toLocaleDateString();
            const statusClass = prescription.status === 'active' ? 'status-active' : 'status-filled';
            
            // Handle both old and new data structures
            const patientName = prescription.patient ? prescription.patient.name : prescription.patientName;
            
            // Handle medications array or single medication
            let medicationsDisplay = '';
            if (prescription.medications && Array.isArray(prescription.medications)) {
                medicationsDisplay = prescription.medications.map(med => 
                    `${med.name}${med.strength ? ` (${med.strength})` : ''} - ${med.frequency}`
                ).join(', ');
            } else {
                // Old format fallback
                const medicationName = prescription.medication ? prescription.medication.name : prescription.medication;
                const dosageInfo = prescription.medication ? prescription.medication.dosage : prescription.dosage;
                medicationsDisplay = `${medicationName}${dosageInfo ? ` - ${dosageInfo}` : ''}`;
            }
            
            prescriptionsHTML += `
                <div class="prescription-item">
                    <div class="prescription-header">
                        <strong>${patientName}</strong>
                        <span class="prescription-status ${statusClass}">${prescription.status.toUpperCase()}</span>
                    </div>
                    <div class="prescription-details">
                        <p><strong>ID:</strong> <code class="prescription-id">${prescription.prescriptionId}</code></p>
                        <p><strong>Medications:</strong> ${medicationsDisplay}</p>
                        <p><strong>Date:</strong> ${issueDate}</p>
                        ${prescription.diagnosis ? `<p><strong>Diagnosis:</strong> ${prescription.diagnosis}</p>` : ''}
                    </div>
                </div>
            `;
        });
        
        recentList.innerHTML = prescriptionsHTML;
        console.log('Successfully loaded prescriptions');
        
    } catch (error) {
        console.error('Detailed error loading recent prescriptions:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        
        let errorMsg = 'Unable to load recent prescriptions at the moment.';
        let errorDetail = 'Please try refreshing the page or contact support if the issue persists.';
        
        if (error.code === 'failed-precondition') {
            errorMsg = 'Database configuration issue detected.';
            errorDetail = 'This has been resolved. Please refresh the page to continue.';
        } else if (error.code === 'permission-denied') {
            errorMsg = 'Access denied.';
            errorDetail = 'Please ensure you are logged in with the correct account.';
        } else if (error.code === 'unavailable') {
            errorMsg = 'Service temporarily unavailable.';
            errorDetail = 'Please check your internet connection and try again.';
        }
        
        document.getElementById('recent-list').innerHTML = 
            `<div class="error-state">
                <h4>${errorMsg}</h4>
                <p>${errorDetail}</p>
                <button onclick="window.reloadPrescriptions()" class="btn btn-secondary" style="margin-top: 1rem;">Try Again</button>
            </div>`;
    }
}

// Load recent prescriptions when doctor dashboard is shown
if (typeof window.showDoctorView === 'function') {
    const originalShowDoctorView = window.showDoctorView;
    window.showDoctorView = function() {
        originalShowDoctorView();
        setTimeout(() => {
            console.log('Doctor view shown, loading prescriptions...');
            loadRecentPrescriptions();
            updateDoctorStats();
        }, 500);
    };
} else {
    // If showDoctorView doesn't exist yet, define it
    window.showDoctorView = function() {
        console.log('Doctor view shown, loading prescriptions...');
        setTimeout(() => {
            loadRecentPrescriptions();
            updateDoctorStats();
        }, 500);
    };
}

// Function to reload data after prescription creation
function reloadDashboardData() {
    setTimeout(() => {
        loadRecentPrescriptions();
        updateDoctorStats();
    }, 1000);
}

// SINGLE UNIFIED INITIALIZATION - Replaces all other DOMContentLoaded listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Starting unified initialization...');
    
    // Step 1: Initialize prescription form event listener
    const prescriptionForm = document.getElementById('prescription-form');
    if (prescriptionForm) {
        prescriptionForm.addEventListener('submit', handlePrescriptionSubmission);
        console.log('✅ Prescription form event listener attached');
    }
    
    // Step 2: Initialize Add Medication button with retry logic
    let initAttempts = 0;
    const maxAttempts = 10;
    
    function initializeAddMedicationButton() {
        initAttempts++;
        console.log(`🔄 Medication button initialization attempt ${initAttempts}/${maxAttempts}`);
        
        const addButton = document.getElementById('add-medication-btn');
        const container = document.getElementById('medications-container');
        
        if (addButton && container) {
            console.log('✅ Found medication button and container');
            
            // Clear any existing listeners
            addButton.onclick = null;
            
            // Add event listener
            addButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎯 Add medication button clicked!');
                addMedicationRow();
            });
            
            // Add initial medication row if container is empty
            if (container.children.length === 0) {
                console.log('📝 Adding initial medication row...');
                addMedicationRow();
            }
            
            console.log('✅ Medication button initialization complete');
            return true;
        } else {
            if (initAttempts < maxAttempts) {
                console.log(`⏳ Elements not ready, retrying in 200ms...`);
                setTimeout(initializeAddMedicationButton, 200);
            } else {
                console.error('❌ Failed to initialize medication button after maximum attempts');
            }
            return false;
        }
    }
    
    // Start medication button initialization
    setTimeout(initializeAddMedicationButton, 100);
    
    // Step 3: Initialize prescriptions manager if elements exist
    setTimeout(() => {
        if (document.getElementById('prescriptions-list')) {
            console.log('📋 Initializing prescriptions manager...');
            window.prescriptionsManager = new PrescriptionsManager();
        }
    }, 500);
    
    // Step 4: Initialize dashboard data when auth is ready
    setTimeout(() => {
        if (auth.currentUser) {
            console.log('👤 User authenticated, loading dashboard data...');
            loadRecentPrescriptions();
            updateDoctorStats();
        } else {
            console.log('⏳ Waiting for authentication...');
            // Set up auth state listener
            const authUnsubscribe = auth.onAuthStateChanged((user) => {
                if (user) {
                    console.log('👤 User authenticated via listener, loading dashboard data...');
                    loadRecentPrescriptions();
                    updateDoctorStats();
                    authUnsubscribe(); // Unsubscribe after first successful load
                }
            });
        }
    }, 1000);
});

// Legacy function - replaced by unified initialization above

// Add a new medication row
function addMedicationRow(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    console.log('🚀 Adding medication row...');
    
    const container = document.getElementById('medications-container');
    if (!container) {
        console.error('❌ Medications container not found!');
        alert('Error: medications-container not found!');
        return;
    }
    
    const rowCount = container.children.length;
    console.log('📊 Current medication rows:', rowCount);
    
    try {
        const medicationRow = document.createElement('div');
        medicationRow.className = 'medication-row';
        medicationRow.innerHTML = `
            <div class="form-group">
                <label>Medication Name <span class="required">*</span></label>
                <input type="text" class="medicine-name" placeholder="Paracetamol" required>
            </div>
            <div class="form-group">
                <label>Strength/Dosage</label>
                <input type="text" class="medicine-dosage" placeholder="500mg">
            </div>
            <div class="form-group">
                <label>Frequency <span class="required">*</span></label>
                <input type="text" class="medicine-frequency" placeholder="Twice daily after meals" required>
            </div>
            ${rowCount > 0 ? '<button type="button" class="remove-medication-btn" title="Remove Medication">×</button>' : '<div class="placeholder"></div>'}
        `;
        
        // Add remove functionality if not first row
        if (rowCount > 0) {
            const removeBtn = medicationRow.querySelector('.remove-medication-btn');
            removeBtn.addEventListener('click', () => removeMedicationRow(medicationRow));
        }
        
        container.appendChild(medicationRow);
        console.log('✅ Medication row added successfully!');
        
    } catch (error) {
        console.error('❌ Error adding medication row:', error);
        alert('Error adding medication row: ' + error.message);
    }
}

// Remove a medication row
function removeMedicationRow(row) {
    row.remove();
    updateMedicationNumbers();
}

// Update medication row numbers (no longer needed with new design)
function updateMedicationNumbers() {
    // Updated design doesn't show medication numbers
}

// Collect all medication data from rows
function collectMedicationsData() {
    console.log('💊 Collecting medications data...');
    const medications = [];
    const rows = document.querySelectorAll('.medication-row');
    console.log('📊 Found medication rows:', rows.length);
    
    if (rows.length === 0) {
        console.warn('⚠️ No medication rows found! Adding initial row...');
        addMedicationRow();
        // Re-query for rows after adding
        const newRows = document.querySelectorAll('.medication-row');
        console.log('📊 Rows after adding initial:', newRows.length);
    }
    
    const finalRows = document.querySelectorAll('.medication-row');
    finalRows.forEach((row, index) => {
        const nameInput = row.querySelector('.medicine-name');
        const dosageInput = row.querySelector('.medicine-dosage');
        const frequencyInput = row.querySelector('.medicine-frequency');
        
        console.log(`Row ${index + 1}:`, {
            nameInput: !!nameInput,
            dosageInput: !!dosageInput,
            frequencyInput: !!frequencyInput
        });
        
        if (nameInput && dosageInput && frequencyInput) {
            const name = nameInput.value.trim();
            const dosage = dosageInput.value.trim();
            const frequency = frequencyInput.value.trim();
            
            console.log(`Row ${index + 1} data:`, { name, dosage, frequency });
            
            if (name && frequency) { // Only add if required fields are filled
                medications.push({
                    name: name,
                    strength: dosage || null,
                    frequency: frequency
                });
            }
        } else {
            console.error(`❌ Missing input elements in row ${index + 1}`);
        }
    });
    
    console.log('✅ Final medications array:', medications);
    return medications;
}

// Reset prescription form including dynamic medications
function resetPrescriptionForm() {
    // Reset basic form fields
    const prescriptionForm = document.getElementById('prescription-form');
    if (prescriptionForm) {
        prescriptionForm.reset();
    }
    
    // Clear medications container and add first row
    const container = document.getElementById('medications-container');
    if (container) {
        container.innerHTML = '';
        addMedicationRow();
    }
    
    // Hide success message
    const successMessage = document.getElementById('success-message');
    if (successMessage) {
        successMessage.style.display = 'none';
    }
}

// Cleanup function for when leaving dashboard
export function cleanupDoctorDashboard() {
    if (prescriptionListener) {
        prescriptionListener();
        prescriptionListener = null;
    }
}

// Manual trigger for loading prescriptions (for debugging)
window.reloadPrescriptions = function() {
    console.log('Manually reloading prescriptions...');
    loadRecentPrescriptions();
    updateDoctorStats();
};

// Auth state change listener to reload data when user signs in
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User authenticated, loading dashboard data...');
        setTimeout(() => {
            loadRecentPrescriptions();
            updateDoctorStats();
        }, 1000);
    } else {
        console.log('User not authenticated');
        const recentList = document.getElementById('recent-list');
        if (recentList) {
            recentList.innerHTML = '<p class="no-data">Please log in to view prescriptions.</p>';
        }
    }
});

// Prescriptions Management System
class PrescriptionsManager {
    constructor() {
        this.prescriptions = [];
        this.filteredPrescriptions = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        
        this.initializeElements();
        this.bindEvents();
        this.loadPrescriptions();
    }
    
    initializeElements() {
        this.prescriptionsList = document.getElementById('prescriptions-list');
        this.prescriptionsLoading = document.getElementById('prescriptions-loading');
        this.prescriptionFilter = document.getElementById('prescription-filter');
        this.prescriptionSearch = document.getElementById('prescription-search');
        
        // Stats elements
        this.totalPrescriptions = document.getElementById('total-prescriptions');
        this.activePrescriptions = document.getElementById('active-prescriptions');
        this.filledPrescriptions = document.getElementById('filled-prescriptions');
        this.expiredPrescriptions = document.getElementById('expired-prescriptions');
    }
    
    bindEvents() {
        if (this.prescriptionFilter) {
            this.prescriptionFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.filterPrescriptions();
            });
        }
        
        if (this.prescriptionSearch) {
            this.prescriptionSearch.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterPrescriptions();
            });
        }
    }
    
    async loadPrescriptions() {
        if (!auth.currentUser) return;
        
        this.showLoading(true);
        
        try {
            const prescriptionsRef = collection(db, 'prescriptions');
            const q = query(
                prescriptionsRef,
                where('doctorId', '==', auth.currentUser.uid)
                // Note: Removed orderBy to avoid index requirement - will sort client-side
            );
            
            onSnapshot(q, (snapshot) => {
                this.prescriptions = [];
                snapshot.forEach((doc) => {
                    this.prescriptions.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                // Sort by issue date client-side
                this.prescriptions.sort((a, b) => {
                    const dateA = new Date(a.issueDate || 0);
                    const dateB = new Date(b.issueDate || 0);
                    return dateB - dateA;
                });
                
                this.filterPrescriptions();
                this.updateStats();
                this.showLoading(false);
            });
            
        } catch (error) {
            console.error('Error loading prescriptions:', error);
            this.showError('Failed to load prescriptions');
            this.showLoading(false);
        }
    }
    
    filterPrescriptions() {
        let filtered = [...this.prescriptions];
        
        // Apply status filter
        if (this.currentFilter !== 'all') {
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            filtered = filtered.filter(prescription => {
                switch (this.currentFilter) {
                    case 'recent':
                        const prescriptionDate = new Date(prescription.issueDate);
                        return prescriptionDate >= sevenDaysAgo;
                    case 'active':
                        return prescription.status === 'active';
                    case 'completed':
                        return prescription.status === 'filled';
                    default:
                        return true;
                }
            });
        }
        
        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(prescription => {
                const patientName = prescription.patient ? prescription.patient.name : prescription.patientName || '';
                const prescriptionId = prescription.prescriptionId || '';
                const medicationsMatch = prescription.medications && Array.isArray(prescription.medications) 
                    ? prescription.medications.some(med => med.name.toLowerCase().includes(this.searchTerm))
                    : false;
                
                return (
                    patientName.toLowerCase().includes(this.searchTerm) ||
                    prescriptionId.toString().includes(this.searchTerm) ||
                    medicationsMatch
                );
            });
        }
        
        this.filteredPrescriptions = filtered;
        this.renderPrescriptions();
    }
    
    renderPrescriptions() {
        if (!this.prescriptionsList) return;
        
        if (this.filteredPrescriptions.length === 0) {
            this.prescriptionsList.innerHTML = `
                <div class="prescription-placeholder">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    <h3>No Prescriptions Found</h3>
                    <p>${this.searchTerm ? 'Try adjusting your search or filter' : 'Create your first prescription using the form above'}</p>
                </div>
            `;
            return;
        }
        
        const prescriptionsHTML = this.filteredPrescriptions.map(prescription => 
            this.createPrescriptionCard(prescription)
        ).join('');
        
        this.prescriptionsList.innerHTML = prescriptionsHTML;
        
        // Bind action buttons
        this.bindActionButtons();
    }
    
    createPrescriptionCard(prescription) {
        const createdDate = prescription.issueDate ? new Date(prescription.issueDate) : new Date();
        const formattedDate = createdDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const status = this.determineStatus(prescription);
        const statusClass = status.toLowerCase();
        
        // Handle patient data safely
        const patientName = prescription.patient ? prescription.patient.name : prescription.patientName || 'Unknown Patient';
        const patientAge = prescription.patient ? prescription.patient.age : prescription.patientAge;
        const patientGender = prescription.patient ? prescription.patient.gender : prescription.patientGender;
        const patientContact = prescription.patient ? prescription.patient.contact : prescription.patientContact;
        
        const medicationsHTML = prescription.medications && prescription.medications.length > 0 
            ? prescription.medications.map(med => `
                <div class="medication-item">
                    <span class="medication-name">${med.name}</span>
                    <span class="medication-dosage">${med.strength || ''} - ${med.frequency}</span>
                </div>
            `).join('')
            : '<div class="medication-item">No medications listed</div>';
        
        return `
            <div class="prescription-card" data-id="${prescription.id}">
                <div class="prescription-header">
                    <div class="prescription-id">RX-${prescription.prescriptionId}</div>
                    <div class="prescription-status ${statusClass}">${status}</div>
                </div>
                
                <div class="prescription-patient">
                    <h4>${patientName}</h4>
                    <div class="prescription-patient-info">
                        ${patientAge ? `Age: ${patientAge}` : ''} 
                        ${patientGender ? `• ${patientGender}` : ''}
                        ${patientContact ? `• ${patientContact}` : ''}
                    </div>
                </div>
                
                <div class="prescription-medications">
                    <h5>Medications</h5>
                    ${medicationsHTML}
                </div>
                
                <div class="prescription-footer">
                    <div class="prescription-date">Created: ${formattedDate}</div>
                    <div class="prescription-actions">
                        <button class="btn-view" title="View Details" onclick="prescriptionsManager.viewPrescription('${prescription.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </button>
                        <button class="btn-edit" title="Edit Prescription" onclick="prescriptionsManager.editPrescription('${prescription.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="btn-delete" title="Delete Prescription" onclick="prescriptionsManager.deletePrescription('${prescription.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    determineStatus(prescription) {
        // Simple status determination - can be enhanced based on your needs
        const now = new Date();
        const createdDate = new Date(prescription.issueDate || Date.now());
        const daysSinceCreated = (now - createdDate) / (1000 * 60 * 60 * 24);
        
        if (prescription.status === 'filled') return 'Filled';
        if (daysSinceCreated > 30) return 'Expired';
        return 'Active';
    }
    
    updateStats() {
        const total = this.prescriptions.length;
        const active = this.prescriptions.filter(p => this.determineStatus(p) === 'Active').length;
        const filled = this.prescriptions.filter(p => this.determineStatus(p) === 'Filled').length;
        const expired = this.prescriptions.filter(p => this.determineStatus(p) === 'Expired').length;
        
        if (this.totalPrescriptions) this.totalPrescriptions.textContent = total;
        if (this.activePrescriptions) this.activePrescriptions.textContent = active;
        if (this.filledPrescriptions) this.filledPrescriptions.textContent = filled;
        if (this.expiredPrescriptions) this.expiredPrescriptions.textContent = expired;
    }
    
    bindActionButtons() {
        // Action buttons are bound via onclick attributes in the HTML
        // This method can be used for additional event binding if needed
    }
    
    viewPrescription(id) {
        const prescription = this.prescriptions.find(p => p.id === id);
        if (!prescription) return;
        
        // Create a detailed view modal or navigate to detail page
        alert(`Viewing prescription RX-${prescription.prescriptionId} for ${prescription.patientName}`);
        // TODO: Implement detailed prescription view
    }
    
    editPrescription(id) {
        const prescription = this.prescriptions.find(p => p.id === id);
        if (!prescription) return;
        
        // Populate the form with prescription data for editing
        alert(`Editing prescription RX-${prescription.prescriptionId}`);
        // TODO: Implement prescription editing
    }
    
    async deletePrescription(id) {
        const prescription = this.prescriptions.find(p => p.id === id);
        if (!prescription) return;
        
        if (!confirm(`Are you sure you want to delete prescription RX-${prescription.prescriptionId}?`)) {
            return;
        }
        
        try {
            await deleteDoc(doc(db, 'prescriptions', id));
            this.showSuccess('Prescription deleted successfully');
        } catch (error) {
            console.error('Error deleting prescription:', error);
            this.showError('Failed to delete prescription');
        }
    }
    
    showLoading(show) {
        if (this.prescriptionsLoading) {
            this.prescriptionsLoading.style.display = show ? 'block' : 'none';
        }
        if (this.prescriptionsList) {
            this.prescriptionsList.style.display = show ? 'none' : 'grid';
        }
    }
    
    showSuccess(message) {
        // TODO: Implement success notification
        console.log('Success:', message);
    }
    
    showError(message) {
        // TODO: Implement error notification
        console.error('Error:', message);
    }
}

// (Moved to main initialization)

// Fallback initialization for when DOMContentLoaded might have already fired
if (document.readyState !== 'loading') {
    // Document is already loaded, run initialization immediately
    console.log('📄 Document already loaded - running immediate initialization');
    setTimeout(() => {
        const prescriptionForm = document.getElementById('prescription-form');
        if (prescriptionForm && !prescriptionForm.dataset.initialized) {
            prescriptionForm.addEventListener('submit', handlePrescriptionSubmission);
            prescriptionForm.dataset.initialized = 'true';
        }
        
        const addButton = document.getElementById('add-medication-btn');
        const container = document.getElementById('medications-container');
        if (addButton && container && !addButton.dataset.initialized) {
            addButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                addMedicationRow();
            });
            addButton.dataset.initialized = 'true';
            
            if (container.children.length === 0) {
                addMedicationRow();
            }
        }
    }, 100);
}

// EMERGENCY MANUAL TESTING FUNCTIONS
window.testFormSubmission = function() {
    console.log('🧪 Manual form submission test...');
    const form = document.getElementById('prescription-form');
    if (form) {
        console.log('✅ Form found');
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
    } else {
        console.error('❌ Form not found');
    }
};

window.testMedicationButton = function() {
    console.log('🧪 Manual medication button test...');
    const button = document.getElementById('add-medication-btn');
    if (button) {
        console.log('✅ Button found');
        button.click();
    } else {
        console.error('❌ Button not found');
    }
};
