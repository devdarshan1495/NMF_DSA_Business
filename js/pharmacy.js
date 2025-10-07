import supabase from './supabase-client.js';

const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const prescriptionsContainer = document.getElementById('prescriptionsContainer');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const totalCount = document.getElementById('totalCount');
const pendingCount = document.getElementById('pendingCount');
const completedCount = document.getElementById('completedCount');
const prescriptionModal = document.getElementById('prescriptionModal');
const closeModalBtn = document.getElementById('closeModal');
const modalCloseBtn = document.getElementById('modalClose');
const modalBody = document.getElementById('modalBody');
const updateStatusBtn = document.getElementById('updateStatusBtn');

let currentUser = null;
let allPrescriptions = [];
let selectedPrescription = null;

async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        currentUser = session.user;

        const { data: staffData } = await supabase
            .from('pharmacy_staff')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle();

        if (staffData && staffData.is_active) {
            showDashboard();
            loadPrescriptions();
        } else {
            showLogin();
            loginError.textContent = 'You do not have pharmacy staff access';
            loginError.classList.remove('hidden');
        }
    } else {
        showLogin();
    }
}

function showLogin() {
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    logoutBtn.classList.add('hidden');
}

function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoader = loginBtn.querySelector('.btn-loader');

    loginBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        const { data: staffData } = await supabase
            .from('pharmacy_staff')
            .select('*')
            .eq('user_id', data.user.id)
            .maybeSingle();

        if (!staffData || !staffData.is_active) {
            await supabase.auth.signOut();
            throw new Error('You do not have pharmacy staff access');
        }

        currentUser = data.user;
        showDashboard();
        loadPrescriptions();

    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = error.message || 'Invalid email or password';
        loginError.classList.remove('hidden');
    } finally {
        loginBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    currentUser = null;
    showLogin();
    loginForm.reset();
});

async function loadPrescriptions() {
    prescriptionsContainer.innerHTML = `
        <div class="loader-container">
            <div class="loader"></div>
            <p>Loading prescriptions...</p>
        </div>
    `;

    try {
        const { data, error } = await supabase
            .from('prescriptions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allPrescriptions = data || [];
        updateStats();
        filterAndDisplayPrescriptions();

    } catch (error) {
        console.error('Error loading prescriptions:', error);
        prescriptionsContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h3>Failed to load prescriptions</h3>
                <p>Please try refreshing the page</p>
            </div>
        `;
    }
}

function updateStats() {
    totalCount.textContent = allPrescriptions.length;
    pendingCount.textContent = allPrescriptions.filter(p => p.status === 'pending').length;
    completedCount.textContent = allPrescriptions.filter(p => p.status === 'completed').length;
}

function filterAndDisplayPrescriptions() {
    const statusValue = statusFilter.value;
    const searchValue = searchInput.value.toLowerCase();

    let filtered = allPrescriptions;

    if (statusValue !== 'all') {
        filtered = filtered.filter(p => p.status === statusValue);
    }

    if (searchValue) {
        filtered = filtered.filter(p =>
            p.patient_name.toLowerCase().includes(searchValue) ||
            p.patient_email.toLowerCase().includes(searchValue) ||
            p.doctor_name.toLowerCase().includes(searchValue)
        );
    }

    displayPrescriptions(filtered);
}

function displayPrescriptions(prescriptions) {
    if (prescriptions.length === 0) {
        prescriptionsContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                <h3>No prescriptions found</h3>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }

    prescriptionsContainer.innerHTML = prescriptions.map(prescription => `
        <div class="prescription-card" data-id="${prescription.id}">
            <div class="prescription-header">
                <div class="prescription-patient">
                    <div class="patient-name">${prescription.patient_name}</div>
                    <div class="patient-contact">${prescription.patient_email}</div>
                </div>
                <span class="prescription-status status-${prescription.status}">
                    ${prescription.status}
                </span>
            </div>
            <div class="prescription-details">
                <div class="detail-row">
                    <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span class="detail-label">Doctor:</span>
                    <span class="detail-value">${prescription.doctor_name}</span>
                </div>
                <div class="detail-row">
                    <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${prescription.patient_phone}</span>
                </div>
                <div class="detail-row">
                    <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                        <polyline points="13 2 13 9 20 9"/>
                    </svg>
                    <span class="detail-label">File:</span>
                    <span class="detail-value">${prescription.file_name}</span>
                </div>
            </div>
            <div class="prescription-footer">
                Submitted ${formatDate(prescription.created_at)}
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.prescription-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const prescription = allPrescriptions.find(p => p.id === id);
            if (prescription) {
                showPrescriptionModal(prescription);
            }
        });
    });
}

