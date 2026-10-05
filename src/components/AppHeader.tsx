/**
 * The header every screen shares: the name, the main links and the theme switch.
 * The region is optional because some pages (email links, the explainer) carry none.
 *
 * On a phone the links do not fit beside the name, so they form a second row of
 * the header, always in view, instead of being tucked away at the foot of the page.
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

/** The main links, once; the caller decides how each one looks. */
function NavLinks({
  regionId,
  linkClass,
}: {
  regionId?: string | undefined;
  linkClass: string;
}) {
  const active = { className: shell.navLinkActive };
  return (
    <>
      {regionId ? (
        <Link
          to="/r/$regionId"
          params={{ regionId }}
          search={{}}
          className={linkClass}
          activeOptions={{ exact: true }}
          activeProps={active}
        >
          {strings.app.navStations}
        </Link>
      ) : (
        <Link to="/" className={linkClass} activeOptions={{ exact: true }} activeProps={active}>
          {strings.app.navStations}
        </Link>
      )}
      <Link to="/about" className={linkClass} activeProps={active}>
        {strings.app.navAbout}
      </Link>
      <Link
        to="/subscribe"
        search={regionId ? { region: regionId } : {}}
        className={linkClass}
        activeProps={active}
      >
        {strings.subscriptions.navLink}
      </Link>
    </>
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

        <div className={shell.nav}>
          <nav className={shell.navWide} aria-label={strings.app.navLabel}>
            <NavLinks regionId={regionId} linkClass={shell.navLink} />
          </nav>
          {children}
          <ThemeToggle />
        </div>
      </div>

      <nav className={shell.navPhone} aria-label={strings.app.navLabel}>
        <NavLinks regionId={regionId} linkClass={shell.navPhoneLink} />
      </nav>
    </header>
  );
}
