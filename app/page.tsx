import Preloader from "@/components/Preloader";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Destinations from "@/components/Destinations";
import Tours from "@/components/Tours";
import Experience from "@/components/Experience";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import SiteEffects from "@/components/SiteEffects";

export default function Home() {
  return (
    <>
      <div className="grain" aria-hidden="true" />
      <Preloader />
      <Header />
      <main>
        <Hero />
        <About />
        <Destinations />
        <Tours />
        <Experience />
        <Contact />
      </main>
      <Footer />
      <SiteEffects />
    </>
  );
}