function showPrescriptionModal(prescription) {
    selectedPrescription = prescription;

    modalBody.innerHTML = `
        <div class="modal-section">
            <h4 class="modal-section-title">Patient Information</h4>
            <div class="modal-info-grid">
                <div class="modal-info-item">
                    <div class="modal-info-label">Full Name</div>
                    <div class="modal-info-value">${prescription.patient_name}</div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-label">Email</div>
                    <div class="modal-info-value">${prescription.patient_email}</div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-label">Phone</div>
                    <div class="modal-info-value">${prescription.patient_phone}</div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-label">Doctor</div>
                    <div class="modal-info-value">${prescription.doctor_name}</div>
                </div>
            </div>
        </div>

        <div class="modal-section">
            <h4 class="modal-section-title">Prescription Details</h4>
            <div class="modal-info-grid">
                <div class="modal-info-item">
                    <div class="modal-info-label">Status</div>
                    <div class="modal-info-value">
                        <span class="prescription-status status-${prescription.status}">
                            ${prescription.status}
                        </span>
                    </div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-label">File Name</div>
                    <div class="modal-info-value">${prescription.file_name}</div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-label">File Size</div>
                    <div class="modal-info-value">${formatFileSize(prescription.file_size)}</div>
                </div>
                <div class="modal-info-item">
                    <div class="modal-info-label">Submitted</div>
                    <div class="modal-info-value">${formatDate(prescription.created_at)}</div>
                </div>
            </div>
            ${prescription.notes ? `
                <div class="modal-info-item" style="margin-top: 1rem;">
                    <div class="modal-info-label">Notes</div>
                    <div class="modal-info-value">${prescription.notes}</div>
                </div>
            ` : ''}
        </div>

        <div class="modal-section">
            <h4 class="modal-section-title">Prescription File</h4>
            <div class="modal-file-preview">
                <a href="${prescription.file_url}" target="_blank" class="btn btn-secondary">
                    View File
                </a>
            </div>
        </div>

        <div class="modal-section">
            <h4 class="modal-section-title">Update Status</h4>
            <div class="form-group">
                <label for="modalStatus">Change Status</label>
                <select id="modalStatus" class="form-control">
                    <option value="pending" ${prescription.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${prescription.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="completed" ${prescription.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="rejected" ${prescription.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
            </div>
        </div>
    `;

    prescriptionModal.classList.remove('hidden');
}

function closePrescriptionModal() {
    prescriptionModal.classList.add('hidden');
    selectedPrescription = null;
}

updateStatusBtn.addEventListener('click', async () => {
    if (!selectedPrescription) return;

    const newStatus = document.getElementById('modalStatus').value;

    if (newStatus === selectedPrescription.status) {
        closePrescriptionModal();
        return;
    }

    updateStatusBtn.disabled = true;
    updateStatusBtn.textContent = 'Updating...';

    try {
        const { error } = await supabase
            .from('prescriptions')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', selectedPrescription.id);

        if (error) throw error;

        closePrescriptionModal();
        await loadPrescriptions();

    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status. Please try again.');
    } finally {
        updateStatusBtn.disabled = false;
        updateStatusBtn.textContent = 'Update Status';
    }
});

closeModalBtn.addEventListener('click', closePrescriptionModal);
modalCloseBtn.addEventListener('click', closePrescriptionModal);

document.querySelector('.modal-overlay').addEventListener('click', closePrescriptionModal);

statusFilter.addEventListener('change', filterAndDisplayPrescriptions);
searchInput.addEventListener('input', filterAndDisplayPrescriptions);

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

checkAuth();
