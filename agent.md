# UI Design Philosophy & Patterns

## Core Philosophy: "Technical Minimalist"
The interface is designed as a high-density, low-friction tool for developers. It prioritizes information density, clear hierarchy, and an industrial, raw aesthetic.

### 1. Geometry & Structure
- **Hard Edges**: `border-radius: 0px` strictly. No rounded corners.
- **Flat Depth**: `box-shadow: none`. Depth is communicated via surface color contrast, not shadows.
- **Micro-Padding**: Minimal internal padding (`p-4` or `16px`) to keep the interface compact.
- **Consistent Gaps**: A universal `gap-4` (`16px`) between containers for a disciplined vertical and horizontal rhythm.

### 2. Color Palette (Neutral Dark)
- **Base Surface**: Pure Black (`#000000`).
- **Secondary Surface**: Dark Gray (`#0a0a0a`).
- **Elevated Surface**: Raised Gray (`#121212`).
- **Borders**: Sharp, low-contrast grays (`#262626` or `#333333`).
- **Primary Text**: Pure White (`#ffffff`).
- **Muted Text**: Mid-Gray (`#a3a3a3`).
- **Faint/Label Text**: Dark Gray (`#525252`).

### 3. Typography
- **Monospace Everywhere**: JetBrains Mono is the exclusive font for all elements, including body text, headings, and labels.
- **High Information Density**: 
    - Secondary labels: `text-[9px]` or `text-xs`.
    - Main body/input text: `text-sm`.
    - Page titles: `text-lg` or `text-xl`, never overly large.
- **Tracking**: Use `tracking-[0.2em]` for uppercase technical labels.

### 4. Component Patterns
- **Panels**: Use the `.panel` utility class (background `#121212`, 1px border `#262626`).
- **Buttons**:
    - **Primary**: Light gray background with black text. High contrast for main actions.
    - **Secondary**: Outline style (border + text) with a subtle hover background.
    - **Sizing**: Compact vertical padding (`py-1.5` or `py-2`).
- **Inputs**: Transparent or `#0a0a0a` backgrounds, 1px border, `text-sm`, and placeholder text in `#525252`.
- **Labels**: Small uppercase labels placed directly above values/inputs with minimal margin (`mb-0.5` or `mb-1`).

### 5. Mobile Considerations
- **Full Width**: Most interactive elements (buttons, inputs) should expand to fill the container on small screens.
- **Page Shell**: A universal `.page-shell` utility ensures consistent outer padding (`p-4` or `p-6`) and centered layouts.
