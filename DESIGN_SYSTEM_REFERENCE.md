# MedVerify Design System - Quick Reference

## 🎨 Color System

### Primary Blues
```css
--primary-700: #1E40AF  /* Darker blue */
--primary-600: #2563EB  /* Main brand blue */
--primary-500: #3B82F6  /* Interactive blue */
--primary-400: #60A5FA  /* Lighter blue */
--primary-300: #93C5FD  /* Soft blue */
```

### Semantic Colors
```css
/* Success - Green */
#10B981 → #059669

/* Error - Red */
#EF4444 → #DC2626

/* Warning - Amber */
#F59E0B → #D97706
```

### Neutral Grays
```css
/* Text */
--text-primary: #1F2937    /* Headings */
--text-secondary: #6B7280  /* Body text */
#64748B                    /* Inactive items */
#9CA3AF                    /* Placeholders */

/* Borders (Light Mode) */
rgba(0, 0, 0, 0.06)  /* Subtle borders */
rgba(0, 0, 0, 0.1)   /* Input borders */

/* Borders (Dark Mode) */
rgba(255, 255, 255, 0.08)  /* Subtle borders */
rgba(255, 255, 255, 0.1)   /* Input borders */
```

---

## 📏 Spacing Scale

```css
/* Standard spacing rhythm */
0.5rem   = 8px   /* Tight */
0.75rem  = 12px  /* Small */
0.875rem = 14px  /* Medium-small */
1rem     = 16px  /* Base */
1.25rem  = 20px  /* Medium */
1.5rem   = 24px  /* Medium-large */
1.75rem  = 28px  /* Large */
2rem     = 32px  /* Extra-large */
2.5rem   = 40px  /* Spacious */
```

### Common Patterns
- **Card padding**: `1.75rem` to `2rem`
- **Section padding**: `2rem` to `2.5rem`
- **Input padding**: `0.875rem 1rem`
- **Button padding**: `1rem 2rem`
- **Gap between items**: `0.875rem` to `1rem`

---

## 🔤 Typography

### Font Weights
```css
400  /* Body text, inputs */
500  /* Nav items, labels */
600  /* Buttons, form labels */
700  /* Headings, section titles */
```

### Font Sizes
```css
0.75rem   = 12px  /* Small labels */
0.8125rem = 13px  /* Stat labels */
0.875rem  = 14px  /* Form labels */
0.9375rem = 15px  /* Inputs, body */
1rem      = 16px  /* Base size */
1.125rem  = 18px  /* Section subtitles */
1.25rem   = 20px  /* Section titles */
2rem      = 32px  /* Dashboard title */
2.25rem   = 36px  /* Stat numbers */
```

### Letter Spacing
```css
-0.03em  /* Tight for headings */
-0.02em  /* Section titles */
0        /* Most text */
0.05em   /* Uppercase labels */
```

---

## 🎯 Border Radius

### Scale
```css
10px  /* Small elements (buttons, inputs) */
12px  /* Inputs, avatars, cards */
14px  /* Medication rows */
16px  /* Medium sections */
20px  /* Large sections, main cards */
```

### Usage
- **Sidebar**: No radius (full height)
- **Nav items**: `10px`
- **Inputs**: `12px`
- **Cards**: `20px`
- **Buttons**: `10-12px`

---

## 🌈 Shadows

### Light Mode
```css
/* Subtle - Cards at rest */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 
            0 8px 24px rgba(0, 0, 0, 0.04);

/* Medium - Hover state */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), 
            0 16px 40px rgba(0, 0, 0, 0.06);

/* Strong - Elevated elements */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 
            0 16px 48px rgba(0, 0, 0, 0.08);
```

### Dark Mode
```css
/* Subtle */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 
            0 8px 24px rgba(0, 0, 0, 0.2);

/* Medium */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 
            0 16px 40px rgba(0, 0, 0, 0.3);
```

