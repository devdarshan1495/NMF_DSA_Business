// Custom Cursor Follower Effect
// Based on https://21st.dev/uilayout.contact/cursor-follower/default

class CursorFollower {
    constructor() {
        this.cursor = null;
        this.cursorBall = null;
        this.isTouch = false;
        
        this.init();
    }
    
    init() {
        // Check if device supports hover (not touch device)
        if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
            this.isTouch = true;
            return;
        }
        
        // Create cursor elements
        this.createCursor();
        
        // Bind events
        this.bindEvents();
    }
    
    createCursor() {
        // Create cursor container
        this.cursor = document.createElement('div');
        this.cursor.className = 'cursor';
        
        // Create cursor ball
        this.cursorBall = document.createElement('div');
        this.cursorBall.className = 'cursor__ball';
        
        // Append to cursor container
        this.cursor.appendChild(this.cursorBall);
        
        // Append to body
        document.body.appendChild(this.cursor);
    }
    
    bindEvents() {
        if (this.isTouch) return;
        
        // Mouse move event
        document.addEventListener('mousemove', (e) => {
            this.moveCursor(e.clientX, e.clientY);
        });
        
        // Mouse enter/leave events for hover effects
        this.bindHoverEvents();
        
        // Click events
        document.addEventListener('mousedown', () => {
            this.cursor.classList.add('cursor--click');
        });
        
        document.addEventListener('mouseup', () => {
            this.cursor.classList.remove('cursor--click');
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.updateCursorPosition();
        });
    }
    
    bindHoverEvents() {
        // Buttons
        const buttons = document.querySelectorAll('button, .btn, input[type="submit"], input[type="button"]');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                this.cursor.classList.add('cursor--button');
            });
            
            button.addEventListener('mouseleave', () => {
                this.cursor.classList.remove('cursor--button');
            });
        });
        
        // Links
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('mouseenter', () => {
                this.cursor.classList.add('cursor--link');
            });
            
            link.addEventListener('mouseleave', () => {
                this.cursor.classList.remove('cursor--link');
            });
        });
        
        // Text inputs
        const textInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea');
        textInputs.forEach(input => {
            input.addEventListener('mouseenter', () => {
                this.cursor.classList.add('cursor--text');
            });
            
            input.addEventListener('mouseleave', () => {
                this.cursor.classList.remove('cursor--text');
            });
        });
        
        // Hoverable elements
        const hoverElements = document.querySelectorAll('.stat-card, .content-section, .nav-item, .prescription-card');
        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                this.cursor.classList.add('cursor--hover');
            });
            
            element.addEventListener('mouseleave', () => {
                this.cursor.classList.remove('cursor--hover');
            });
        });
    }
    
    moveCursor(x, y) {
        if (!this.cursor || this.isTouch) return;
        
        // Use requestAnimationFrame for smooth animation
        requestAnimationFrame(() => {
            this.cursor.style.left = x + 'px';
            this.cursor.style.top = y + 'px';
        });
    }
    
    updateCursorPosition() {
        // Re-bind events for dynamically added elements
        this.bindHoverEvents();
    }
    
    // Method to refresh cursor for dynamically added content
    refresh() {
        this.updateCursorPosition();
    }
    
    // Method to destroy cursor
    destroy() {
        if (this.cursor && this.cursor.parentNode) {
            this.cursor.parentNode.removeChild(this.cursor);
        }
        
        // Remove event listeners
        document.removeEventListener('mousemove', this.moveCursor);
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mouseup', this.handleMouseUp);
    }
}

// Initialize cursor follower when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on non-touch devices
    if (!window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
        window.cursorFollower = new CursorFollower();
        
        // Refresh cursor when new content is loaded (for SPAs or dynamic content)
        const observer = new MutationObserver(() => {
            if (window.cursorFollower) {
                window.cursorFollower.refresh();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CursorFollower;
}
