import {
  Archive,
  Bell,
  Home,
  Kanban,
  LayoutGrid,
  Plug,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import { applicationUrl } from "@jayantgoyal/web-urls";
import type {
  ApplicationCommandPaletteGroup,
  ApplicationCommandPaletteItem,
} from "@jayantgoyal/web-ui/application-command-palette";
import type {
  ApplicationNavigationItem,
  ApplicationNavigationSection,
  BreadcrumbTrailItem,
} from "@jayantgoyal/web-ui/application-shell";

export type OrbitNavBoard = {
  id: string;
  name: string;
  key: string;
  workspaceId: string;
};

export type OrbitNavWorkspace = {
  id: string;
  name: string;
  boards: OrbitNavBoard[];
};

export type OrbitNavSnapshot = {
  workspaces: OrbitNavWorkspace[];
};

type OrbitStaticNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  iconClassName?: string;
  match: (pathname: string) => boolean;
};

const staticNavItems: OrbitStaticNavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/home",
    icon: Home,
    match: (pathname) => pathname === "/home",
  },
  {
    id: "inbox",
    label: "Inbox",
    href: "/inbox",
    icon: Bell,
    match: (pathname) => pathname === "/inbox" || pathname.startsWith("/inbox/"),
  },
];

export function buildOrbitNavigationSections(
  pathname: string,
  snapshot: OrbitNavSnapshot,
): ApplicationNavigationSection[] {
  const workspaceItems: ApplicationNavigationItem[] = snapshot.workspaces.map(
    (workspace) => {
      const workspaceActive =
        pathname.includes(`/workspaces/${workspace.id}`) ||
        workspace.boards.some((board) => pathname.startsWith(`/boards/${board.id}`));

      return {
        id: `workspace-${workspace.id}`,
        label: workspace.name,
        icon: LayoutGrid,
        isActive: workspaceActive,
        defaultOpen: workspaceActive,
        children: [
          {
            id: `workspace-${workspace.id}-members`,
            label: "Members",
            href: `/workspaces/${workspace.id}/members`,
            icon: Users,
            isActive: pathname === `/workspaces/${workspace.id}/members`,
          },
          {
            id: `workspace-${workspace.id}-settings`,
            label: "Settings",
            href: `/workspaces/${workspace.id}/settings`,
            icon: Settings,
            isActive: pathname === `/workspaces/${workspace.id}/settings`,
          },
          ...workspace.boards.map((board) => ({
            id: `board-${board.id}`,
            label: board.name,
            href: `/boards/${board.id}`,
            icon: Kanban,
            iconClassName: "text-primary",
            isActive:
              pathname === `/boards/${board.id}` ||
              pathname.startsWith(`/boards/${board.id}/`),
          })),
        ],
      };
    },
  );

  return [
    {
      id: "primary",
      label: "Navigate",
      items: staticNavItems.map((item) => ({
        id: item.id,
        label: item.label,
        href: item.href,
        icon: item.icon,
        iconClassName: item.iconClassName,
        isActive: item.match(pathname),
      })),
    },
    {
      id: "workspaces",
      label: "Workspaces",
      items: workspaceItems.length
        ? workspaceItems
        : [
            {
              id: "empty-workspaces",
              label: "No workspaces yet",
              href: "/home",
              icon: LayoutGrid,
              isActive: pathname === "/home",
            },
          ],
    },
    {
      id: "shortcuts",
      label: "Shortcuts",
      items: [
        {
          id: "studio",
          label: "Open Studio",
          href: applicationUrl("studio", "/"),
          icon: Sparkles,
          external: true,
        },
      ],
    },
  ];
}

