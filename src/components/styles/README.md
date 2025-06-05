# Cloudy Theme System

This directory contains the styling system for the Cloudy cloud storage application. The system is designed to provide consistent styling across the application while making it easy to maintain and update.

## Theme.css

The `Theme.css` file is the core of our styling system. It contains:

1. **CSS Variables**: Defines colors, shadows, borders, transitions, and other design tokens
2. **Base Styles**: Basic styling for HTML elements
3. **Component Styles**: Pre-defined styles for common components
4. **Utility Classes**: Helper classes for common styling needs

## Usage

### Importing the Theme

The theme is automatically imported in `src/index.tsx`, so you don't need to import it in your components.

### Using Component Classes

Instead of writing inline styles or creating new CSS classes, use the pre-defined classes from Theme.css:

```jsx
// Instead of this:
<button class="bg-primary hover:bg-primary-hover text-white rounded-md px-4 py-2">
  Click Me
</button>

// Use this:
<button class="btn btn-primary">
  Click Me
</button>
```

### Available Component Classes

#### Buttons
- `.btn`: Base button class
- `.btn-primary`: Primary action button
- `.btn-secondary`: Secondary action button
- `.btn-danger`: Destructive action button
- `.btn-success`: Success action button
- `.btn-ghost`: Ghost/transparent button

#### Dialog/Modal
- `.dialog-overlay`: Overlay background for dialogs
- `.dialog-content`: Content container for dialogs

#### File Items
- `.file-item`: Container for file list items
- `.file-item.selected`: Selected state for file items
- `.file-icon`: Icon container in file items

#### Storage Bar
- `.storage-bar`: Container for storage usage bar
- `.storage-bar-fill`: Fill element for storage usage bar

#### Notifications
- `.notification`: Base notification class
- `.notification-success`: Success notification
- `.notification-error`: Error notification
- `.notification-warning`: Warning notification
- `.notification-info`: Info notification

#### Upload Zone
- `.upload-dropzone`: Container for file upload dropzone
- `.upload-dropzone.dragging`: Active state when dragging files

### CSS Variables

You can use the CSS variables in your custom styles:

```css
.my-custom-element {
  background-color: var(--color-background-darker);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}
```

### Theme Guide Component

For reference, you can use the `ThemeGuide` component to see all available styles:

```jsx
import ThemeGuide from '../components/common/ThemeGuide';

// In your component:
<ThemeGuide />
```

## Best Practices

1. **Use Theme Classes**: Always check if there's an existing class in Theme.css before creating custom styles
2. **Consistent Variables**: Use CSS variables for colors, spacing, etc. instead of hardcoding values
3. **Extend, Don't Override**: If you need to customize a component, extend the base classes rather than creating entirely new styles
4. **Mobile-First**: The theme is designed with a mobile-first approach. Use responsive utility classes when needed

## Updating the Theme

When updating the theme:

1. Update variables in Theme.css for global changes
2. Add new component classes for new UI patterns
3. Document new classes in this README
4. Update the ThemeGuide component to showcase new styles 