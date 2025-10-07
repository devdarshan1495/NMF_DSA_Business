// Authentication logic for login/logout with page protection
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { auth, db } from './firebase-config.js';

// Get current page
const currentPage = window.location.pathname.split('/').pop() || 'login.html';

// Handle login form submission (only on login page)
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            // Sign in user - onAuthStateChanged will handle the redirect
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    });
}

// Handle logout button (on dashboard pages)
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            // Redirect to index page after logout
            window.location.href = 'index.html';
        });
    });
}

// Page Protection Guard and Authentication State Observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is authenticated
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (!userDoc.exists()) {
                // User document doesn't exist, sign out and redirect
                signOut(auth);
                window.location.href = 'index.html';
                return;
            }
            
            const userData = userDoc.data();
            const userRole = userData.role;
            
            // Set user info in session storage for dashboard use
            sessionStorage.setItem('currentUser', JSON.stringify({
                uid: user.uid,
                email: user.email,
                role: userRole,
                name: userData.name || user.email.split('@')[0]
            }));
            
            // Handle different page scenarios
            if (currentPage === 'login.html' || currentPage === 'index.html' || currentPage === '') {
                // User is on login/index page but authenticated, redirect to appropriate dashboard
                if (userRole === 'doctor') {
                    window.location.href = 'doctor-dashboard.html';
                } else if (userRole === 'pharmacist') {
                    window.location.href = 'pharmacy-dashboard.html';
                } else {
                    // Unknown role, sign out
                    signOut(auth);
                    window.location.href = 'index.html';
                }
            } else if (currentPage === 'doctor-dashboard.html') {
                // PAGE PROTECTION: Check if user should be on doctor dashboard
                if (userRole !== 'doctor') {
                    // User is NOT a doctor but trying to access doctor dashboard
                    window.location.href = 'index.html';
                    return;
                }
                // User is authenticated and has correct role - allow access
            } else if (currentPage === 'pharmacy-dashboard.html') {
                // PAGE PROTECTION: Check if user should be on pharmacy dashboard
                if (userRole !== 'pharmacist') {
                    // User is NOT a pharmacist but trying to access pharmacy dashboard
                    window.location.href = 'index.html';
                    return;
                }
                // User is authenticated and has correct role - allow access
            }
            
        } catch (error) {
            console.error('Error fetching user role:', error);
            signOut(auth);
            window.location.href = 'index.html';
        }
    } else {
        // User is NOT authenticated
        
        // PAGE PROTECTION: If user is on protected pages without authentication
        if (currentPage === 'doctor-dashboard.html' || currentPage === 'pharmacy-dashboard.html') {
            // Redirect to index page immediately
            window.location.href = 'index.html';
            return;
        }
        
        // If user is on login page or index, allow access
        // Clear any stored user data
        sessionStorage.removeItem('currentUser');
    }
});
