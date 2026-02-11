'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { m } from 'framer-motion';
import { Github, ChevronDown, Check } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';

// Dynamically import GitHubCalendar with SSR disabled for Next.js compatibility
const GitHubCalendar = dynamic(
  () => import('react-github-calendar').then((mod) => ({ default: mod.GitHubCalendar })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading GitHub activity...</div>
      </div>
    ),
  }
);

interface GithubCalendarProps {
  username: string;
  githubUrl?: string;
}

type YearOption = number | 'last';

export function GithubCalendarComponent({ username, githubUrl }: GithubCalendarProps) {
  const currentYear = new Date().getFullYear();
  const { resolvedTheme } = useTheme();
  const [selectedYear, setSelectedYear] = useState<YearOption>('last');

  // Generate year options: 2025 to current year + "Last Year" option
  const yearOptions = useMemo(() => {
    const startYear = 2025;
    const years: YearOption[] = ['last'];
    for (let year = currentYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  }, [currentYear]);

  const handleYearChange = (year: YearOption) => {
    setSelectedYear(year);
  };

  const getYearLabel = (year: YearOption): string => {
    if (year === 'last') return 'Last Year';
    return year.toString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Github className="size-5 text-primary" />
              GitHub Contributions
            </CardTitle>
          </div>
          <div className="flex items-center gap-3">
            {/* Year Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {getYearLabel(selectedYear)}
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[120px]">
                {yearOptions.map((year) => (
                  <DropdownMenuItem
                    key={year}
                    onClick={() => handleYearChange(year)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span>{getYearLabel(year)}</span>
                    {selectedYear === year && (
                      <Check className="size-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* View Profile Link */}
            {githubUrl && (
              <Link
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View Profile →
              </Link>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <m.div
          key={selectedYear}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full overflow-x-auto overflow-y-hidden pb-2"
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="flex justify-center" style={{ minWidth: 'max-content' }}>
            <GitHubCalendar
              username={username}
              year={selectedYear}
              colorScheme={resolvedTheme === 'dark' ? 'dark' : 'light'}
              blockSize={14}
              blockMargin={4}
              fontSize={14}
              showWeekdayLabels
              weekStart={1}
            />
          </div>
        </m.div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Active GitHub contributor with consistent daily commits across production-grade projects
        </p>
      </CardContent>
    </Card>
  );
}

