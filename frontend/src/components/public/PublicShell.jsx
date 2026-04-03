"use client";

export function LanguageSwitch({ currentLanguage, onChange, className = "" }) {
  return (
    <div className={`lang-switch ${className}`.trim()} aria-label="Language switcher">
      <button
        type="button"
        className={`lang-chip ${currentLanguage === "en" ? "active" : ""}`}
        aria-pressed={currentLanguage === "en"}
        onClick={() => onChange("en")}
      >
        English
      </button>
      <button
        type="button"
        className={`lang-chip lang-chip--devanagari ${currentLanguage === "ne" ? "active" : ""}`}
        aria-pressed={currentLanguage === "ne"}
        onClick={() => onChange("ne")}
      >
        नेपाली
      </button>
    </div>
  );
}

export function PublicTopbar({ title, children }) {
  return (
    <div className="topbar pnpp-topbar">
      <div className="container topbar-inner pnpp-topbar-inner">
        <div className="topbar-brand pnpp-topbar-brand">
          <span className="pnpp-topbar-seal" aria-hidden="true">
            <img src="/assets/images/nepal-gov-emblem.png" alt="" />
          </span>
          <span>{title}</span>
        </div>
        <div className="topbar-meta">{children}</div>
      </div>
    </div>
  );
}

export function GovernmentHeader({ govLabel, title, subtitle }) {
  return (
    <header className="portal-header pnpp-masthead">
      <div className="container masthead-inner pnpp-masthead-inner">
        <div className="brand pnpp-brand-lockup">
          <div className="brand-mark crest government-emblem pnpp-brand-mark">
            <img src="/assets/images/nepal-gov-emblem.png" alt="Government of Nepal emblem" />
          </div>
          <div>
            <p className="eyebrow small">{govLabel}</p>
            <h1 className="pnpp-brand-title">{title}</h1>
            <p className="brand-subtitle">{subtitle}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
