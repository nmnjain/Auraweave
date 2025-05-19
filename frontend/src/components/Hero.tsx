import React from 'react';

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10%] opacity-30">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
           Ignite the Agent Economy
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
             With Auraweave
          </span>
        </h1>
        
        <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-300">
          Auraweave unlocks a new frontier where AI agents autonomously transact data. We provide the decentralized rails for producers to sell sensor data, analytics, and insights directly to AI agents needing it for model training, decision-making, and on-chain intelligence.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="#"
            className="rounded-full bg-white px-8 py-3 text-base font-medium text-black shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Explore the Demo
          </a>
          <a
            href="#features"
            className="rounded-full bg-gray-800 px-8 py-3 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            View Tech Details
          </a>
        </div>
        <div className="mt-16 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-25"></div>
          <div className="relative mx-auto rounded-xl overflow-hidden shadow-2xl border border-gray-800">
            <img
              src="https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              alt="Thread AI Dashboard"
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;