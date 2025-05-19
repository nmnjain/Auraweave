import React from 'react';
import { Twitter, Github, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
 
  return (
    <div className="flex justify-center w-full">
      <footer className="bg-[#090e07] border-t border-gray-800 rounded-lg w-2/4 mx-auto my-8">
        <div className="px-8 py-6">
          <div className="flex flex-col">
            <div className="mb-6">
              <h2 className="text-white text-xl font-bold">
                Auraweave.<span className="text-[#FFD700]">AI</span>
                <span className="text-sm text-gray-400 block mt-1">
                  Empowering AI agents with a transparent data marketplace.
                </span>
              </h2>
            </div>
           
            <div className="flex items-center space-x-4 mb-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Mail size={20} />
              </a>
            </div>
           
            
           
            <div className="flex flex-wrap justify-between items-center mt-4 border-t border-gray-800 pt-4 text-xs text-gray-400">
              <div className="flex space-x-4">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <span className="text-gray-600">•</span>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              </div>
              <div>
                <span>© {currentYear} | All Rights Reserved.</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};



export default Footer;
