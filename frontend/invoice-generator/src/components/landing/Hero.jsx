import { Link } from "react-router-dom"
import HERO_IMG from "../../assets/hero-img.png"

const Hero = () => {
    const isAuthenticated = false;
    return <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-blue-950 leading-tight mb-6">
                    Simplify Your Invoicing with AI-Powered Solutions
                </h1>
                <p className="text-base sm:text-xl text-gray-700 mb-8 leading-relaxed max-w-3xl mx-auto">
                    Let our AI create invoices from simple text, generate payment reminders, and provide smart insights to help you manage your finances.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                    {isAuthenticated ? (
                        <Link to= "/dashboard" className="bg-gradient-to-r from-blue-950 to-blue-900 text-white px-8 py-4 rounded-2xl font-bold text-base sm:text-lg hover:opacity-95 transition-all duration-200 hover:scale-102 hover:shadow-2xl transform">
                            Go to Dashboard
                        </Link>
                    ) : (
                        <Link to="/signup" className="bg-gradient-to-r from-blue-950 to-blue-900 text-white px-8 py-4 rounded-2xl font-bold text-base sm:text-lg hover:opacity-95 transition-all duration-200 hover:scale-102 hover:shadow-2xl transform">
                            Get Started for Free
                        </Link>
                    )}
                    <a href="#features" className="border-2 border-slate-200 text-primary-900 px-8 py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-white hover:text-primary-900 transition-all duration-200 hover:scale-102">
                        Learn More
                    </a>
                </div>
            </div>
            <div className="mt-12 sm:mt-16 relative max-w-4xl mx-auto">
                <img 
                    src={HERO_IMG} 
                    alt="AI Invoice Generator" 
                    className="w-full h-auto rounded-lg shadow-lg"
                />
            </div>
        </div>
    </section>
}

export default Hero