// src/components/MarketplaceNavbar.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Moon, ShieldAlert, LogOut } from 'lucide-react'; // Or your preferred icons

interface MarketplaceNavbarProps {
  isConnected: boolean;
  account?: string | null;
  networkName?: string | null;
  isWrongNetwork?: boolean;
  onSwitchNetwork?: () => void;
  onDisconnectWallet?: () => void;
  // onToggleTheme: () => void; // Pass if theme is managed globally
  // currentTheme: 'light' | 'dark';
}

const Logo = () => (
  <Link to="/" className="flex items-center cursor-pointer group">
    <span className="text-white font-semibold text-base md:text-lg group-hover:text-purple-300 transition-colors">
      Auraweave.<span className="text-yellow-400 group-hover:text-yellow-300 transition-colors">AI</span>
    </span>
  </Link>
);

const MarketplaceNavbar: React.FC<MarketplaceNavbarProps> = ({
  isConnected,
  account,
  networkName,
  isWrongNetwork,
  onSwitchNetwork,
  onDisconnectWallet,
}) => {
  const [scrolledFromTop, setScrolledFromTop] = useState(false);

  // This effect is for styling changes if the main page scrolls,
  // though MarketplacePage might not scroll much initially.
  useEffect(() => {
    const handleScroll = () => {
      setScrolledFromTop(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navContainerBase = "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-in-out";
  // Width expands when connected, otherwise fits content
  const navContainerWidth = isConnected ? "w-[calc(100%-2rem)] sm:w-auto sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl" : "w-auto";

  const innerBoxBase = "backdrop-blur-xl rounded-full px-3 py-1.5 sm:px-4 sm:py-2 flex items-center shadow-lg transition-all duration-500 ease-in-out";
  // Background changes slightly on scroll AND connection state
  const innerBoxBg = (scrolledFromTop || isConnected) ? "bg-slate-900/80 border border-slate-700/50" : "bg-slate-950/50 border border-transparent";
  const innerBoxJustify = isConnected ? "justify-between w-full" : "justify-center";

  return (
    <nav className={`${navContainerBase} ${navContainerWidth}`}>
      <div className={`${innerBoxBase} ${innerBoxBg} ${innerBoxJustify}`}>
        {/* Logo */}
        <div className={`transition-all duration-300 ease-in-out ${isConnected ? 'mr-auto sm:mr-4' : ''}`}>
          <Logo />
        </div>

        {/* Wallet Info & Theme Toggle - Visible only when connected */}
        {isConnected && account && (
          <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
            {isWrongNetwork && onSwitchNetwork && (
              <button
                onClick={onSwitchNetwork}
                title="Switch Network"
                className="flex items-center p-1 sm:p-1.5 md:px-2 md:py-1 rounded-full bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 hover:text-orange-300 transition-colors duration-200 text-xs"
              >
                <ShieldAlert className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:mr-1" />
                <span className="hidden md:inline">Wrong Network</span>
              </button>
            )}
            <div className="hidden sm:flex items-center text-xs text-slate-400">
              <span>{networkName || 'N/A'}</span>
            </div>
            <div className="bg-slate-700/60 text-purple-300 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-mono truncate max-w-[100px] sm:max-w-[120px]">
              {account.substring(0, 5)}...{account.substring(account.length - 3)}
            </div>
            {onDisconnectWallet && (
              <button
                onClick={onDisconnectWallet}
                title="Disconnect Wallet"
                className="p-1 sm:p-1.5 rounded-full hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors duration-200"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
            {/* Theme button always visible next to wallet info if connected */}
            <button
              title="Toggle Theme"
              className="p-1 sm:p-1.5 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors duration-200"
            >
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}

        {/* Theme Toggle - Visible when NOT connected (if desired) */}
        {!isConnected && (
          <button
            title="Toggle Theme"
            className="p-1.5 ml-2 sm:ml-3 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors duration-200"
          >
            <Moon className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        )}
      </div>
    </nav>
  );
};

export default MarketplaceNavbar;