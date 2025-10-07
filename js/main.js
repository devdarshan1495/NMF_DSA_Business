// Main application logic for view switching
import { initializeDoctorDashboard, cleanupDoctorDashboard } from './doctor.js';
import { initializePharmacistDashboard, cleanupPharmacistDashboard } from './pharmacist.js';

// Get DOM element references
const loginContainer = document.getElementById('login-container');
const doctorDashboard = document.getElementById('doctor-dashboard');
const pharmacistDashboard = document.getElementById('pharmacist-dashboard');

// Show login view
export function showLoginView() {
    // Cleanup any active dashboards
    cleanupDoctorDashboard();
    cleanupPharmacistDashboard();
    
    loginContainer.classList.remove('hidden');
    doctorDashboard.classList.add('hidden');
    pharmacistDashboard.classList.add('hidden');
}

// Show doctor dashboard
export function showDoctorView() {
    cleanupPharmacistDashboard();
    
    doctorDashboard.classList.remove('hidden');
    loginContainer.classList.add('hidden');
    pharmacistDashboard.classList.add('hidden');
    
    // Initialize doctor dashboard features
    setTimeout(() => {
        initializeDoctorDashboard();
    }, 100);
}

// Show pharmacist dashboard
export function showPharmacistView() {
    cleanupDoctorDashboard();
    
    pharmacistDashboard.classList.remove('hidden');
    loginContainer.classList.add('hidden');
    doctorDashboard.classList.add('hidden');
    
    // Initialize pharmacist dashboard features
    setTimeout(() => {
        initializePharmacistDashboard();
    }, 100);
}

// Theme management
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-toggle-icon');
    
    // Check for saved theme or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme, themeIcon);
    
    // Theme toggle event listener
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme, themeIcon);
    });
}

function updateThemeIcon(theme, iconElement) {
    iconElement.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Initialize theme when DOM loads
document.addEventListener('DOMContentLoaded', initializeTheme);
