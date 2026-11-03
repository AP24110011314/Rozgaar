# Rozgaar ATS - Mobile Layout & Responsive Architecture Report

This document records the architectural specifications, mobile design patterns, responsive breakpoint rules, and automated test verification for Rozgaar's mobile experience from **320px up to desktop viewports**.

---

## 1. Responsive Foundations & Design System Alignment

| Dimension | Implementation | Rationale |
| :--- | :--- | :--- |
| **Viewport Meta** | `width=device-width, initial-scale=1, viewport-fit=cover` | Ensures full bleed rendering on modern notch and dynamic island displays without disabling user accessibility zoom. |
| **Height Measure** | `min-h-dvh` | Prevents jumping layout when dynamic mobile browser navigation bars (Safari / Chrome) collapse or expand during scroll. |
| **Safe Area Insets** | `env(safe-area-inset-*)` | Applied to sticky header (`pt-[env(safe-area-inset-top)]`), bottom navigation bar (`pb-[env(safe-area-inset-bottom)]`), and mobile modal sheets. |
| **Typography & Zoom Guard** | `font-size: 16px !important` on all `<input>`, `<select>`, `<textarea>` | Prevents iOS Safari from auto-zooming into form fields on focus, eliminating annoying horizontal viewport drift. |
| **Touch Targets** | `min-height: 44px; min-width: 44px` | Strict adherence to WCAG 2.1 AAA touch target guidelines across all buttons, selects, links, and drawer triggers. |
| **Horizontal Scroll Prevention** | `overflow-wrap: anywhere; word-break: normal; overflow-x: hidden` | Eliminates unwanted sideways page scrolling regardless of device width. Long Indian city names, company titles, and URLs wrap gracefully. |

---

## 2. Navigation Architecture

### A. Sticky Official Header (`client/src/components/ui/Navbar.jsx`)
- **Desktop (`>= 768px`)**: Displays official Rozgaar brand seal, main horizontal navigation bar (`Find Jobs`, `My Applications`, `Pipelines`, `Admin`), notification bell, and user account dropdown.
- **Mobile (`< 768px`)**:
  - Displays compact brand title and notification bell.
  - Hamburger button with explicit `aria-expanded` and `aria-label="Toggle navigation menu"`.
  - **Slide-in Navigation Drawer**:
    - Slides from right with high-contrast `--color-sand` background and 2px `--color-brand` border.
    - Focus trapped inside drawer when open; cycles focus among active elements.
    - Closes on **Escape** key, close `X` button, backdrop click, or navigation item selection.

### B. Fixed Bottom App Bar (`client/src/components/layout/BottomBar.jsx`)
- Fixed at the bottom of the screen on devices `< 640px` (`sm:hidden`).
- Respects `safe-area-inset-bottom` for home indicator on iPhones.
- Provides 4-column primary navigation:
  1. **Find Jobs**: Quick search entry point.
  2. **Role Dashboard**: Smart dynamic routing to *Candidate Applications* (Seeker), *Job Listings & Pipelines* (Recruiter), or *Admin Portal* (Admin).
  3. **Saved / Secondary**: *Saved Jobs* (Seeker) or *Post Job* (Recruiter).
  4. **Profile / Account**: Deep link to Candidate Profile, Company Details, or Login.
- Active item highlighted in `--color-accent` with dark high-contrast text (`#2E1D10`).
- Touch target hit area: 44px height minimum.

---

## 3. Key View Mobile Optimizations

### 1. Job Search & Discovery (`client/src/pages/public/JobsListPage.jsx`)
- **Full-Width Search Bar**: Keyword and City/GPS inputs stack vertically on mobile with 16px inputs and 44px action buttons.
- **Mobile Bottom Sheet Filter Drawer**:
  - Replaces wide desktop filter strip with a dedicated "Filters" button displaying active filters badge count.
  - Opens accessible bottom sheet drawer (`.mobile-bottom-sheet`) with slide-over animation.
  - Allows seekers to toggle employment type, remote positions, GPS radius (5km to 100km), and sort order.
  - Includes "Reset" and "Apply Filters" buttons.
- **Responsive Job Cards**: Badges and location/salary chips wrap onto multi-line badges with zero horizontal clipping.

### 2. Job Detail & Quick Apply (`client/src/pages/public/JobDetailPage.jsx`)
- **Sticky Apply CTA Bar**: Pinned above the bottom app bar (`fixed bottom-16 sm:hidden`) on mobile displays so seekers can apply immediately without scrolling past lengthy requirements.
- **Company Profile Card**: Stacks cleanly underneath the main job description card.
- **Body Safe Margin**: Main container incorporates `pb-32 sm:pb-8` preventing any overlay obstruction.

