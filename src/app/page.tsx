import dynamic from "next/dynamic";
import { ClientBackground } from "@/components/Landing/ClientBackground";
import NavbarLanding from "@/components/Landing/NavbarLanding";
import HeroSection from "@/components/Landing/HeroSection";

/* Below-fold sections: code-split & lazy-loaded */
const ProblemSolution = dynamic(() => import("@/components/Landing/ProblemSolution"), { ssr: true });
const CoreSuperpowers = dynamic(() => import("@/components/Landing/CoreSuperpowers"), { ssr: true });
const HowItWorks = dynamic(() => import("@/components/Landing/HowItWorks"), { ssr: true });
const TechConstellation = dynamic(() => import("@/components/Landing/TechConstellation"), { ssr: true });
const Web3AISection = dynamic(() => import("@/components/Landing/Web3AISection"), { ssr: true });
const FooterLanding = dynamic(() => import("@/components/Landing/FooterLanding"), { ssr: true });

export default function HomePage() {
  return (
    <div className="bg-[#0e0e0e] min-h-screen">
      <NavbarLanding />
      <main id="main-content" className="relative z-[1]">
        <HeroSection />
        <section id="features">
          <ProblemSolution />
        </section>
        <section id="data-engine">
          <CoreSuperpowers />
        </section>
        <section id="how-it-works">
          <HowItWorks />
        </section>
        <section id="tech-stack">
          <TechConstellation />
        </section>
        <section id="web3-ai">
          <Web3AISection />
        </section>
      </main>
      <FooterLanding />
    </div>
  );
}
