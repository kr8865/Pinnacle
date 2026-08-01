# Pinnacle — Visual Design System

Reference aesthetic: premium AI-SaaS product UI (soft warm-gradient hero, clean white cards, minimal sidebar — think Seto/Halo Lab dribbble style, Linear, Notion AI). NOT a generic bootstrap/college-project look.

## Palette
- Brand primary: Indigo/Violet `#4F46E5` → `#7C3AED` gradient (buttons, active states, links)
- Accent (warmth): Coral/Peach radial glow `#FFB37C` → `#FF7E7E` → transparent, used as soft background blobs behind hero/dashboard headers
- Neutral light mode: background `#F7F7FB`, card `#FFFFFF`, border `#ECECF3`, text `#1A1A2E` / muted `#6B7280`
- Neutral dark mode: background `#0F1117`, card `#171923`, border `#252836`, text `#F3F4F6` / muted `#9CA3AF`
- Semantic: success `#10B981`, warning `#F59E0B`, danger `#EF4444`, info `#3B82F6`

## Shape & Elevation
- Border radius: cards `rounded-3xl` (24px), buttons/pills `rounded-full`, inputs `rounded-2xl`
- Shadows: soft, diffused — `shadow-[0_8px_30px_rgba(0,0,0,0.06)]` light mode, subtle glow border in dark mode instead of shadow
- Glassmorphism on navbars/modals: `backdrop-blur-xl bg-white/70 dark:bg-[#171923]/70`

## Layout patterns
- Sidebar: white/dark card floating with margin (not edge-to-edge), icon + label nav items, active item = filled pill with brand gradient + icon color white
- Dashboard header: greeting pattern "Welcome back, {firstName} 👋" with subtitle, radial gradient blob decoration behind heading (low opacity, blurred)
- Stat cards: icon in soft-tinted rounded-square badge, big number, small label, mini trend chip (+12% this month)
- Feature/quick-action cards: icon badge top, bold title, 1-line description, arranged in a 3-col grid
- Tables: rounded container, zebra-free, hover row highlight, avatar+name combo cells, pill status badges (Present=green pill, Absent=red pill, Pending=amber pill)
- Chat/notification panels: floating rounded-3xl panel, avatar stacks (overlapping circular avatars) for group/participant indicators
- Buttons: primary = gradient fill pill; secondary = outline pill; icon buttons = circular ghost

## Motion (Framer Motion)
- Page transitions: fade + slight upward slide (200ms)
- Cards: stagger-in on dashboard load
- Sidebar active pill: layoutId shared transition (smooth sliding highlight)
- Buttons: scale 0.97 on tap, subtle lift on hover

## Typography
- Font: Inter (or Plus Jakarta Sans) via Google Fonts / self-hosted
- Headings bold/tight tracking, body relaxed leading, generous whitespace

## Dark/Light
- Toggle in navbar + persisted via ThemeContext (localStorage on client is fine — this is a real browser app, not a Claude artifact)
- All components must have dark: variants

This file is the single source of truth for frontend agents — Tailwind config (`frontend/tailwind.config.js`) must encode these tokens as custom colors/radii so components stay consistent.
