# Theme Architecture

This directory contains the reusable theme and component styling system for the Expenses Tracker application.

## File Structure

### `tokens.css`
**Design tokens** - Reusable values that work in both light and dark modes.

Contains:
- Color tokens (surfaces, borders, text)
- Shadow definitions
- Typography scales
- KPI card gradients
- Status/badge colors

**Usage:** Tokens are CSS custom properties (variables) that are set at the `:root` level for light mode and inside `html.dark` for dark mode.

Example:
```css
color: var(--text-primary);
background-color: var(--surface-card);
```

### `light-theme.css`
**Light mode specific styling** - Page backgrounds, surfaces, cards, inputs, and UI components.

Contains:
- Page background gradients
- Sidebar styling
- Card/panel styling
- Table styling
- Input/form styling
- Button styling
- Badge/chip styling
- Tinted section styling (info, warning, success, error)

**Usage:** Use reusable classes instead of inline Tailwind for common components.

Example (Bad - inline):
```html
<div class="bg-white rounded-xl shadow-md p-6 border border-gray-200 dark:bg-[#1a1d27] dark:border-white/7">
```

Example (Good - using classes):
```html
<div class="card">
```

### `dark-theme.css`
**Dark mode styling scaffold** - Prepared for future dark mode implementation.

Currently holds dark mode class definitions that mirror light-theme.css structure but with dark-specific values. All selectors are wrapped in `html.dark` for future activation.

### `components.css`
**Reusable component classes** - Utility classes that reduce repetitive inline Tailwind.

Contains:
- Layout helpers (flexbox, grid)
- Spacing utilities
- Heading scales
- Sidebar components
- Form components
- Table components
- Buttons and links
- Empty states
- Loading states

**Usage:** Combine with tokens and theme classes for component styling.

## Design Pattern

### Three-Layer Styling Approach

1. **Tokens** (`tokens.css`)
   - Color values, shadows, typography scales
   - Used as CSS variables: `var(--text-primary)`

2. **Theme** (`light-theme.css` / `dark-theme.css`)
   - Component styling (cards, tables, forms)
   - Uses tokens and Tailwind utilities
   - Example: `.card { background-color: var(--surface-card); }`

3. **Components** (`components.css`)
   - Reusable utility classes
   - Combines Tailwind and theme variables
   - Example: `.flex-between { @apply flex items-center justify-between; }`

### Example: Styling a Card

**Before (Inline Tailwind):**
```jsx
<div className="bg-white dark:bg-[#1a1d27] rounded-xl shadow-md p-6 border border-gray-200 dark:border-white/7">
  Content
</div>
```

**After (Using Theme Classes):**
```jsx
<div className="card">
  Content
</div>
```

This achieves the same result but with:
- ✅ Cleaner JSX
- ✅ Consistent styling across components
- ✅ Easy dark mode customization (modify dark-theme.css)
- ✅ Single source of truth for design tokens

## Adding a New Component

1. **Identify repeated patterns**
   - Look for inline Tailwind that appears in multiple places

2. **Check if tokens exist**
   - Review `tokens.css` for applicable color/spacing tokens

3. **Add class to appropriate file**
   - Add to `light-theme.css` if it's a specific component style
   - Add to `components.css` if it's a reusable utility

4. **Use in component**
   - Replace inline Tailwind with the class name

Example - Adding a "premium button" class:

```css
/* components.css */
.button-premium {
  @apply bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-8 rounded-lg;
  @apply hover:shadow-lg transition-all duration-200;
}
```

Usage:
```jsx
<button className="button-premium">Click Me</button>
```

## Dark Mode Implementation

When implementing dark mode in the future:

1. All dark mode selectors are already in `dark-theme.css`
2. Just enable the `html.dark` class on the document
3. All tokens automatically switch to dark values via `html.dark` media query
4. Components automatically use dark-theme styling

Current system is **ready for dark mode** - no refactoring needed when implemented.

## Maintenance

### Adding New Colors

1. Add to `:root` in `tokens.css`:
```css
--color-brand: theme('colors.blue.600');
```

2. Add dark version in `html.dark`:
```css
html.dark {
  --color-brand: #3b82f6;
}
```

3. Use in components:
```css
.button-brand {
  background-color: var(--color-brand);
}
```

### Updating Theme Colors

- Light mode: Edit `light-theme.css`
- Dark mode: Edit `dark-theme.css`
- Tokens: Edit `tokens.css`

Changes automatically propagate to all components using those classes.

## Benefits of This Architecture

| Benefit | Impact |
|---------|--------|
| **Reduced duplication** | No more copy-pasting long class strings |
| **Consistent styling** | Single source of truth for component styles |
| **Easy theme switching** | Dark mode can be enabled globally |
| **Better maintainability** | Changes in one file affect all components |
| **Scalability** | New themes can be added without touching components |
| **Developer experience** | Cleaner JSX, easier to read |

## Related Files

- `globals.css` - Imports all theme files
- `tailwind.config.ts` - Tailwind configuration
- Component files - Import and use theme classes