export function buildOrbitBreadcrumbItems(
  pathname: string,
  snapshot: OrbitNavSnapshot,
): BreadcrumbTrailItem[] {
  if (pathname === "/home") {
    return [{ id: "page", label: "Home" }];
  }

  if (pathname === "/inbox") {
    return [{ id: "page", label: "Inbox" }];
  }

  const boardMatch = pathname.match(/^\/boards\/([^/]+)(?:\/(.*))?$/);
  if (boardMatch) {
    const boardId = boardMatch[1];
    const subpath = boardMatch[2];
    const board = snapshot.workspaces
      .flatMap((workspace) => workspace.boards)
      .find((entry) => entry.id === boardId);
    const workspace = snapshot.workspaces.find((entry) =>
      entry.boards.some((candidate) => candidate.id === boardId),
    );

    const items: BreadcrumbTrailItem[] = [];
    if (workspace) {
      items.push({
        id: "workspace",
        label: workspace.name,
        href: "/home",
      });
    }
    if (board) {
      items.push({
        id: "board",
        label: board.name,
        href: subpath ? `/boards/${board.id}` : undefined,
      });
    }
    if (subpath === "settings") {
      items.push({ id: "settings", label: "Settings" });
    } else if (subpath === "archive") {
      items.push({ id: "archive", label: "Archive" });
    }
    return items;
  }

  const workspaceMatch = pathname.match(/^\/workspaces\/([^/]+)\/([^/]+)$/);
  if (workspaceMatch) {
    const workspaceId = workspaceMatch[1];
    const page = workspaceMatch[2];
    const workspace = snapshot.workspaces.find((entry) => entry.id === workspaceId);
    const pageLabel =
      page === "members"
        ? "Members"
        : page === "settings"
          ? "Settings"
          : (page ?? "Page");

    return [
      {
        id: "workspace",
        label: workspace?.name ?? "Workspace",
        href: "/home",
      },
      { id: "page", label: pageLabel },
    ];
  }

  return [];
}

export function buildOrbitCommandPaletteGroups(
  snapshot: OrbitNavSnapshot,
): ApplicationCommandPaletteGroup[] {
  const primaryItems: ApplicationCommandPaletteItem[] = [
    {
      id: "go-home",
      label: "Home",
      value: "home workspaces boards",
      href: "/home",
      icon: Home,
    },
    {
      id: "go-inbox",
      label: "Inbox",
      value: "inbox notifications",
      href: "/inbox",
      icon: Bell,
    },
  ];

  const boardItems: ApplicationCommandPaletteItem[] = snapshot.workspaces.flatMap(
    (workspace) =>
      workspace.boards.map((board) => ({
        id: `board-${board.id}`,
        label: `${board.key} · ${board.name}`,
        value: `${board.key} ${board.name} ${workspace.name}`,
        href: `/boards/${board.id}`,
        icon: Kanban,
      })),
  );

  const workspaceItems: ApplicationCommandPaletteItem[] = snapshot.workspaces.flatMap(
    (workspace) => [
      {
        id: `workspace-${workspace.id}-settings`,
        label: `${workspace.name} settings`,
        value: `${workspace.name} settings workspace`,
        href: `/workspaces/${workspace.id}/settings`,
        icon: Settings,
      },
      {
        id: `workspace-${workspace.id}-members`,
        label: `${workspace.name} members`,
        value: `${workspace.name} members team`,
        href: `/workspaces/${workspace.id}/members`,
        icon: Users,
      },
    ],
  );

  const boardSettingsItems: ApplicationCommandPaletteItem[] = snapshot.workspaces.flatMap(
    (workspace) =>
      workspace.boards.flatMap((board) => [
        {
          id: `board-${board.id}-settings`,
          label: `${board.name} settings`,
          value: `${board.name} settings board`,
          href: `/boards/${board.id}/settings`,
          icon: Settings,
        },
        {
          id: `board-${board.id}-archive`,
          label: `${board.name} archive`,
          value: `${board.name} archive trash`,
          href: `/boards/${board.id}/archive`,
          icon: Archive,
        },
      ]),
  );

  const integrationItems: ApplicationCommandPaletteItem[] = snapshot.workspaces.map(
    (workspace) => ({
      id: `workspace-${workspace.id}-integrations`,
      label: `${workspace.name} integrations`,
      value: `${workspace.name} webhooks api tokens integrations`,
      href: `/workspaces/${workspace.id}/settings`,
      icon: Plug,
    }),
  );

  return [
    { id: "primary", label: "Go to", items: primaryItems },
    { id: "boards", label: "Boards", items: boardItems },
    { id: "workspace-admin", label: "Workspace", items: workspaceItems },
    { id: "board-admin", label: "Board admin", items: boardSettingsItems },
    { id: "integrations", label: "Integrations", items: integrationItems },
  ].filter((group) => group.items.length > 0);
}
