// Theme management
export function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle?.querySelector('.theme-toggle-icon');
    
    if (!themeToggle) return;

    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(themeIcon, savedTheme);

    // Handle theme toggle
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(themeIcon, newTheme);
    });
}

function updateThemeIcon(icon, theme) {
    if (!icon) return;
    
    // Update SVG icon based on theme
    if (theme === 'dark') {
        // Sun icon for dark mode (click to go to light)
        icon.innerHTML = '<circle cx="12" cy="12" r="5"/><path d="m12 1 0 2"/><path d="m12 21 0 2"/><path d="M4.22 4.22l1.42 1.42"/><path d="m18.36 18.36 1.42 1.42"/><path d="M1 12l2 0"/><path d="m21 12 2 0"/><path d="m4.22 19.78 1.42-1.42"/><path d="m18.36 5.64 1.42-1.42"/>';
    } else {
        // Moon icon for light mode (click to go to dark)
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', initializeTheme);
