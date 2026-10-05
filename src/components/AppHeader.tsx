/**
 * The header every screen shares: the name, the main links and the theme switch.
 * The region is optional because some pages (email links, the explainer) carry none.
 */
import { Link } from "@tanstack/react-router";
import { Moon, Sun, Wind } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { strings } from "@/i18n/strings";
import { control, shell } from "@/design/tokens";
import { browserStorage } from "@/lib/dashboard";
import { applyTheme, currentTheme, nextTheme, storeTheme, type Theme } from "@/lib/theme";

function ThemeToggle() {
  // The class on <html> is set before the first paint; read it once mounted so the
  // server-rendered button and the first client render agree.
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => setTheme(currentTheme(document.documentElement)), []);

  const toggle = () => {
    const next = nextTheme(theme ?? currentTheme(document.documentElement));
    applyTheme(document.documentElement, next);
    storeTheme(browserStorage(), next);
    setTheme(next);
  };

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className={control.iconButton}
      onClick={toggle}
      aria-label={isDark ? strings.theme.toLight : strings.theme.toDark}
      title={isDark ? strings.theme.toLight : strings.theme.toDark}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

export function AppHeader({
  regionId,
  children,
}: {
  /** The region the visitor is in, when the page has one. */
  regionId?: string | undefined;
  /** Extra controls, e.g. the region switcher. */
  children?: ReactNode;
}) {
  return (
    <header className={shell.header}>
      <div className={shell.headerInner}>
        <Link to="/" className={shell.brand}>
          <span className={shell.brandMark} aria-hidden="true">
            <Wind className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className={`${shell.brandName} block`}>{strings.app.name}</span>
            <span className={shell.brandTagline}>{strings.app.tagline}</span>
          </span>
        </Link>

        <nav className={shell.nav} aria-label={strings.app.navLabel}>
          {regionId && (
            <Link
              to="/r/$regionId"
              params={{ regionId }}
              search={{}}
              className={`${shell.navLink} hidden md:inline-flex`}
              activeOptions={{ exact: true }}
              activeProps={{ className: shell.navLinkActive }}
            >
              {strings.app.navStations}
            </Link>
          )}
          <Link
            to="/about"
            className={`${shell.navLink} hidden sm:inline-flex`}
            activeProps={{ className: shell.navLinkActive }}
          >
            {strings.app.navAbout}
          </Link>
          <Link
            to="/subscribe"
            search={regionId ? { region: regionId } : {}}
            className={`${shell.navLink} hidden sm:inline-flex`}
            activeProps={{ className: shell.navLinkActive }}
          >
            {strings.subscriptions.navLink}
          </Link>
          {children}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

/** The links the header hides on a phone, repeated at the foot of the page. */
export function FooterLinks({ regionId }: { regionId?: string | undefined }) {
  return (
    <nav className="flex flex-wrap gap-x-4 gap-y-1 sm:hidden" aria-label={strings.app.navLabel}>
      <Link to="/about" className="underline underline-offset-2">
        {strings.app.navAbout}
      </Link>
      <Link
        to="/subscribe"
        search={regionId ? { region: regionId } : {}}
        className="underline underline-offset-2"
      >
        {strings.subscriptions.navLink}
      </Link>
    </nav>
  );
}
