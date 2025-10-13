# Circle PWA - Design Guidelines

## Design Approach
**Reference-Based Strategy**: Drawing inspiration from modern social platforms (Discord, Instagram, Linear) with emphasis on community engagement and real-time interaction.

## Core Design Elements

### A. Color Palette

**Primary Colors (Dark Mode - Default)**
- Background Base: 222 15% 8%
- Surface: 222 13% 11%
- Surface Elevated: 222 13% 14%
- Border: 222 10% 20%

**Primary Colors (Light Mode)**
- Background Base: 0 0% 98%
- Surface: 0 0% 100%
- Border: 220 13% 91%

**Brand & Accent**
- Primary (Circle Blue): 217 91% 60%
- Primary Hover: 217 91% 55%
- Text Primary (Dark): 220 9% 98%
- Text Secondary (Dark): 220 9% 70%
- Success (Online Status): 142 76% 36%
- Danger/Alert: 0 84% 60%

### B. Typography
**Font Stack**: Inter (Google Fonts) as primary, SF Pro fallback
- Headings: 600-700 weight, tracking tight
- Body: 400-500 weight
- UI Elements: 500-600 weight
- Sizes: text-xs to text-4xl, responsive scaling

### C. Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Consistent component padding: p-4 on mobile, p-6 on desktop
- Section spacing: space-y-6 for tight groups, space-y-12 for sections
- Grid gaps: gap-4 for cards, gap-6 for major layouts

### D. Component Library

**Navigation**
- Top navbar: Fixed, glass-morphism effect (backdrop-blur-xl), height h-16
- Bottom nav (mobile): Fixed, 4-5 icons, h-16 with safe-area-inset
- Sidebar (desktop): w-72, collapsible to w-20, smooth transitions

**Circles & Feed**
- Circle cards: Rounded-2xl, hover lift effect, gradient borders for active
- Post cards: Minimal borders, avatar-left layout, timestamp subtle
- Message bubbles: Rounded-2xl, sender/receiver color distinction

**Forms & Inputs**
- Input fields: h-12, rounded-xl, subtle focus ring (ring-2 ring-primary/50)
- Buttons: h-12, rounded-xl, font-medium
- Primary CTAs: Gradient or solid primary color with shadow-lg
- Ghost buttons on images: Backdrop-blur-md with border

**Real-time Elements**
- Online indicators: Absolute positioned, ring-2 ring-background, h-3 w-3
- Typing indicators: Animated dots, subtle gray
- Unread badges: Absolute positioned, rounded-full, bg-primary

**AI Assistant**
- Floating action button: Fixed bottom-right, rounded-full, w-14 h-14
- Chat interface: Slide-in panel, max-w-md, gradient header
- AI responses: Distinct background (surface-elevated), icon indicator

**Support/Help Pages**
- FAQ accordion: Rounded-xl cards, chevron indicators
- Search bar: Prominent, w-full max-w-2xl, h-14

### E. Visual Enhancements

**Glass Morphism**: Use for overlays, modals, and navigation (backdrop-blur-xl + bg-opacity)

**Shadows & Depth**
- Cards: shadow-sm default, shadow-xl on hover
- Modals: shadow-2xl
- FAB buttons: shadow-lg with shadow-primary/20

**Micro-interactions**
- Button press: Scale-95 transform
- Card hover: -translate-y-1 + shadow increase
- Tab switches: Slide underline indicator
- Message send: Subtle scale + fade animation

**Animations**: Minimal, purposeful only
- Page transitions: Fade + slide (duration-200)
- Loading states: Skeleton screens, not spinners
- Success feedback: Checkmark scale-in (duration-300)

## Page-Specific Layouts

**Onboarding/Auth**
- Full-screen centered cards, max-w-md
- Large logo, ample whitespace
- Progress indicators for multi-step flows

**Home Feed**
- Two-column on desktop: Feed (flex-1) + Suggested Circles (w-80)
- Mobile: Single column, pull-to-refresh
- Infinite scroll with intersection observer

**Circle Detail**
- Cover image: h-48 on mobile, h-64 on desktop, gradient overlay
- Floating header on scroll with blur background
- Tabs for Posts/Members/About

**Chat/Messaging**
- Full-height layout (h-screen - navbar)
- Three-panel desktop: Circles list (w-80) + Chat (flex-1) + Details (w-80)
- Mobile: Single panel with slide navigation

**Profile**
- Avatar: w-24 h-24 mobile, w-32 h-32 desktop, ring-4 ring-background
- Stats row: Grid-cols-3, text-center
- Activity feed below

## Images & Media

**Hero/Marketing Sections**: Not applicable for main app (utility-focused)

**Content Images**
- Circle covers: Aspect-video, object-cover, rounded-t-2xl
- User avatars: Circular, lazy-loaded, fallback initials
- Chat media: Max-w-sm, rounded-xl, lightbox on click
- AI assistant icon: Gradient background, 3D-style illustration

**Image Placement**
- Circle cards: Background with gradient overlay
- Profile headers: Banner (h-32) + overlapping avatar
- Empty states: Centered illustrations (max-w-xs)

## Responsive Behavior
- Mobile-first: Design for 375px minimum
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Bottom nav shows on <lg, sidebar on ≥lg
- Single column cards on mobile, 2-3 columns on desktop

## Dark Mode Implementation
- Default to dark mode, toggle in settings
- Consistent across ALL inputs, modals, dropdowns
- Use semantic color tokens for seamless switching
- Invert shadows: Use colored shadows in dark mode (shadow-primary/10)