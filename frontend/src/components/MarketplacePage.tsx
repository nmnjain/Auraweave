
import React, { useState, useEffect, useCallback } from 'react';
import { ethers, BrowserProvider, Eip1193Provider, Contract, Signer, Network } from 'ethers';
import MarketplaceNavbar from './MarketplaceNavbar';
import PurchaseProgressModal from './PurchaseProgressModal';
import Footer from './Footer';

import deploymentData from '../config/sepolia.json';

const SEPOLIA_CHAIN_ID_NUM = 11155111;
const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';
const SEPOLIA_NETWORK_NAME = 'Sepolia Testnet';

const METAMASK_SETUP_NOTION_URL = "https://heathered-gargoyle-058.notion.site/MetaMask-Setup-Guide-for-Auraweave-20d84b3aa07f80eaa12dc38069263487?source=copy_link";

const FAUCET_API_URL = "https://auraweave.onrender.com/request-tokens";

const DATA_REGISTRY_ADDRESS = deploymentData.DataRegistry.address;
const DATA_REGISTRY_ABI = deploymentData.DataRegistry.abi;
const MOCK_ERC20_ADDRESS = deploymentData.MockERC20.address;
const MOCK_ERC20_ABI = deploymentData.MockERC20.abi;

const IPFS_GATEWAYS = [
    "https://cloudflare-ipfs.com/ipfs/",
    "https://ipfs.io/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
];
interface DataListing {
    id: bigint; seller: string; name: string; description: string;
    dataCID: string; metadataCID: string; price: bigint; active: boolean;
}

interface PurchasedDataItem {
    listingId: string; name: string; dataCID: string; metadataCID?: string;
    purchaseTimestamp: number; transactionHash: string;
}

declare global {
    interface Window {
        ethereum?: Eip1193Provider & {
            isMetaMask?: boolean;
            request: (...args: any[]) => Promise<any>;
            on: (event: string, listener: (...args: any[]) => void) => void;
            removeListener?: (event: string, listener: (...args: any[]) => void) => void;
            off?: (event: string, listener: (...args: any[]) => void) => void;
        };
    }
}

