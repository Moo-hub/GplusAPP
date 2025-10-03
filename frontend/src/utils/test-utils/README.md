# Accessibility Testing Utilities

This directory contains utility functions to simplify accessibility testing in the G+ App.

## Available Utilities

### `checkAccessibility(ui, options)`

Tests a React component for accessibility violations using jest-axe.

**Parameters:**
- `ui`: React element to test
- `options`: (Optional) Options to pass to axe-core

**Example:**
```jsx
import { checkAccessibility } from '../utils/test-utils/accessibility';

it('should pass accessibility tests', async () => {
  await checkAccessibility(<MyComponent />);
});
```

### `checkAccessibilityRoles(ui, expectedRoles)`

Tests that a component has the expected ARIA roles and also runs a full accessibility check.

**Parameters:**
- `ui`: React element to test
- `expectedRoles`: Array of ARIA role strings that should exist in the component

**Example:**
```jsx
import { checkAccessibilityRoles } from '../utils/test-utils/accessibility';

it('should have proper roles and pass accessibility tests', async () => {
  await checkAccessibilityRoles(<Button>Click me</Button>, ['button']);
});
```

## Testing Best Practices

### Forms
- Every form control should have an associated label
- Required fields should be marked with both the `required` attribute and a visual indicator
- Form validation errors should be associated with inputs using `aria-describedby`
- Forms should be navigable and submittable using keyboard only

### Navigation
- Navigation should be wrapped in a `<nav>` element with an appropriate `aria-label`
- Skip links should be provided for keyboard users
- Tab order should follow a logical flow

### Images and Media
- All images should have appropriate `alt` text
- Decorative images should have empty `alt` attributes
- Videos should have captions and transcripts

### Buttons and Links
- Buttons and links should have accessible names
- Use appropriate elements (`<button>` for actions, `<a>` for navigation)
- Custom controls should have appropriate ARIA roles and states

### Color and Contrast
- Text should have sufficient contrast with its background
- Don't rely solely on color to convey meaning
- Ensure focus states are visible

## Additional Resources

- [WAI-ARIA Practices](https://www.w3.org/TR/wai-aria-practices-1.2/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Axe Rules Documentation](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)