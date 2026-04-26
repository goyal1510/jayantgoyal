# GitHub Stats

GitHub contribution calendar and statistics.

**Live**: [jayantgoyal.com/github-stats](https://jayantgoyal.com/github-stats)

## Features

- GitHub contribution calendar visualization
- Contribution streak tracking
- Activity heatmap
- Year-over-year comparison

## Tech Stack

- **react-github-calendar** - Contribution calendar component
- **GitHub API** - Contribution data
- **React 19** - UI rendering

## Files

```
src/
└── app/(protected)/github-stats/
    ├── page.tsx              # Server component
    └── client.tsx            # Stats display
```

## Usage

```tsx
import GitHubCalendar from 'react-github-calendar';

<GitHubCalendar
  username="goyal1510"
  colorScheme="dark"
/>
```
