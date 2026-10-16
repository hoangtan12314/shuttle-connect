import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Bell, CalendarDays, Plus, Search } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { useAuthUser, LoginButton } from '@/features/auth';
import { useMe } from '@/entities/user';
import { useT, useLanguageStore, type Language } from '@/shared/i18n';

// Module-level, not defined inside AppShell -- a component declared during render is a fresh
// type every render, so React treats each render's instance as unrelated to the last one and
// resets its state. ToggleGroup doesn't hold meaningful internal state today, but this is the
// kind of bug that stays invisible until it doesn't (e.g. an in-progress keyboard-focus ring).
function LanguageSwitch({
  language,
  onLanguageChange,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={language}
      onValueChange={(value) => value && onLanguageChange(value as Language)}
      variant="outline"
    >
      <ToggleGroupItem value="vi">VI</ToggleGroupItem>
      <ToggleGroupItem value="en">EN</ToggleGroupItem>
    </ToggleGroup>
  );
}

// widgets/app-shell: mobile top bar + bottom tab bar, desktop left sidebar. Combines
// features/auth (login state) and entities/user (useMe, for the avatar/name) -- the exact
// composition a widget exists for, which entities/user or features/auth individually can't do.
export function AppShell({ children }: { children: ReactNode }) {
  const t = useT();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const { isAuthenticated } = useAuthUser();
  const { data: me } = useMe(isAuthenticated);

  const initials = me?.fullName
    ? me.fullName
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : undefined;

  // Browse/Activity/Notifications only -- `create` gets its own dedicated button, not a nav
  // entry, on desktop (the design filters it out of navDef for the sidebar; mobile's bottom tab
  // bar is the one place `create` also appears as a regular-looking tab).
  const navItems = [
    { to: '/' as const, label: t.navBrowse, icon: Search },
    { to: '/activity' as const, label: t.navActivity, icon: CalendarDays },
    { to: '/notifications' as const, label: t.navAlerts, icon: Bell },
  ];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop sidebar */}
      <nav className="bg-card hidden w-60 flex-none flex-col gap-5 p-4 md:flex">
        <div>
          <img
            src="/shuttle-connect-logo-full.png"
            alt="Shuttle Connect"
            className="h-8 w-auto"
          />
        </div>

        <Button asChild size="lg" className="justify-start">
          <Link to="/sessions/new">
            <Plus className="size-4" />
            {t.createSession}
          </Link>
        </Button>

        <div className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="text-foreground flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold"
              activeProps={{ className: 'bg-primary-100 text-primary-800' }}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-3">
          {isAuthenticated ? (
            <Link to="/profile" className="flex items-center gap-2 text-left">
              <Avatar>
                <AvatarFallback>{initials ?? '?'}</AvatarFallback>
              </Avatar>
              <span className="flex flex-col">
                <span className="text-sm font-bold">{me?.fullName}</span>
              </span>
            </Link>
          ) : (
            <LoginButton />
          )}
          <LanguageSwitch language={language} onLanguageChange={setLanguage} />
        </div>
      </nav>

      {/* Mobile top bar */}
      <header className="bg-card flex min-h-11 items-center gap-2 p-3 md:hidden">
        <img
          src="/shuttle-connect-logo-full.png"
          alt="Shuttle Connect"
          className="mr-auto h-6 w-auto"
        />
        <LanguageSwitch language={language} onLanguageChange={setLanguage} />
        {isAuthenticated ? (
          <Link to="/profile" aria-label={t.profile}>
            <Avatar>
              <AvatarFallback>{initials ?? '?'}</AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <LoginButton />
        )}
      </header>

      <main className="min-w-0 flex-1 pb-16 md:pb-0">{children}</main>

      {/* Mobile bottom tab bar -- includes `create`, unlike the desktop sidebar's nav list. */}
      <nav className="bg-card fixed inset-x-0 bottom-0 flex items-center justify-around border-t p-1 md:hidden">
        <Link
          to="/"
          className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold"
          activeProps={{ className: 'text-primary-700' }}
        >
          <Search className="size-5" />
          {t.navBrowse}
        </Link>
        <Link
          to="/activity"
          className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold"
          activeProps={{ className: 'text-primary-700' }}
        >
          <CalendarDays className="size-5" />
          {t.navActivity}
        </Link>
        <Link
          to="/sessions/new"
          className="bg-primary text-primary-foreground mx-1 flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold"
        >
          <Plus className="size-5" />
          {t.navHost}
        </Link>
        <Link
          to="/notifications"
          className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold"
          activeProps={{ className: 'text-primary-700' }}
        >
          <Bell className="size-5" />
          {t.navAlerts}
        </Link>
      </nav>
    </div>
  );
}