const MarketplacePage: React.FC = () => {
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
    const [downloadingCID, setDownloadingCID] = useState<string | null>(null);
    const [signer, setSigner] = useState<Signer | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [network, setNetwork] = useState<Network | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [isLoadingEagerConnection, setIsLoadingEagerConnection] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isWrongNetwork, setIsWrongNetwork] = useState<boolean>(false);
    const [showConnectPromptCentered, setShowConnectPromptCentered] = useState<boolean>(true);

     const [isRequestingTokens, setIsRequestingTokens] = useState<boolean>(false);
    const [faucetMessage, setFaucetMessage] = useState<string>(''); 

    const [listings, setListings] = useState<DataListing[]>([]);
    const [isLoadingListings, setIsLoadingListings] = useState<boolean>(false);
    const [fetchListingsError, setFetchListingsError] = useState<string>('');
    const [hasFetchedListingsInitial, setHasFetchedListingsInitial] = useState<boolean>(false);


    const [purchasedDataItems, setPurchasedDataItems] = useState<PurchasedDataItem[]>([]);
    const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
    const [purchaseStep, setPurchaseStep] = useState<number>(0);
    const [currentPurchaseListing, setCurrentPurchaseListing] = useState<DataListing | null>(null);
    const [purchaseTxHashes, setPurchaseTxHashes] = useState<{ approve?: string; purchase?: string }>({});
    const [modalErrorMessage, setModalErrorMessage] = useState<string>('');

    const disconnectWallet = useCallback(() => {
        setProvider(null); setSigner(null); setAccount(null); setNetwork(null);
        setIsConnected(false); setShowConnectPromptCentered(true);
        setErrorMessage(''); setIsWrongNetwork(false);
        setListings([]); setFetchListingsError(''); setPurchasedDataItems([]);
        setHasFetchedListingsInitial(false);
        localStorage.removeItem('auraweave_wallet_connected');
        console.log("Wallet disconnected.");
    }, []);

        const handleRequestTestTokens = useCallback(async () => {
        if (!account) { // Check if a wallet account is connected
            setFaucetMessage("Please connect your wallet first to request tokens.");
            alert("Please connect your wallet first to request tokens.");
            return;
        }
        if (!FAUCET_API_URL) {
            setFaucetMessage("Faucet API URL is not configured.");
            alert("Faucet API URL is not configured.");
            return;
        }

        setIsRequestingTokens(true);
        setFaucetMessage('Requesting test MUSDC from faucet...');
        console.log(`Requesting MUSDC for account: ${account} from ${FAUCET_API_URL}`);

        try {
            const response = await fetch(FAUCET_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    
                },
                body: JSON.stringify({ address: account }), 
            });

            const data = await response.json(); 

            if (response.ok) {
                console.log("Faucet response OK:", data);
                const successMsg = `Faucet: ${data.message || 'Tokens sent!'}. Tx: ${data.transactionHash ? data.transactionHash.substring(0, 10) + '...' : 'N/A'}`;
                setFaucetMessage(successMsg);
                alert(successMsg);
            } else {
                console.error("Faucet response NOT OK:", response.status, data);
                const errorMsg = `Faucet Error: ${data.error || response.statusText || 'Failed to request tokens.'}`;
                setFaucetMessage(errorMsg);
                alert(errorMsg);
            }
        } catch (error: any) {
            console.error("Error requesting test tokens (fetch failed):", error);
            const networkErrorMsg = `Faucet Error: ${error.message || 'Network error or faucet unavailable.'}`;
            setFaucetMessage(networkErrorMsg);
            alert(networkErrorMsg);
        } finally {
            setIsRequestingTokens(false);
        }
    }, [account]); // Dependency is `account`

    const fetchListings = useCallback(async (currentProvider: BrowserProvider) => {
        if (!currentProvider) {
            console.log("fetchListings: No provider available.");
            setIsLoadingListings(false); return;
        }
        console.log("Fetching listings...");
        setIsLoadingListings(true); setFetchListingsError('');
        try {
            const contract = new Contract(DATA_REGISTRY_ADDRESS, DATA_REGISTRY_ABI, currentProvider);
            const rawListings: any[] = await contract.getActiveListingsDetails(20, 0);
            const formatted: DataListing[] = rawListings.map(l => ({
                id: BigInt(l.id), seller: l.seller, name: l.name, description: l.description,
                dataCID: l.dataCID, metadataCID: l.metadataCID, price: BigInt(l.price), active: l.active,
            }));
            setListings(formatted);
        } catch (e: any) {
            console.error("Error fetching listings:", e);
            setFetchListingsError(e.message || "Failed to fetch listings."); setListings([]);
        } finally {
            setIsLoadingListings(false);
        }
    }, []);

    const updateConnectionState = useCallback(async (browserProvider: BrowserProvider) => {
        console.log("Attempting to update connection state...");
        try {
            const accounts = await browserProvider.send("eth_accounts", []);
            if (accounts.length > 0) {
                const currentSigner = await browserProvider.getSigner();
                const currentAccount = await currentSigner.getAddress();
                const currentNetwork = await browserProvider.getNetwork();

                setProvider(browserProvider); setSigner(currentSigner); setAccount(currentAccount);
                setNetwork(currentNetwork); setIsConnected(true); setShowConnectPromptCentered(false);
                localStorage.setItem('auraweave_wallet_connected', 'true');
                setErrorMessage('');

                if (currentNetwork.chainId !== BigInt(SEPOLIA_CHAIN_ID_NUM)) {
                    setIsWrongNetwork(true); setListings([]); setErrorMessage(`Please switch to ${SEPOLIA_NETWORK_NAME}.`);
                } else {
                    setIsWrongNetwork(false);
                    if (!hasFetchedListingsInitial) {
                        fetchListings(browserProvider);
                        setHasFetchedListingsInitial(true);
                    }
                }
            } else {
                console.log("No accounts found, disconnecting.");
                disconnectWallet();
            }
        } catch (error) {
            console.error("Error in updateConnectionState:", error);
            disconnectWallet();
        }
    }, [disconnectWallet, fetchListings, hasFetchedListingsInitial]);


    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            alert('MetaMask is not installed!'); setIsLoadingEagerConnection(false); return;
        }
        setIsConnecting(true); setErrorMessage('');
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            await updateConnectionState(browserProvider);
        } catch (error: any) {
            setErrorMessage(error.message || 'Connection rejected.'); disconnectWallet();
        } finally {
            setIsConnecting(false); setIsLoadingEagerConnection(false);
        }
    }, [updateConnectionState, disconnectWallet]);

    const switchNetwork = useCallback(async () => {
        if (!window.ethereum) return;
        try {
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }] });
        } catch (switchError: any) {
            setErrorMessage(switchError.message || 'Failed to switch network.');
        }
    }, []);

    useEffect(() => { // Eager Connect
        setIsLoadingEagerConnection(true);
        const previouslyConnected = localStorage.getItem('auraweave_wallet_connected') === 'true';
        if (previouslyConnected && window.ethereum) {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            updateConnectionState(browserProvider).finally(() => setIsLoadingEagerConnection(false));
        } else {
            setIsLoadingEagerConnection(false);
            setShowConnectPromptCentered(true);
        }
    }, [updateConnectionState]);

    useEffect(() => {
        if (window.ethereum) {
            const eth = window.ethereum;
            const providerForListeners = new ethers.BrowserProvider(eth);

            const handleAccountsChanged = (accounts: string[]) => {
                console.log("Wallet accounts changed:", accounts);
                updateConnectionState(providerForListeners);
            };
            const handleChainChanged = (_chainId: string) => {
                console.log("Wallet chain changed to:", _chainId);
                setHasFetchedListingsInitial(false);
                updateConnectionState(providerForListeners);
            };

            eth.on('accountsChanged', handleAccountsChanged);
            eth.on('chainChanged', handleChainChanged);
            return () => {
                eth.removeListener?.('accountsChanged', handleAccountsChanged);
                eth.removeListener?.('chainChanged', handleChainChanged);
            };
        }
    }, [updateConnectionState]);

    useEffect(() => {
        if (account) {
            const stored = localStorage.getItem(`auraweave_purchased_${account}`);
            if (stored) setPurchasedDataItems(JSON.parse(stored));
            else setPurchasedDataItems([]);
        } else {
            setPurchasedDataItems([]);
        }
    }, [account]);

    const handlePurchase = useCallback(async (listing: DataListing) => {
        if (!signer || !account) { alert("Wallet not connected."); return; }
        if (listing.seller.toLowerCase() === account.toLowerCase()) { alert("Cannot purchase own listing."); return; }

        setCurrentPurchaseListing(listing); setShowPurchaseModal(true);
        setPurchaseStep(0); setPurchaseTxHashes({}); setModalErrorMessage('');

        try {
            const dataRegistry = new Contract(DATA_REGISTRY_ADDRESS, DATA_REGISTRY_ABI, signer);
            const mockUsdc = new Contract(MOCK_ERC20_ADDRESS, MOCK_ERC20_ABI, signer);

            setPurchaseStep(1);
            const approveTx = await mockUsdc.approve(DATA_REGISTRY_ADDRESS, listing.price);
            setPurchaseTxHashes(prev => ({ ...prev, approve: approveTx.hash }));
            await approveTx.wait();
            setPurchaseStep(2);

            setPurchaseStep(3);
            const purchaseTx = await dataRegistry.purchaseData(listing.id);
            setPurchaseTxHashes(prev => ({ ...prev, purchase: purchaseTx.hash }));
            await purchaseTx.wait();

            const newItem: PurchasedDataItem = {
                listingId: listing.id.toString(), name: listing.name, dataCID: listing.dataCID,
                metadataCID: listing.metadataCID, purchaseTimestamp: Date.now(), transactionHash: purchaseTx.hash,
            };
            const currentItems = JSON.parse(localStorage.getItem(`auraweave_purchased_${account}`) || '[]');
            const existingIdx = currentItems.findIndex((item: PurchasedDataItem) => item.listingId === newItem.listingId);
            if (existingIdx > -1) currentItems[existingIdx] = newItem; else currentItems.push(newItem);
            localStorage.setItem(`auraweave_purchased_${account}`, JSON.stringify(currentItems));
            setPurchasedDataItems(currentItems);

            setPurchaseStep(4);
            if (provider) fetchListings(provider);
        } catch (e: any) {
            const reason = e?.reason || e?.data?.message || e?.message || "Transaction failed.";
            setModalErrorMessage(reason); setPurchaseStep(5); // Error
        }
    }, [signer, account, provider, fetchListings]);

    const performActualDownload = async (cid: string) => {
        console.log(`Starting download for CID ${cid}...`);

        let lastError = null;

        for (const gateway of IPFS_GATEWAYS) {
            const url = `${gateway}${cid}`;
            console.log(`Trying to download from gateway: ${url}`);

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const blob = await response.blob();
                const urlBlob = window.URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = urlBlob;
                a.download = cid;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(urlBlob);

                console.log(`✅ Download succeeded from ${gateway}`);
                return;
            } catch (error) {
                console.warn(`⚠️ Download failed from ${gateway}:`, error);
                lastError = error;
            }
        }


        console.error(`❌ Download failed for CID ${cid} in performActualDownload:`, lastError);
    };

    const handleDownloadClick = useCallback(async (cid: string, filenamePrefix: string) => {
        if (!cid) {
            alert("No CID provided to download click handler.");
            return;
        }
        if (downloadingCID === cid) {
            return;
        }

        setDownloadingCID(cid);
        try {
            await performActualDownload(cid, filenamePrefix);
        } catch (e) {

            console.error("Error during download process triggered by handleDownloadClick:", e);
        } finally {
            setDownloadingCID(null);
        }
    }, [downloadingCID, performActualDownload]);


    // --- JSX ---
    const backgroundImageUrl = '/marketplace1.jpg';

    if (isLoadingEagerConnection) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <p className="text-xl text-purple-400 animate-pulse">Loading Auraweave Marketplace...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative text-white flex flex-col items-center pt-24 sm:pt-28 p-4 isolate bg-cover bg-center bg-no-repeat bg-fixed"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md -z-10"></div> {/* Darker overlay for depth */}

            <MarketplaceNavbar
                isConnected={isConnected} account={account} networkName={network?.name}
                isWrongNetwork={isWrongNetwork} onSwitchNetwork={switchNetwork}
                onDisconnectWallet={disconnectWallet} onRequestTestTokens={handleRequestTestTokens} // Pass the new handler
                isRequestingTokens={isRequestingTokens} 
            />

            {(!isConnected && showConnectPromptCentered) && (
                <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
                    <div className="bg-slate-800/90 backdrop-blur-lg p-8 md:p-12 rounded-xl shadow-2xl shadow-purple-500/30 text-center max-w-md border border-slate-700">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-purple-400">Auraweave</h1>
                        <p className="text-slate-300 mb-8 text-lg">Connect your wallet to access the A2A Data Marketplace.</p>
                        <button onClick={connectWallet} disabled={isConnecting}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors">
                            {isConnecting ? 'Connecting...' : 'Connect Wallet'} <span className="ml-2 text-xl">+</span>
                        </button>
                        {errorMessage && <p className="mt-4 text-red-400 text-sm">{errorMessage}</p>}
                        <p className="mt-6 text-xs text-slate-400">
                            New to Web3 or MetaMask?{' '}
                            <a
                                href={METAMASK_SETUP_NOTION_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 underline"
                            >
                                Get Started Here
                            </a>
                        </p>
                    </div>

                </div>
            )}


            {isConnected && (
                <main className="w-full max-w-6xl mx-auto mt-4 z-10 flex-grow">
                    {isWrongNetwork ? (
                        <div className="text-center p-8 bg-slate-800/90 backdrop-blur-md rounded-xl shadow-xl mt-10 max-w-lg mx-auto border border-orange-500/30">
                            <h2 className="text-2xl font-bold text-orange-400 mb-4">Incorrect Network</h2>
                            <p className="text-slate-300 mb-6">Please switch MetaMask to <strong>{SEPOLIA_NETWORK_NAME}</strong>.</p>
                            <button onClick={switchNetwork}
                                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors">
                                Switch to {SEPOLIA_NETWORK_NAME}
                            </button>
                            <p className="mt-6 text-xs text-slate-400">
                                New to Web3 or MetaMask?{' '}
                                <a
                                    href={METAMASK_SETUP_NOTION_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-400 hover:text-purple-300 underline"
                                >
                                    Get Started Here
                                </a>
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Available Data Section */}
                            <div className="mb-12">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-3xl font-bold text-white">Available Data</h2>
                                    <button onClick={() => fetchListings(provider!)} disabled={isLoadingListings || !provider}
                                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors">
                                        {isLoadingListings ? 'Refreshing...' : 'Refresh'}
                                    </button>
                                </div>
                                {isLoadingListings && <p className="text-center text-purple-300">Loading listings...</p>}
                                {fetchListingsError && <p className="text-center text-red-400">{fetchListingsError}</p>}
                                {!isLoadingListings && !fetchListingsError && listings.length === 0 && <p className="text-center text-slate-400">No listings found.</p>}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {listings.map((listing) => {
                                        if (listing.name.includes("Lab Beta")) {
                                            console.log("CSV Listing Object:", listing);
                                        }
                                        return (
                                            <div key={listing.id.toString()} className="bg-slate-800/70 backdrop-blur-sm p-5 rounded-xl shadow-lg flex flex-col justify-between border border-slate-700">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-purple-300 mb-2 truncate">{listing.name}</h3>
                                                    <p className="text-slate-300 text-sm mb-2 h-12 line-clamp-2">{listing.description}</p>
                                                    <p className="text-xs text-slate-400 mb-3">Price: <span className="font-bold text-yellow-400">{ethers.formatUnits(listing.price, 18)} MUSDC</span></p>
                                                </div>
                                                <button onClick={() => handlePurchase(listing)}
                                                    disabled={!signer || isPurchasing === listing.id.toString() || listing.seller.toLowerCase() === account?.toLowerCase()}
                                                    className={`w-full mt-3 font-semibold py-2.5 px-4 rounded-xl transition-colors ${listing.seller.toLowerCase() === account?.toLowerCase()
                                                        ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                                                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                                                        }`}>
                                                    {isPurchasing === listing.id.toString()
                                                        ? 'Processing...'
                                                        : (listing.seller.toLowerCase() === account?.toLowerCase() ? "Your Listing" : "Purchase")}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Acquired Data Section */}
                            {purchasedDataItems.length > 0 && (
                                <div className="mt-16 w-full">
                                    <h2 className="text-3xl font-bold text-white text-center mb-6">Your Acquired Data</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {purchasedDataItems.slice().reverse().map((item) => (
                                            <div key={item.listingId} className="bg-slate-700/70 backdrop-blur-sm p-5 rounded-xl shadow-lg flex flex-col border border-slate-600">
                                                <h3 className="text-lg font-semibold text-teal-300 mb-2 truncate">{item.name}</h3>
                                                <p className="text-xs text-slate-400 mb-1">Purchased: {new Date(item.purchaseTimestamp).toLocaleDateString()}</p>
                                                <a href={`https://sepolia.etherscan.io/tx/${item.transactionHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:underline mb-3">View Purchase Tx</a>
                                                <div className="mt-auto">
                                                    <button
                                                        onClick={() => handleDownloadClick(item.dataCID, item.name)}
                                                        disabled={downloadingCID === item.dataCID || !item.dataCID}
                                                        className="w-full mt-auto bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-colors disabled:opacity-70 disabled:cursor-wait"
                                                    >
                                                        {downloadingCID === item.dataCID ? (
                                                            <>
                                                                <svg className="animate-spin h-4 w-4 mr-2 inline" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Downloading...
                                                            </>
                                                        ) : (
                                                            "Download Data"
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            )}

            <PurchaseProgressModal
                isOpen={showPurchaseModal}
                onClose={() => { setShowPurchaseModal(false); if (purchaseStep !== 4 && purchaseStep !== 5) setPurchaseStep(0); }}
                step={purchaseStep}
                listingName={currentPurchaseListing?.name}
                listingPrice={currentPurchaseListing ? `${ethers.formatUnits(currentPurchaseListing.price, 18)} MUSDC` : undefined}
                dataCID={purchaseStep === 4 ? currentPurchaseListing?.dataCID : undefined}
                metadataCID={purchaseStep === 4 ? currentPurchaseListing?.metadataCID : undefined}
                txHashes={purchaseTxHashes}
                errorMessage={purchaseStep === 5 ? modalErrorMessage : undefined}
                ipfsGatewayUrl={IPFS_GATEWAYS}
            />
            <div className="mt-20"></div> 
            <Footer />
        </div>
    );
}


export default MarketplacePage;

