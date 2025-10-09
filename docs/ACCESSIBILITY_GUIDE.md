# Accessibility Guide for G+ App

## Overview

G+ App is committed to ensuring our application is accessible to all users, including those with disabilities. This guide outlines our accessibility standards, testing procedures, and resources for maintaining and improving accessibility.

## Standards

We follow the Web Content Accessibility Guidelines (WCAG) 2.1 at the AA level. These guidelines cover a wide range of recommendations for making web content more accessible.

## Accessibility Principles

### 1. Perceivable

Information and user interface components must be presentable to users in ways they can perceive.

- All non-text content (images, icons) has alternative text
- Content adapts to different viewport sizes and zoom levels
- Text has sufficient contrast with its background
- Audio content has captions or transcripts

### 2. Operable

User interface components and navigation must be operable.

- All functionality is available from a keyboard
- Skip links are provided to bypass navigation
- No content flashes more than three times per second
- Page titles clearly describe the topic or purpose
- Headings and labels describe topic or purpose

### 3. Understandable

Information and the operation of the user interface must be understandable.

- Text is readable and understandable
- Content appears and operates in predictable ways
- Input assistance helps users avoid and correct mistakes
- Form validation provides clear error messages

### 4. Robust

Content must be robust enough to be interpreted by a wide variety of user agents, including assistive technologies.

- HTML is valid and well-formed
- ARIA is used appropriately
- Custom controls have proper roles and states

## Testing Tools and Procedures

### Automated Testing

We use jest-axe for automated accessibility testing. These tests are integrated into our CI/CD pipeline and run with:

```bash
npm test -- --run a11y
```

### Manual Testing

Regular manual testing is conducted using:

- Screen readers (NVDA, VoiceOver)
- Keyboard-only navigation
- Browser developer tools (Accessibility audits)
- Different zoom levels and viewport sizes

## Common Issues and Fixes

### Forms

- Ensure all form controls have associated labels
- Use fieldsets and legends for grouping related controls
- Link error messages to inputs using aria-describedby
- Include clear validation messages

### Navigation

- Ensure keyboard focus order is logical
- Provide skip links to main content
- Use proper heading hierarchy
- Mark current location in navigation

### Images and Media

- Always include alt text for images
- Use empty alt text for decorative images
- Provide captions and transcripts for video/audio

### Color and Contrast

- Don't rely on color alone to convey meaning
- Maintain 4.5:1 contrast ratio for normal text
- Provide high contrast mode option

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Implementation in Our Codebase

- `src/utils/test-utils/accessibility.js` - Accessibility testing utilities
- `src/components/__tests__/a11y-*.test.jsx` - Accessibility test suites
- `src/components/ScreenReaderOnly.jsx` - Component for screen-reader-only content
- `src/styles/colors.css` - WCAG 2.1 AA compliant color variables
- `src/styles/forms.css` - Accessible form styles with proper contrast
- `src/components/CollapsibleSection.jsx` - Accessible collapsible component

## Recent Accessibility Improvements

### Navigation and Focus Management

- Added skip navigation link to bypass repetitive content
- Improved keyboard focus indicators throughout the application
- Implemented proper focus management for form submissions and errors
- Ensured logical keyboard navigation order

### Forms and User Input

- Associated error messages with form inputs using aria-describedby
- Added proper aria-invalid states to indicate validation errors
- Enhanced calendar component with keyboard navigation and ARIA attributes
- Improved time slot selection with proper ARIA roles and states

### Visual Design

- Implemented a color system that meets WCAG 2.1 AA contrast requirements
- Enhanced focus states for all interactive elements
- Ensured text contrast meets 4.5:1 ratio for normal text, 3:1 for large text
- Added high contrast mode support

### ARIA Attributes and Screen Reader Support

- Added appropriate ARIA labels for icon-only UI elements
- Implemented proper ARIA roles, states, and properties
- Enhanced dynamic content with aria-live regions
- Made decorative icons hidden from screen readers

### Reusable Accessible Components

- Created CollapsibleSection component following WAI-ARIA Accordion pattern
- Enhanced language switcher with proper aria-pressed states
- Improved offline notification with appropriate aria-live region
- Added support for RTL languages in all components

## Accessibility Testing Procedures

We have established a comprehensive testing process to ensure that our application remains accessible as it evolves:

### Automated Testing

Our CI/CD pipeline includes automated accessibility tests using jest-axe. These tests run for:

1. All components in isolation
2. Integration tests for common user flows
3. Full page tests for major application views

To run accessibility tests locally:

```bash
# Run all accessibility tests
npm test -- --run a11y

# Test a specific component
npm test -- --run a11y-component-name
```

### Manual Testing Checklist

Before merging significant UI changes, perform these manual checks:

1. **Keyboard Navigation**:
   - Tab through all interactive elements to ensure they receive focus
   - Verify that focus order is logical
   - Confirm that all functionality works with keyboard alone

2. **Screen Reader Testing**:
   - Test with NVDA on Windows or VoiceOver on macOS
   - Verify that all content and controls are properly announced
   - Check that dynamic content updates are announced appropriately

3. **Color and Contrast**:
   - Use browser developer tools to verify contrast ratios
   - Test with high contrast mode enabled
   - Ensure information is not conveyed by color alone

4. **Responsive Testing**:
   - Test at various zoom levels (up to 200%)
   - Verify functionality on different viewport sizes
   - Test with text-only zoom enabled

## Future Accessibility Plans

Our roadmap for further accessibility improvements includes:

1. Implementing advanced screen reader announcements for live regions
2. Adding support for reduced motion preferences
3. Enhancing keyboard shortcuts for power users
4. Creating a comprehensive accessibility testing suite with automated reports
5. Implementing user settings for accessibility preferences

Remember that accessibility is an ongoing process, not a one-time task. Regularly review and test for accessibility as the application evolves.
