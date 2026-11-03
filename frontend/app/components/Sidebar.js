"use client";

import { useState } from "react";

const ICON_PROPS = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const icons = {
  clients: (
    <svg {...ICON_PROPS}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  analysis: (
    <svg {...ICON_PROPS}>
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 4 4 5-6" />
    </svg>
  ),
  settings: (
    <svg {...ICON_PROPS}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  moon: (
    <svg {...ICON_PROPS}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  sun: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  chevron: (
    <svg {...ICON_PROPS} width={14} height={14}>
      <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { id: "radar", label: "Clients", icon: icons.clients },
  { id: "audit", label: "Analysis", icon: icons.analysis },
  { id: "settings", label: "Settings", icon: icons.settings },
];

export default function Sidebar({
  activeView,
  onNavigate,
  attentionCount,
  agencyName,
  monogram,
  userEmail,
  theme,
  onToggleTheme,
  onSignOut,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        relvnt<span>.</span>
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`sidebar-link ${activeView === item.id ? "sidebar-link-active" : ""}`}
            aria-current={activeView === item.id ? "page" : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.id === "radar" && attentionCount > 0 && (
              <span className="sidebar-count" title={`${attentionCount} need attention`}>
                {attentionCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={onToggleTheme}
          className="sidebar-link"
          aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
        >
          {theme === "light" ? icons.moon : icons.sun}
          <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
        </button>

        <div className="sidebar-account-wrap">
          <button className="sidebar-account" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
            <span className="sidebar-avatar">{monogram}</span>
            <span className="sidebar-account-text">
              <span className="sidebar-account-name">{agencyName}</span>
              <span className="sidebar-account-email">{userEmail}</span>
            </span>
            {icons.chevron}
          </button>

          {menuOpen && (
            <>
              <div className="dropdown-backdrop-transparent" onClick={() => setMenuOpen(false)} />
              <div className="sidebar-menu" role="menu">
                <button
                  className="dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    onNavigate("settings");
                    setMenuOpen(false);
                  }}
                >
                  Agency settings
                </button>
                <button
                  className="dropdown-item dropdown-item-danger"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
