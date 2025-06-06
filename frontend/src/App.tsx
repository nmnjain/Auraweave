// src/App.tsx
import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom'; // Import routing components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Workflow from './components/Workflow';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Footer from './components/Footer';
import MarketplacePage from './components/MarketplacePage'; // Your dApp page

// Define a layout for the landing page sections
const LandingPageLayout: React.FC = () => {
  const navigate = useNavigate(); // Hook to programmatically navigate

  return (
    <div
      className="min-h-screen relative text-white"
      style={{
        backgroundImage: `url('/ethereum-network-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-75 backdrop-filter backdrop-blur-sm"></div>
      <div className="relative z-10">
        <Navbar /> {/* Assuming Navbar has links like <Link to="/">Home</Link> <Link to="/marketplace">Marketplace</Link> */}
        <main>
          {/* Pass the navigation function to Hero */}
          <Hero onLaunchMarketplace={() => navigate('/marketplace')} />
          <Features />
          <Workflow />
          <Testimonials />
          <CTA />
        </main>
        <Footer />
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPageLayout />} />
      <Route path="/marketplace" element={<MarketplacePage />} />
      {/* You can add a 404 Not Found route later if needed */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}
    </Routes>
  );
}

export default App;