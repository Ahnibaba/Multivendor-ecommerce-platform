const FooterLink = ({ href = "#", children }: { href?: any, children: React.ReactNode }) => (
  <a
    href={href}
    className="text-gray-500 text-sm leading-loose hover:text-blue-600 transition-colors duration-200"
  >
    {children}
  </a>
);

const SocialIcon = ({ label, children } : { label: string, children: React.ReactNode }) => (
  <a
    href="#"
    aria-label={label}
    className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all duration-200"
  >
    {children}
  </a>
);

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 font-serif">
      <div className="max-w-6xl mx-auto px-6 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Brand Column */}
          <div>
            <div className="text-2xl font-black text-gray-900 mb-3 tracking-tight font-sans">
              Eshop
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-[220px] mb-5">
              Perfect ecommerce platform to start your business from scratch
            </p>
            <div className="flex gap-2.5">
              <SocialIcon label="Facebook">
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </SocialIcon>
              <SocialIcon label="Twitter">
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </SocialIcon>
              <SocialIcon label="LinkedIn">
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          {/* My Account */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 mb-4 uppercase tracking-widest font-sans">
              My Account
            </h3>
            <nav className="flex flex-col">
              {["Track Orders", "Shipping", "Wishlist", "My Account", "Order History", "Returns"].map((item) => (
                <FooterLink key={item}>{item}</FooterLink>
              ))}
            </nav>
          </div>

          {/* Information */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 mb-4 uppercase tracking-widest font-sans">
              Information
            </h3>
            <nav className="flex flex-col">
              {["Our Story", "Careers", "Privacy Policy", "Terms & Conditions", "Latest News", "Contact Us"].map((item) => (
                <FooterLink key={item}>{item}</FooterLink>
              ))}
            </nav>
          </div>

          {/* Talk To Us */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 mb-4 uppercase tracking-widest font-sans">
              Talk To Us
            </h3>
            <p className="text-gray-500 text-sm mb-2.5">Got Questions? Call us</p>
            <a
              href="tel:+67041390762"
              className="block text-2xl font-extrabold text-gray-900 no-underline tracking-tight mb-4 font-sans hover:text-blue-600 transition-colors duration-200"
            >
              +670 413 90 762
            </a>
            <div className="flex flex-col gap-2.5">
              <a
                href="mailto:support@eshop.com"
                className="flex items-center gap-2 text-gray-500 text-sm no-underline hover:text-blue-600 transition-colors duration-200"
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                support@eshop.com
              </a>
              <div className="flex items-start gap-2 text-gray-500 text-sm">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="mt-0.5 shrink-0">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>
                  79 Sleepy Hollow St.<br />Jamaica, New York 1432
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6 text-center text-gray-400 text-sm font-sans">
          © 2026 All Rights Reserved | Becodemy Private Ltd
        </div>
      </div>
    </footer>
  );
}
