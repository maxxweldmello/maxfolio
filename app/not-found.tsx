export default function NotFound() {
  return (
    <main className="nf-full relative min-h-[100dvh] w-full overflow-hidden">
      <img src="/404/404-light.webp" alt="404 — page not found" className="nf-img nf-img-light" />
      <img src="/404/404-dark.webp" alt="404 — page not found" className="nf-img nf-img-dark" />

      <style>{`
        .nf-img {
          position: absolute;
          top: 58px;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: calc(100% - 58px);
          object-fit: contain;
        }
        .nf-img-dark { display: none; }
        [data-theme="dark"] .nf-img-light { display: none; }
        [data-theme="dark"] .nf-img-dark { display: block; }
      `}</style>
    </main>
  );
}
