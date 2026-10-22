import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Globe,
  HelpCircle,
  LogOut,
  Plus,
  Search,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { useAuthUser, LoginButton } from '@/features/auth';
import { useMe } from '@/entities/user';
import { useT, useLanguageStore, type Language } from '@/shared/i18n';
import { cn } from 'cn';

// Module-level, not defined inside AppShell -- a component declared during render is a fresh
// type every render, so React treats each render's instance as unrelated to the last one and
// resets its state (here: the dropdown would snap shut on any AppShell re-render).
// Signed-out language picker: a globe icon instead of an always-visible VI|EN pill, so the
// mobile header has room for logo-left / actions-right. Same two choices signed-in users get in
// UserMenu's Language submenu below.
function LanguageMenu({
  language,
  onLanguageChange,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
}) {
  const t = useT();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t.languageL}>
          <Globe className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onLanguageChange('vi')}>
          <Check className={cn(language !== 'vi' && 'invisible')} />
          Tiếng Việt
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onLanguageChange('en')}>
          <Check className={cn(language !== 'en' && 'invisible')} />
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Module-level for the same reason as LanguageMenu above. Wraps `children` (whatever the
// trigger should look like -- avatar alone on mobile, avatar+name on desktop) in a dropdown
// combining features/auth (signOut) and shared/i18n (language) -- the same kind of composition
// AppShell itself exists for, just scoped to the menu.
function UserMenu({
  email,
  language,
  onLanguageChange,
  children,
  className,
}: {
  email?: string;
  language: Language;
  onLanguageChange: (language: Language) => void;
  children: ReactNode;
  className?: string;
}) {
  const t = useT();
  const { signOut } = useAuthUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'group hover:bg-muted active:bg-muted data-[state=open]:bg-muted flex cursor-pointer items-center rounded-xl p-1.5 text-left transition-colors outline-none',
            className,
          )}
        >
          {children}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {email && (
          <DropdownMenuLabel className="text-muted-foreground truncate font-normal">
            {email}
          </DropdownMenuLabel>
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Globe />
            {t.languageL}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onSelect={() => onLanguageChange('vi')}>
              {language === 'vi' && <Check />}
              Tiếng Việt
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLanguageChange('en')}>
              {language === 'en' && <Check />}
              English
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem disabled>
          <HelpCircle />
          {t.getHelp}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <UserIcon />
            {t.profile}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={signOut}>
          <LogOut />
          {t.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
    // overflow-x-clip is a safety net: if anything inside ever ends up wider than the screen, it
    // gets clipped here instead of widening the mobile layout viewport (which would also drag the
    // fixed bottom nav below the visible area). `clip`, not `hidden`, so it doesn't create a
    // scroll container and the desktop sidebar's `sticky` keeps working.
    <div className="flex min-h-screen flex-col overflow-x-clip md:flex-row">
      <nav className="bg-card sticky top-0 hidden h-screen w-60 flex-none flex-col gap-5 overflow-y-auto p-4 md:flex">
        <div>
          <Link to="/">
            <img
              src="/shuttle-connect-logo-full.png"
              alt="Shuttle Connect"
              className="h-12 w-auto"
            />
          </Link>
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
              className="text-foreground hover:bg-primary-100 flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold transition-colors"
              activeProps={{ className: 'bg-primary-100 text-primary-800' }}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-3">
          {isAuthenticated ? (
            <UserMenu
              email={me?.email}
              language={language}
              onLanguageChange={setLanguage}
              className="w-full"
            >
              <span className="flex w-full items-center gap-2">
                {initials && (
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                )}
                <span className="flex flex-1 flex-col">
                  <span className="text-sm font-bold">{me?.fullName}</span>
                </span>
                <ChevronDown className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180" />
              </span>
            </UserMenu>
          ) : (
            <div className="flex items-center gap-2">
              <LoginButton className="flex-1" />
              <LanguageMenu
                language={language}
                onLanguageChange={setLanguage}
              />
            </div>
          )}
        </div>
      </nav>

      {/* Mobile top bar */}
      <header className="bg-card flex min-h-11 items-center justify-between gap-2 p-3 md:hidden">
        <Link to="/" className="shrink-0">
          <img
            src="/shuttle-connect-logo-horizontal.png"
            alt="Shuttle Connect"
            className="h-6 w-auto"
          />
        </Link>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <UserMenu
              email={me?.email}
              language={language}
              onLanguageChange={setLanguage}
            >
              {initials && (
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              )}
            </UserMenu>
          ) : (
            <>
              <LanguageMenu
                language={language}
                onLanguageChange={setLanguage}
              />
              <LoginButton />
            </>
          )}
        </div>
      </header>

      <main className="min-w-0 flex-1 p-4 pb-16 md:p-6 md:pb-6">
        {children}
      </main>

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
