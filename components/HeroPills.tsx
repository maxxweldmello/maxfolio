/**
 * Inline oval "pill" decorations that sit between hero words.
 * Sized in em — must be placed INSIDE the large text span so em = large font size.
 */

type Props = { className?: string; label?: string };

const BASE = "block rounded-full";
const W = "clamp(4.2rem, 20vw, 15rem)";
const H = "clamp(1.6rem, 8.5vw, 5.5rem)";

/* Gradient blob — quiet radial, no colour. */
export function BlobPill({ className = "", label }: Props) {
  return (
    <span
      className={`${BASE} ${className}`}
      role="img"
      aria-label={label ?? "decorative pill"}
      style={{
        width: W,
        height: H,
        background: "radial-gradient(ellipse at 30% 35%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 60%, transparent 100%)",
        border: "1px solid rgba(255,255,255,0.22)",
      }}
    />
  );
}

/* Dot-grid pill — technical texture. */
export function DotPill({ className = "", label }: Props) {
  return (
    <span
      className={`${BASE} ${className}`}
      role="img"
      aria-label={label ?? "decorative pill"}
      style={{
        width: W,
        height: H,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.45) 1px, transparent 1px)",
        backgroundSize: "10px 10px",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    />
  );
}

/* Hatched pill — diagonal lines. */
export function HatchPill({ className = "", label }: Props) {
  return (
    <span
      className={`${BASE} ${className}`}
      role="img"
      aria-label={label ?? "decorative pill"}
      style={{
        width: W,
        height: H,
        backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.28) 0, rgba(255,255,255,0.28) 1px, transparent 0, transparent 50%)",
        backgroundSize: "8px 8px",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    />
  );
}

/* Image pill — a real screenshot cropped into the oval, grayscaled to match the hero tone. */
export function ImagePill({ src, className = "", label }: Props & { src: string }) {
  return (
    <span
      className={`${BASE} ${className}`}
      role="img"
      aria-label={label ?? "preview pill"}
      style={{
        width: W,
        height: H,
        backgroundImage: `url("${src}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "grayscale(0.4) contrast(1.05)",
        border: "1px solid rgba(255,255,255,0.22)",
      }}
    />
  );
}

/* Rectangular preview thumbnail — sits beside a pill, not cropped into its oval shape.
   `contain` shows the whole screenshot; no background fill or border, so only the
   image itself is visible — no frame/box around it. */
const THUMB_W = "clamp(6rem, 26vw, 15rem)";
const THUMB_H = "clamp(4rem, 17vw, 10rem)";
export function PreviewThumb({ src, className = "", label }: Props & { src: string }) {
  return (
    <span
      className={`block ${className}`}
      role="img"
      aria-label={label ?? "preview"}
      style={{
        width: THUMB_W,
        height: THUMB_H,
        backgroundImage: `url("${src}")`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        filter: "grayscale(0.4) contrast(1.05)",
      }}
    />
  );
}
