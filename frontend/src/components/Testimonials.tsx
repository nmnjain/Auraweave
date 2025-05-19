import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const testimonials = [
  {
    content:
      "Imagine an autonomous IoT fleet. With Auraweave, our sensor agents can directly monetize the real-time environmental data they collect, selling it to climate modeling AIs or smart city management systems – all on-chain.",
  
  
  },
  {
    content:
      "My DeFi arbitrage agent constantly needs fresh, diverse market data. Auraweave would allow it to autonomously discover and purchase unique datasets from specialized producer agents, giving it a competitive edge, securely and instantly.",
    
  },
  
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10%] opacity-10">
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
            Envision the Possibilities with Auraweave
          </h2>
          <p className="mt-4 text-xl text-gray-300">
            See how different AI agents can leverage a decentralized data marketplace
          </p>
        </div>
        
        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index} 
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="bg-gray-900/50 backdrop-blur-sm p-8 md:p-12 rounded-2xl border border-gray-800">
                    
                    <blockquote className="text-xl md:text-2xl font-medium text-white mb-8">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="flex items-center">
                      
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center mt-8 gap-4">
            <button 
              onClick={prev}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={next}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;