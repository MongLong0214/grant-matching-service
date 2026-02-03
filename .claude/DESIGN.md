# Design System: Grant Match (정부지원금 매칭 서비스)

## 1. Visual Theme & Atmosphere

- **Tone**: Warm, friendly, trustworthy - designed for small business owners
- **Style**: Modern with generous whitespace, rounded corners, soft shadows
- **Inspiration**: trypencil.com - fluid typography, card-based layouts, subtle animations
- **Language**: Korean (Noto Sans KR primary)

## 2. Color Palette & Roles

### Light Mode
| Role | Color | Value |
|------|-------|-------|
| Primary | Emerald Green | `#10B981` |
| Primary Dark | Deep Emerald | `#059669` |
| Primary Light | Mint Sage | `#D1FAE5` |
| Background | Warm Cream | `#FAFAF5` |
| Card | White | `#FFFFFF` |
| Text Main | Dark Charcoal | `#1F2937` |
| Text Sub | Gray | `#4B5563` |
| Text Muted | Light Gray | `#9CA3AF` |
| Border | Light Gray | `#E5E7EB` |
| Destructive | Soft Red | `#EF4444` |

### Dark Mode
| Role | Color | Value |
|------|-------|-------|
| Primary | Light Emerald | `#34D399` |
| Background | Dark Green | `#10221C` |
| Card | Dark Card | `#1A2C26` |
| Text Main | White | `#F9FAFB` |
| Text Sub | Gray 300 | `#D1D5DB` |
| Border | Gray 800 | `#1F2937` |

### Category Badge Colors
| Category | Background | Text |
|----------|-----------|------|
| 금융 | `emerald-50` | `emerald-700` |
| 기술 | `blue-50` | `blue-700` |
| 인력 | `purple-50` | `purple-700` |
| 수출 | `emerald-50` | `emerald-700` |
| 내수 | `amber-50` | `amber-700` |
| 창업 | `orange-50` | `orange-700` |
| 경영 | `slate-50` | `slate-700` |
| 기타 | `gray-50` | `gray-700` |

### Gradients
- **Hero**: `linear-gradient(135deg, #FAFAF5 0%, #ECFDF5 100%)`
- **CTA Button**: `linear-gradient(to right, #10B981, #059669)`
- **CTA Banner**: `linear-gradient(100deg, #10B981 0%, #34D399 100%)`

## 3. Typography Rules

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Display/H1 | Noto Sans KR | 48-60px | 900 (Black) | 1.15 |
| H2 | Noto Sans KR | 30px | 700 (Bold) | 1.2 |
| H3 / Card Title | Noto Sans KR | 20px | 700 (Bold) | 1.3 |
| Body | Noto Sans KR | 16px | 400 (Regular) | 1.7 |
| Body Large | Noto Sans KR | 18-20px | 500 (Medium) | 1.6 |
| Small / Caption | Noto Sans KR | 14px | 500 (Medium) | 1.5 |
| Label | Noto Sans KR | 14px | 700 (Bold) | 1.5 |
| Badge | Noto Sans KR | 12-13px | 700 (Bold) | 1.2 |

### Font Stacks
- **Primary**: `'Noto Sans KR', system-ui, -apple-system, sans-serif`
- **Display Numbers**: `'Public Sans', 'Noto Sans KR', sans-serif` (for stats)

## 4. Component Stylings

### Buttons
| Variant | Background | Text | Border Radius | Height | Shadow |
|---------|-----------|------|---------------|--------|--------|
| Primary | Green gradient | White | 12px | 56px (CTA), 40px (default) | `0 4px 20px -2px rgba(16,185,129,0.3)` |
| Secondary | `primary/10` | Primary | 12px | 40px | none |
| Ghost | transparent | Gray | 12px | 40px | none |
| Outline | White | Gray | 12px | 40px | `0 1px 2px rgba(0,0,0,0.05)` |

### Cards
- Background: White
- Border: `1px solid #E5E7EB` (transparent by default, primary/20 on hover)
- Border Radius: `16px`
- Shadow: `0 2px 10px rgba(0,0,0,0.03)` (default), `0 4px 24px rgba(0,0,0,0.06)` (hover)
- Padding: `24-32px`
- Transition: `all 300ms ease`

### Form Inputs
- Background: Warm Cream (`#FAFAF5`)
- Border: `1px solid #E5E7EB`
- Border Radius: `12px`
- Height: `48px`
- Focus: Green ring (`ring-primary`)
- Font Size: `16px`

### Pill Buttons (Radio)
- Unselected: White bg, gray border, gray text
- Selected: `primary/10` bg, primary border, primary text
- Border Radius: `12px`
- Padding: `12px`
- Transition: `all 200ms`

### Badges
- Border Radius: `8px` (category), `full` (status)
- Padding: `6px 12px`
- Font: `12-13px bold`
- Urgent (D-7 or less): Red background
- Active/Always: Green background

## 5. Layout Principles

### Spacing (8px Grid)
| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline gaps |
| sm | 8px | Tight spacing |
| md | 16px | Component internal |
| lg | 24px | Between components |
| xl | 32px | Section padding |
| 2xl | 40px | Card padding |
| 3xl | 64px | Between sections |
| 4xl | 80px | Major section gaps |

### Container
- Max Width: `1200px` (content), `960px` (form/result)
- Padding: `16px` (mobile), `32px` (tablet), `160px` (desktop sides)

### Grid
- 2 columns for result cards (1 on mobile)
- 3 columns for feature cards (1 on mobile)
- Gap: `24px` (cards), `32px` (sections)

### Responsive Breakpoints
| Breakpoint | Width | Usage |
|-----------|-------|-------|
| sm | 640px | Small adjustments |
| md | 768px | 2-column layouts |
| lg | 1024px | Full desktop layout |
| xl | 1280px | Max width content |

## 6. Motion & Interaction

| Effect | Duration | Easing | Usage |
|--------|----------|--------|-------|
| Hover lift | 200ms | ease-out | Cards, buttons |
| Color change | 200ms | ease | Links, buttons |
| Scale | 300ms | ease | Icon hover |
| Shadow expand | 300ms | ease | Card hover |
| Translate Y | 200ms | ease | Button hover (-2px) |

### Decorative Elements
- Blurred gradient circles in hero (green tones, blur-3xl)
- Progress bars with green fill
- Animated pulse dot for status indicators
- Arrow animations on hover (translate-x)
