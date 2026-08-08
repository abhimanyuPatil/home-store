# React UI Style Guide

## Overview

This project uses:

- **Framework:** React
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Font:** Exo 2
- **Theme:** Clean, modern, professional, engineering-focused dashboard

---

# Design Principles

- Minimal UI
- Plenty of whitespace
- Consistent spacing
- Rounded corners (never sharp)
- Soft shadows only
- Flat colors
- Avoid gradients unless used for hero sections
- High contrast typography
- Accessible color contrast

---

# Color Palette

| Purpose | Hex |
|----------|------|
| Background | #F0F0F0 |
| Surface | #FFFFFF |
| Primary | #213555 |
| Secondary | #4F709C |
| Accent | #E5D283 |
| Text Primary | #213555 |
| Text Secondary | #4F709C |
| Border | #D9D9D9 |
| Success | #22C55E |
| Warning | #F59E0B |
| Error | #EF4444 |

---

# Tailwind Theme

## Primary

213555

Used for

- Navigation
- Buttons
- Headers
- Active states

## Secondary

4F709C

Used for

- Links
- Secondary buttons
- Icons
- Badges

## Accent

E5D283

Used sparingly

- Highlights
- Notifications
- Selected cards
- Charts

## Background

F0F0F0

Main application background.

---

# Typography

## Font

Exo 2

Weights

300

Regular

500

Medium

600

Semibold

700

Bold

Avoid using weights below 300.

---

# Font Sizes

| Usage | Size |
|--------|------|
| Hero | text-5xl |
| H1 | text-4xl |
| H2 | text-3xl |
| H3 | text-2xl |
| H4 | text-xl |
| Body | text-base |
| Small | text-sm |
| Caption | text-xs |

---

# Border Radius

Buttons

rounded-lg

Cards

rounded-xl

Dialogs

rounded-2xl

Inputs

rounded-lg

---

# Shadows

Cards

shadow-sm

Dropdowns

shadow-md

Dialogs

shadow-xl

Never use heavy shadows.

---

# Spacing Scale

Use Tailwind defaults.

Common spacing

4

6

8

12

16

24

32

48

Avoid arbitrary spacing.

---

# Buttons

## Primary

Background

Primary

Text

White

Hover

Secondary

Disabled

Gray

---

## Secondary

Border Primary

Text Primary

Background White

Hover Background Background

---

## Ghost

Transparent

Hover Background

---

## Danger

Red

White Text

---

# Forms

Inputs

- White background
- Rounded
- Border
- Focus ring Primary

Validation

Error

Red

Success

Green

---

# Cards

Background

White

Padding

24px

Rounded XL

Shadow Small

Border Light Gray

---

# Navigation

Sidebar

Primary background

White icons

Active item

Accent background

Primary text

---

# Tables

Header

Primary

Rows

White

Hover

Background

Borders

Light gray

---

# Status Colors

Success

Green

Warning

Amber

Error

Red

Info

Secondary

---

# Charts

Primary

Secondary

Accent

Gray

Never exceed 5 colors in charts.

---

# Animations

Duration

150ms–250ms

Use

transition-all

ease-in-out

Avoid excessive animations.

---

# Icons

Library

Lucide React

Sizes

16

18

20

24

Stroke

2

---

# Layout

Maximum content width

1600px

Sidebar

280px

Top Navbar

64px

Content Padding

24px

Grid Gap

24px

---

# Accessibility

Minimum contrast AA

Focus rings enabled

Keyboard navigation

ARIA labels for interactive controls

Never rely solely on color.

---

# Component Standards

Buttons

- Consistent heights
- 40px default
- 48px large

Inputs

40px height

Cards

24px padding

Dialogs

32px padding

Tables

16px cell padding

---

# Do

✓ Use whitespace generously

✓ Keep layouts simple

✓ Use Primary sparingly

✓ Use Accent only to draw attention

✓ Keep interactions consistent

---

# Don't

✗ Multiple accent colors

✗ Large gradients

✗ Heavy shadows

✗ Sharp corners

✗ Inconsistent spacing

✗ Tiny clickable areas

---

# Overall Feel

Professional

Modern

Clean

Engineering-focused

Enterprise dashboard aesthetic similar to:

- Linear
- Vercel
- GitHub
- Stripe Dashboard