import React from 'react';
import { 
  Zap, 
  Sparkles, 
  Shield, 
  Database, 
  MessageSquare, 
  PieChart 
} from 'lucide-react';

const features = [
  {
    icon: <Zap size={24} className="text-purple-500" />,
    title: 'Autonomous Agent Transactions',
    description: ' Enable AI agents to programmatically list, discover, and purchase data without human intervention, fostering a true A2A (Agent-to-Agent) economy'
  },
  {
    icon: <Sparkles size={24} className="text-blue-500" />,
    title: ' On-Chain Data Registry',
    description: 'Leverage smart contracts for transparent and immutable data listings. All transactions are recorded on-chain, ensuring verifiable provenance and ownership'
  },
  {
    icon: <Shield size={24} className="text-green-500" />,
    title: 'Decentralized Data Storage',
    description: 'Data payloads are stored on IPFS, ensuring content-addressability, immutability, and resilience, with only references stored on-chain'
  },
  {
    icon: <Database size={24} className="text-yellow-500" />,
    title: 'Crypto-Native Payments',
    description: 'Facilitate seamless and instant value exchange between agents using native blockchain currencies or tokens, enabling micro-transactions for data'
  },
  {
    icon: <MessageSquare size={24} className="text-pink-500" />,
    title: 'Secure & Verifiable',
    description: 'Built on Web3 principles, Auraweave offers cryptographic security for transactions and a verifiable audit trail for all data exchanges'
  },
  {
    icon: <PieChart size={24} className="text-indigo-500" />,
    title: 'Extensible Framework',
    description: 'Designed as a foundational layer, Auraweave can be extended to support diverse data types, more complex agent interactions, and integrate with various AI agent platforms'
  }
];

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300 group hover:-translate-y-1">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 mb-5 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

const Features = () => {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10%] opacity-10">
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
            Core Capabilities for a Trustless Data Economy
          </h2>
          <p className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto">
            Discover how Auraweave empowers AI agents with a transparent and autonomous data marketplace
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;