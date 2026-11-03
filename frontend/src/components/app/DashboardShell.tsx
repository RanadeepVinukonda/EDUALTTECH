"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Menu from "@mui/icons-material/Menu";
import Close from "@mui/icons-material/Close";
import { useAuth } from "./AuthProvider";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/name";
import BrandLogo from "@/components/brand/BrandLogo";
import NavigationNotifications from "./NavigationNotifications";
import WorkspaceResourcesDropdown from "./WorkspaceResourcesDropdown";

interface NavLink {
  href: string;
  label: string;
  exact?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavLink[];
}

const LEARNER_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/dashboard/mentor", label: "Mentor hub" },
];

const LEARNER_GROUPS: NavGroup[] = [
  {
    label: "Learning",
    items: [
      { href: "/dashboard/my-learning", label: "My learning" },
      { href: "/dashboard/courses", label: "Browse courses" },
    ],
  },
  {
    label: "Purchases",
    items: [
      { href: "/dashboard/orders", label: "Orders" },
      { href: "/dashboard/wishlist", label: "Wishlist" },
    ],
  },
];

const ADMIN_LINKS: NavLink[] = [
  { href: "/dashboard/admin", label: "Overview", exact: true },
  { href: "/dashboard/admin/cms", label: "Website CMS" },
  { href: "/dashboard/admin/orders", label: "Orders" },
];

const ADMIN_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard/admin/analytics", label: "Analytics" },
      { href: "/dashboard/admin/courses", label: "Courses" },
      { href: "/dashboard/admin/resources", label: "Resources" },
      { href: "/dashboard/admin/polls", label: "Course polling" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/dashboard/admin/users", label: "Users" },
      { href: "/dashboard/admin/mentors", label: "Mentors" },
      { href: "/dashboard/admin/applications", label: "Applications" },
      { href: "/dashboard/admin/inquiries", label: "Tuition inquiries" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/dashboard/admin/audit", label: "Audit log" },
      { href: "/dashboard/admin/settings", label: "Settings" },
    ],
  },
];

function WorkspaceLink({
  link,
  active,
  onNavigate,
}: {
  link: NavLink;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex min-h-11 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
        active ? "bg-paper-2 text-accent" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
      )}
    >
      {link.label}
    </Link>
  );
}

