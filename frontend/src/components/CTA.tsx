import React from 'react';

const CTA = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-black/80"></div>
        <div className="absolute -inset-[10%] opacity-20">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative max-w-3xl mx-auto py-16 px-8 md:py-24 md:px-12 bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-800">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Build the Future of Agent-to-Agent Data Exchange?
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Dive into Auraweave, explore our hackathon submission, and see how AI agents can power a new data economy.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://github.com/nmnjain/Auraweave"
              className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-3 text-base font-medium text-white shadow-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-300"
            >
              Watch Our Demo Video
            </a>
            <a
              href="https://github.com/nmnjain/Auraweave"
              className="rounded-full bg-gray-800 px-8 py-3 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-300"
            >
              Explore on GitHub
            </a>
          </div>
          
          <p className="mt-6 text-sm text-gray-400">
            Auraweave: Built for the AI Agents Summit 2025 Hackathon
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;