"use client";

interface Props {
  label: string;
  value: string;
  href: string;
}

export default function ContactLinkRow({ label, value, href }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "clamp(12px, 1.8vh, 20px) 0",
        borderBottom: "1px solid var(--rule)",
        textDecoration: "none",
        color: "var(--ink)",
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.45")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--ink-30)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(0.95rem, 1.6vw, 1.4rem)",
          fontWeight: 400,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
        }}
      >
        {value} ↗
      </span>
    </a>
  );
}