### Colored Shadows
```css
/* Primary (Blue) */
0 2px 12px rgba(59, 130, 246, 0.2)

/* Success (Green) */
0 2px 8px rgba(16, 185, 129, 0.2)

/* Error (Red) */
0 2px 8px rgba(239, 68, 68, 0.2)
```

---

## 🎭 Transitions

### Duration
```css
0.2s  /* Fast (inputs, small changes) */
0.3s  /* Standard (most interactions) */
```

### Easing
```css
cubic-bezier(0.4, 0, 0.2, 1)  /* Professional, Apple-like */
```

### Common Patterns
```css
/* All-purpose smooth transition */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Specific properties (better performance) */
transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 🔄 Hover Transforms

### Cards
```css
transform: translateY(-2px);      /* Small cards */
transform: translateY(-4px);      /* Large cards/stats */
```

### Buttons
```css
transform: translateY(-2px);      /* Standard */
transform: translateY(-2px) scale(1.05);  /* Prominent */
```

### Icons
```css
transform: scale(1.1) translateY(-2px);  /* Icon lift */
transform: rotate(20deg);                 /* Icon rotate */
```

---

## 🎨 Backdrop Effects

```css
/* Sidebar & Cards */
backdrop-filter: blur(24px);
-webkit-backdrop-filter: blur(24px);

/* Background opacity */
rgba(255, 255, 255, 0.98)  /* Light mode */
rgba(30, 41, 59, 0.98)     /* Dark mode */
```

---

## 📦 Component Patterns

### Card Component
```css
.card {
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 
                0 8px 24px rgba(0, 0, 0, 0.04);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), 
                0 16px 40px rgba(0, 0, 0, 0.06);
    border-color: rgba(59, 130, 246, 0.15);
}
```

### Input Field
```css
.input {
    padding: 0.875rem 1rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    font-size: 0.9375rem;
    font-weight: 400;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.input:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
}
```

### Primary Button
```css
.btn-primary {
    background: linear-gradient(135deg, #10B981, #059669);
    padding: 1rem 2rem;
    border-radius: 12px;
    font-weight: 600;
    color: white;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
    background: linear-gradient(135deg, #059669, #047857);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}
```

---

## 🌓 Dark Mode Adjustments

### Key Differences
```css
/* Background */
Light: #FAFBFC gradient
Dark:  #0A0E1A gradient

/* Borders */
Light: rgba(0, 0, 0, 0.06-0.1)
Dark:  rgba(255, 255, 255, 0.08-0.1)

/* Shadows */
Light: rgba(0, 0, 0, 0.04-0.08)
Dark:  rgba(0, 0, 0, 0.2-0.3)

/* Text */
Light: #1F2937 → #6B7280
Dark:  #F8FAFC → #CBD5E1
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px) { ... }

/* Tablet */
@media (max-width: 1024px) { ... }
```

---

## ✅ Best Practices

1. **Always use rgba()** for borders and overlays
2. **Dual-layer shadows** for depth
3. **cubic-bezier** for all transitions
4. **Consistent border-radius** across similar elements
5. **Font-weight 400** for inputs, 600 for buttons
6. **3px focus rings** for accessibility
7. **translateY(-2px to -4px)** for hover lift
8. **backdrop-blur(24px)** for glass effect

---

## 🎯 Quick Copy-Paste

### Professional Card
```css
background: rgba(255, 255, 255, 0.98);
backdrop-filter: blur(24px);
border: 1px solid rgba(0, 0, 0, 0.06);
border-radius: 20px;
padding: 2rem;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.04);
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Professional Button
```css
background: linear-gradient(135deg, #10B981, #059669);
border: none;
border-radius: 12px;
padding: 1rem 2rem;
font-weight: 600;
color: white;
box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Professional Input
```css
padding: 0.875rem 1rem;
border: 1px solid rgba(0, 0, 0, 0.1);
border-radius: 12px;
font-size: 0.9375rem;
font-weight: 400;
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```

---

**Use this guide to maintain consistency across all future UI development!**