### 3. Recruiter Kanban ATS (`client/src/pages/recruiter/RecruiterKanbanPage.jsx`)
- **Multi-Column vs Single-Column Transition**:
  - **Desktop (`>= 768px`)**: Full 6-column drag-and-drop board using `@hello-pangea/dnd` across Applied, Reviewing, Interviewing, Offered, Hired, and Rejected.
  - **Mobile (`< 768px`)**: Switches to a single-column tabbed view with horizontal snap-scrolling stage tabs.
- **Mobile Single-Stage Cards**: Shows only the selected column's candidates. Drag-and-drop is cleanly omitted on mobile to preserve natural touch scrolling.
- **Accessible "Move to..." Select**: Available on every card to advance candidate stages with instant optimistic updates and LexoRank position maintenance.
- **Candidate Drawer**: Full-width slide-over with phone/email details, 1-5 star rating selector, resume downloader, and internal recruiter notes.

### 4. Candidate Dashboard (`client/src/pages/applicant/ApplicantDashboard.jsx`)
- **Stacked Card Layout**: Standard responsive cards with clear visual hierarchy, company name, applied date, anti-ghosting days-ago counter, and 44px "View Timeline" CTA.
- **Stage Filter Tabs**: Smooth horizontal snap-scrolling bar (`snap-x snap-mandatory`).

### 5. Admin Control Center (`client/src/pages/admin/AdminDashboard.jsx`)
- **Horizontal Scroll Tables**: Table wrappers have `overflow-x-auto` with a **sticky first column** (`sticky left-0 bg-surface z-10`) so the user/company/job identity remains fixed while attributes scroll.
- **Admin Tabs**: Smooth horizontal scroll tabs with snap points.
- **Accessible Action Buttons**: Deactivate/Close buttons adhere to 44px touch guidelines.

---

## 4. Breakpoints Matrix

| Breakpoint | Target Devices | Layout Behavior |
| :--- | :--- | :--- |
| `< 640px` (`sm`) | iPhone SE, iPhone 12/13/14, Pixel, Galaxy | Bottom App Bar active; sticky mobile Apply CTA active; single-column stacks; mobile filter bottom sheet. |
| `640px - 767px` | Large phones in landscape, small phablets | Bottom App Bar hides; desktop footer displayed; search inputs 2-column; Kanban single-column tabbed view. |
| `>= 768px` (`md`) | iPad Mini, iPad, Tablets, Laptops | Desktop Navbar links active; multi-column Kanban board active; inline search filter strip. |
| `>= 1024px` (`lg`) | Desktops, Large Monitors | 4-column metric cards; full width container alignment with 1280px max-width boundary. |

---

## 5. Playwright Mobile Automated Verification (`npm run e2e:mobile`)

Automated tests in `client/e2e/mobile.spec.js` run across both standard mobile viewports natively:
1. **iPhone SE**: `375 x 667` (compact form factor)
2. **iPhone 13 / 14**: `390 x 844` (modern notch viewport)

### Test Results
```
Running 12 tests using 1 worker

  ✓ [iPhone SE] 1. Zero horizontal page scroll on public job search and home
  ✓ [iPhone SE] 2. Hamburger menu: opens slide-in panel, traps focus, and closes
  ✓ [iPhone SE] 3. Mobile Bottom App Bar is fixed and accessible (min 44px)
  ✓ [iPhone SE] 4. Job Search: Filter button opens bottom sheet drawer and applies criteria
  ✓ [iPhone SE] 5. Job Detail: Pinned sticky Apply CTA bar on mobile
  ✓ [iPhone SE] 6. Recruiter Kanban: single-column tabbed view and accessible stage move
  ✓ [iPhone 13/14] 1. Zero horizontal page scroll on public job search and home
  ✓ [iPhone 13/14] 2. Hamburger menu: opens slide-in panel, traps focus, and closes
  ✓ [iPhone 13/14] 3. Mobile Bottom App Bar is fixed and accessible (min 44px)
  ✓ [iPhone 13/14] 4. Job Search: Filter button opens bottom sheet drawer and applies criteria
  ✓ [iPhone 13/14] 5. Job Detail: Pinned sticky Apply CTA bar on mobile
  ✓ [iPhone 13/14] 6. Recruiter Kanban: single-column tabbed view and accessible stage move

Result: 12 passed (100% PASS)
```

Combined desktop and mobile suite (`npm run e2e`): **16/16 PASSED**.

