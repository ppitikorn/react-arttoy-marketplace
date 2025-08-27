
const Footer = () => {
  const footerLinks = {
    Company: [
      { name: 'About Us', path: '/about' },
      { name: 'Contact', path: '/contact' },
      { name: 'Careers', path: '/careers' },
    ],
    Support: [
      { name: 'Help Center', path: '/help' },
      { name: 'Safety', path: '/safety' },
      { name: 'Terms', path: '/terms' },
    ],
    Legal: [
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms-of-service' },
      { name: 'Cookie Policy', path: '/cookie-policy' },
    ],
  };

  return (
    <footer className="bg-yellow-200 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Bottom section */}
        <p className="text-sm text-gray-700 text-center">
          © {new Date().getFullYear()} Arttoy Marketplace. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;