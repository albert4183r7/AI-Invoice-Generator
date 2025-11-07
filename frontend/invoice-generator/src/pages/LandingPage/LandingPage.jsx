import Header from "../../components/landing/Header"
import Hero from "../../components/landing/Hero"
import Features from "../../components/landing/Features"
import Testimonials from "../../components/landing/Testimonials"
import FAQ from "../../components/landing/FAQ"
import Footer from "../../components/landing/Footer"

const LandingPage = () => {
  return (
    <div className='bg-[#ffff] text-gray-600'>
        <Header />
        <main className="">
          <Hero />
          <Features />
          <Testimonials />
          <FAQ />
          <Footer />
        </main>
    </div>
  )
}

export default LandingPage