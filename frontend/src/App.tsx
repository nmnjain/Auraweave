import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Workflow from './components/Workflow';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-black-900 text-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
         <Workflow />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default App;