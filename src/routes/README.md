# Routing Structure

This directory contains the centralized routing configuration for the Memory Lane application.

## Overview

The application uses React Router for routing and follows a centralized approach where all routes are defined in one place. This makes it easier to understand the application structure, manage authentication requirements, and maintain the routing logic.

## Route Structure

- `/` - Home/Landing page (public)
- `/memories` - Main authenticated area (requires login)
  - `/` - Memory lanes listing
  - `/create` - Create new memory lane
  - `/lane/:laneId` - View and edit a specific memory lane
  - `/settings` - User settings
- `/share/:shareId` - Public share view for shared memory lanes (no authentication required)

## Authentication Protection

Routes under `/memories/*` are protected and require authentication. If a user tries to access these routes without being logged in, they will be redirected to the home page.

## Nested Routes

The application uses nested routes with React Router's `Outlet` component to maintain consistent layouts. The `MainLayout` component is used for all authenticated routes, providing the sidebar navigation and common structure.

## How to Add New Routes

To add a new route:

1. Create a new page component in `src/components/pages/`
2. Import the component in `src/routes/index.tsx`
3. Add a new `<Route>` element in the appropriate location
4. For authenticated routes, add the route under the `/memories` parent route
5. For public routes, add the route at the top level

Example:

```jsx
// Adding a new protected route
<Route path="profile" element={currentUser ? <UserProfilePage user={currentUser} /> : <Navigate to="/" />} />

// Adding a new public route
<Route path="/about" element={<AboutPage />} />
```
