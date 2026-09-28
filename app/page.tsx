import { getSiteSettings } from "@/lib/data";
import LeftPanel from "@/components/home/LeftPanel";
import MiddlePanel from "@/components/home/MiddlePanel";
import RightPanel from "@/components/home/RightPanel";
import HomeMenuStrip from "@/components/HomeMenuStrip";
import Tour from "@/components/tour/Tour";
import { siteTour } from "@/components/tour/flow";

export default async function HomePage() {
  const settings = await getSiteSettings();
  const year = new Date().getFullYear();

  const { brand, home, role, name } = settings;

  return (
    <main
      className="dark-surface h-[100dvh] w-full overflow-hidden relative"
      style={{ background: "#000", color: "#fff" }}
    >
      <style>{`html,body{background:#000!important}`}</style>
      {/* ── background portrait ── */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${home.heroImage})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center 20%",
          backgroundSize: "cover",
          filter: "grayscale(1) contrast(1.25) brightness(0.38)",
        }}
      />
      {/* vignette */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.92) 100%)",
        }}
      />
      {/* grain */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          opacity: 0.45,
          mixBlendMode: "overlay",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />
      {/* glow artifact */}
      <div
        aria-hidden
        className="absolute z-0"
        style={{
          top: "-5%", left: "35%", width: 500, height: 350,
          background: "radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <div className="relative lg:absolute z-20 lg:inset-2 m-2 lg:m-0 h-[calc(100dvh-1rem)] lg:h-auto">
        <div
          className="relative w-full h-full rounded-[14px] overflow-hidden grid grid-cols-[3fr_2fr] lg:grid-cols-12 grid-rows-[auto_minmax(0,1fr)_auto_auto] lg:grid-rows-none"
          style={{
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.15)",
            backdropFilter: "blur(2px)",
          }}
        >
          <LeftPanel
            brand={brand}
            headline={home.headline}
            bio={settings.bio}
            roleTitle={role.title}
            footerCaption={home.footerCaption}
            year={year}
          />

          <MiddlePanel heroImage={home.heroImage} name={name} />

          <RightPanel ctas={home.ctas} />

          <HomeMenuStrip />
        </div>
      </div>

      <Tour steps={siteTour} label="Site tour" autoStartDelay={null} phoneTopRight phoneNavBottom="150px" />
    </main>
  );
}
