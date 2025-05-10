# Component Organization

This directory contains all React components for the Memory Lane application, organized by their purpose and functionality.

## Directory Structure

### `/layout`

Components that define application layout and structure.

- `MainLayout.tsx` - The main authenticated layout with sidebar and content area
- `LeftMenubar.tsx` - The left sidebar navigation component

### `/pages`

Top-level components that correspond to routes/pages in the application.

- `HomePage.tsx` - Landing page with user selection
- `MemoriesPage.tsx` - Memory lanes listing page
- `CreateMemoryLanePage.tsx` - Page for creating new memory lanes
- `MemoryLaneDetailPage.tsx` - Memory lane details page
- `SharedMemoryLaneViewPage.tsx` - Public view of shared memory lanes
- `SettingsPage.tsx` - User settings page

### `/common`

Reusable utility components used throughout the application.

- `ErrorBoundary.tsx` - React error boundary for catching runtime errors
- `ErrorDisplay.tsx` - Standard error display components
- `AsyncContent.tsx` - Component for handling async data fetching with loading/error states

### `/features`

Domain-specific components that implement specific features.
(To be organized as the application grows)

### `/ui`

Low-level UI components that form the building blocks of the interface.
(Shadcn UI components)

## Best Practices

1. **Component Naming**:
   - Use PascalCase for component names
   - Pages end with `Page`
   - Layout components end with `Layout`
2. **File Organization**:
   - Place components in the appropriate directory based on their purpose
   - Keep related components together
3. **Error Handling**:

   - Use `ErrorBoundary` at strategic points in the component tree
   - Use `AsyncContent` for handling loading/error states in data fetching
   - Use `ErrorDisplay` for consistent error presentation

4. **Styling**:
   - Use utility classes from `src/utils/styleUtils.ts` for consistent styling
   - Leverage Tailwind for component-specific styling
