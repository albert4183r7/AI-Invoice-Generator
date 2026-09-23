import { Link } from "react-router-dom";
import { Twitter, Github, Linkedin, FileText } from "lucide-react";
import ComingSoonLabel from "../ui/ComingSoonLabel";

// In-page anchors to the landing page's own sections.
const FooterAnchor = ({ href, children }) => (
  <a
    href={href}
    className="block text-gray-400 hover:text-white transition-colors duration-200"
  >
    {children}
  </a>
);

// Routes that do not exist yet. They stay listed so the intended footer is
// visible, but they are not rendered as links that bounce back to the landing
// page via the catch-all route.
const FooterPending = ({ children }) => (
  <ComingSoonLabel className="text-sm">{children}</ComingSoonLabel>
);

// No social accounts exist for this project yet, so these render as inert
// badges rather than anchors pointing at "#".
const SocialIcon = ({ label, children }) => (
  <span
    className="w-10 h-10 bg-blue-950 rounded-lg flex items-center justify-center opacity-60 cursor-not-allowed"
    title={`${label} — coming soon`}
    aria-disabled="true"
  >
    {children}
  </span>
);

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-blue-950 rounded-md flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">PromptBill</span>
            </Link>
            <p className="text-gray-400 leading-relaxed max-w-sm">
              The simplest way to create and send polished invoices — fast.
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <FooterAnchor href="#features">Features</FooterAnchor>
              </li>
              <li>
                <FooterAnchor href="#testimonials">Testimonials</FooterAnchor>
              </li>
              <li>
                <FooterAnchor href="#faq">FAQ</FooterAnchor>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-base font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><FooterPending>About Us</FooterPending></li>
              <li><FooterPending>Contact</FooterPending></li>
            </ul>
          </div>
          <div>
            <h3 className="text-base font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><FooterPending>Privacy Policy</FooterPending></li>
              <li><FooterPending>Terms of Service</FooterPending></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 py-8 mt-16">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} PromptBill. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <SocialIcon label="Twitter">
                <Twitter className="w-5 h-5" />
              </SocialIcon>
              <SocialIcon label="GitHub">
                <Github className="w-5 h-5" />
              </SocialIcon>
              <SocialIcon label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </SocialIcon>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer;