function WorkspaceDropdown({
  group,
  isActive,
  onNavigate,
  mobile = false,
}: {
  group: NavGroup;
  isActive: (link: NavLink) => boolean;
  onNavigate: () => void;
  mobile?: boolean;
}) {
  const active = group.items.some(isActive);

  return (
    <details className={cn("group", !mobile && "relative")}>
      <summary
        className={cn(
          "flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden",
          active ? "bg-paper-2 font-semibold text-accent" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
          mobile && "w-full",
        )}
      >
        {group.label}
        <ExpandMore
          fontSize="small"
          aria-hidden
          className="text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div
        className={cn(
          "z-50 min-w-52 rounded-lg border border-rule bg-paper p-1.5 shadow-elev2",
          mobile
            ? "ml-3 mt-1 border-y-0 border-r-0 border-l-2 border-l-rule shadow-none"
            : "absolute left-0 top-[calc(100%+0.5rem)]",
        )}
      >
        {group.items.map((link) => (
          <WorkspaceLink key={link.href} link={link} active={isActive(link)} onNavigate={onNavigate} />
        ))}
      </div>
    </details>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut, isSigningOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "/dashboard";

  const isAdmin = user?.role === "ADMIN";
  const signingOut = isSigningOut();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (isSigningOut()) return;
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!user.onboardingDone) {
      router.replace("/onboarding");
    }
  }, [loading, user, pathname, router, isSigningOut]);

  useEffect(() => {
    const closeMenus = () => {
      setMenuOpen(false);
      setMobileNavOpen(false);
      headerRef.current?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((details) => {
        details.open = false;
      });
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) closeMenus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenus();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMobileNavOpen(false);
    headerRef.current?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((details) => {
      details.open = false;
    });
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-white">
        <Spinner label="Loading your workspace..." />
      </div>
    );
  }

  const groups = isAdmin ? ADMIN_GROUPS : LEARNER_GROUPS;
  const links = isAdmin ? ADMIN_LINKS : LEARNER_LINKS;
  const brandHref = isAdmin ? "/dashboard/admin" : "/dashboard";

  const isActive = (link: NavLink) =>
    link.exact || link.href === "/dashboard"
      ? pathname === link.href
      : pathname === link.href || pathname.startsWith(`${link.href}/`);
  const closeNavigation = () => {
    setMobileNavOpen(false);
    headerRef.current?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((details) => {
      details.open = false;
    });
  };

  return (
    <div className="min-h-dvh bg-paper-2">
      <header ref={headerRef} className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link href={brandHref} className="flex min-w-0 shrink-0 items-center" aria-label="EduAltTech">
            <BrandLogo withWordmark wordmarkClassName="text-sm" />
          </Link>

          <nav aria-label="Workspace" className="hidden min-w-0 flex-1 items-center gap-1 lg:flex">
            {links.map((link) => (
              <WorkspaceLink key={link.href} link={link} active={isActive(link)} onNavigate={closeNavigation} />
            ))}
            {!isAdmin && (
              <WorkspaceResourcesDropdown pathname={pathname} onNavigate={closeNavigation} />
            )}
            {groups.map((group) => (
              <WorkspaceDropdown
                key={group.label}
                group={group}
                isActive={isActive}
                onNavigate={closeNavigation}
              />
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <NavigationNotifications />

            <div className="relative">
              <button
                type="button"
                aria-label={`${user.name} account menu`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                disabled={signingOut}
                onClick={() => {
                  setMenuOpen((value) => !value);
                }}
                className="flex min-h-11 items-center gap-1.5 rounded-full p-1 pr-2 transition-colors hover:bg-paper-2 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-55"
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
                    {initials(user.firstName, user.lastName)}
                  </span>
                )}
                <ExpandMore fontSize="small" aria-hidden className="text-muted" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 overflow-hidden rounded-lg border border-rule bg-paper py-1.5 shadow-elev3"
                >
                  <div className="border-b border-rule px-4 pb-3 pt-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
                      {isAdmin && <span className="shrink-0 text-xs font-medium text-muted">Admin</span>}
                    </div>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  {isAdmin && (
                    <Link
                      href="/dashboard/admin"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block min-h-11 px-4 py-3 text-sm text-ink-2 transition-colors hover:bg-paper-2 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      Admin console
                    </Link>
                  )}
                  {!isAdmin && (
                    <Link href="/dashboard/profile" role="menuitem" onClick={() => setMenuOpen(false)} className="block min-h-11 px-4 py-3 text-sm text-ink-2 transition-colors hover:bg-paper-2 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                      Profile
                    </Link>
                  )}
                  <Link
                    href={isAdmin ? "/dashboard/admin/settings" : "/dashboard/settings"}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block min-h-11 px-4 py-3 text-sm text-ink-2 transition-colors hover:bg-paper-2 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    Settings
                  </Link>
                  <div className="my-1.5 border-t border-rule" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void signOut().then(() => router.replace("/"))}
                    disabled={signingOut}
                    className="block min-h-11 w-full px-4 py-3 text-left text-sm font-medium text-danger transition-colors hover:bg-danger/5 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-label={mobileNavOpen ? "Close workspace navigation" : "Open workspace navigation"}
              aria-expanded={mobileNavOpen}
              aria-controls="workspace-mobile-navigation"
              disabled={signingOut}
              className="grid h-11 w-11 place-items-center rounded-md text-ink-2 transition-colors hover:bg-paper-2 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-55 lg:hidden"
            >
              {mobileNavOpen ? <Close fontSize="small" aria-hidden /> : <Menu fontSize="small" aria-hidden />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <nav
            id="workspace-mobile-navigation"
            aria-label="Workspace"
            className="border-t border-rule bg-paper px-4 py-3 sm:px-6 lg:hidden"
          >
            <div className="mx-auto max-w-7xl space-y-1">
              {links.map((link) => (
                <WorkspaceLink key={link.href} link={link} active={isActive(link)} onNavigate={closeNavigation} />
              ))}
              {!isAdmin && (
                <WorkspaceResourcesDropdown pathname={pathname} onNavigate={closeNavigation} mobile />
              )}
              {groups.map((group) => (
                <WorkspaceDropdown
                  key={group.label}
                  group={group}
                  isActive={isActive}
                  onNavigate={closeNavigation}
                  mobile
                />
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-7 sm:px-6 lg:px-10">
        {children}
      </main>
    </div>
  );
}
