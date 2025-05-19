import React, { useState, useEffect } from 'react';
import { Menu, X, Moon } from 'lucide-react';

const Logo = () => (
  <div className="flex items-center">
    <span className="text-white font-semibold text-base">
      Auraweave.<span className="text-[#FFD700]">AI</span>
    </span>
  </div>
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How to', href: '#workflow' },
    
    { name: 'About', href: '#about' },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'py-2' : 'py-4'
    }`}>
      <div className="flex justify-center px-4">
        <div className={`${
          scrolled ? 'bg-indigo-900/95 shadow-lg' : 'bg-transparent'
        } backdrop-blur-md rounded-full px-4 py-2 inline-flex items-center transition-all duration-300`}>
          {/* Logo */}
          <div className="flex items-center mr-5">
            <Logo />
          </div>

          <div className="hidden md:flex items-center space-x-5 mr-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-2">
            
            <button className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-3 text-base font-medium text-white shadow-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-300">
              
              Start Curating
            </button>
            <button className="p-1.5 rounded-full hover:bg-gray-600/30 transition-colors duration-200">
              <Moon className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-full hover:bg-gray-600/30 transition-colors duration-200"
          >
            <span className="sr-only">Open menu</span>
            {isOpen ? <X className="w-5 h-5 text-gray-300" /> : <Menu className="w-5 h-5 text-gray-300" />}
          </button>
        </div>
      </div>

      <div
        className={`${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        } md:hidden fixed top-0 right-0 bottom-0 w-full bg-black/95 transition-all duration-300 ease-in-out backdrop-blur-lg z-50`}
      >
        <div className="flex justify-between items-center px-6 py-6">
          <Logo />
          <button
            onClick={toggleMenu}
            className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
          >
            <X className="w-6 h-6 text-gray-300" />
          </button>
        </div>

        <div className="px-6 py-8 space-y-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="block text-lg text-gray-300 hover:text-white hover:bg-gray-800/30 px-4 py-3 rounded-lg transition-all duration-200"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </a>
          ))}
          
          <div className="pt-6 space-y-4">
            <button className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-black bg-[#FFD700] rounded-full hover:bg-[#FFD700]/90 transition-all duration-200">
              Start Curating
            </button>
            <button className="w-full inline-flex items-center justify-center px-6 py-3 text-sm text-gray-300 bg-gray-800/50 rounded-full hover:bg-gray-700/50 transition-all duration-200">
              <Moon className="w-4 h-4 mr-2" />
              Dark Mode
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;