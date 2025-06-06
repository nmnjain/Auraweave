import React, { useState, useEffect, useCallback } from 'react';
import { ethers, BrowserProvider, Eip1193Provider, Contract, Signer } from 'ethers';
import PurchaseProgressModal from './PurchaseProgressModal';
import MarketplaceNavbar from './MarketplaceNavbar';
import deploymentData from '../config/sepolia.json';

const SEPOLIA_CHAIN_ID_NUM = 11155111;
const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';
const SEPOLIA_NETWORK_NAME = 'Sepolia Testnet';
const DATA_REGISTRY_ADDRESS = deploymentData.DataRegistry.address;
const DATA_REGISTRY_ABI = deploymentData.DataRegistry.abi;
const MOCK_ERC20_ADDRESS = deploymentData.MockERC20.address;
const MOCK_ERC20_ABI = deploymentData.MockERC20.abi;

interface DataListing {
    id: bigint; seller: string; name: string; description: string;
    dataCID: string; metadataCID: string; price: bigint; active: boolean;
}

declare global {
    interface Window { ethereum?: Eip1193Provider; }
}

const MarketplacePage: React.FC = () => {
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [signer, setSigner] = useState<Signer | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
    const [purchaseStep, setPurchaseStep] = useState<number>(0);
    const [currentPurchaseListing, setCurrentPurchaseListing] = useState<DataListing | null>(null);
    const [purchaseTxHashes, setPurchaseTxHashes] = useState<{ approve?: string, purchase?: string }>({});
    const [modalErrorMessage, setModalErrorMessage] = useState<string>('');
    const [network, setNetwork] = useState<ethers.Network | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [isLoadingEagerConnection, setIsLoadingEagerConnection] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isWrongNetwork, setIsWrongNetwork] = useState<boolean>(false);
    const [showConnectPromptCentered, setShowConnectPromptCentered] = useState(true);
    const [hasFetchedListings, setHasFetchedListings] = useState(false);

    const [listings, setListings] = useState<DataListing[]>([]);
    const [isLoadingListings, setIsLoadingListings] = useState<boolean>(false);
    const [fetchListingsError, setFetchListingsError] = useState<string>('');

    const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
    const [purchaseMessage, setPurchaseMessage] = useState<string>('');

    const disconnectWallet = useCallback(() => {
        setProvider(null); setSigner(null); setAccount(null); setNetwork(null);
        setIsConnected(false); setShowConnectPromptCentered(true);
        setErrorMessage(''); setIsWrongNetwork(false);
        setListings([]); setFetchListingsError('');
        setHasFetchedListings(false);
        localStorage.removeItem('auraweave_wallet_connected');
        console.log("Wallet disconnected.");
    }, []);

    const fetchListings = useCallback(async () => {
        if (!provider || !DATA_REGISTRY_ADDRESS || !DATA_REGISTRY_ABI) {
            setFetchListingsError("Cannot fetch listings: Provider or contract info missing.");
            setIsLoadingListings(false);
            return;
        }
        if (isWrongNetwork) {
            setFetchListingsError("Cannot fetch listings: Please connect to Sepolia Testnet.");
            setIsLoadingListings(false);
            return;
        }

        console.log("Fetching listings using state provider...");
        setIsLoadingListings(true); setFetchListingsError('');
        try {
            const contract = new ethers.Contract(DATA_REGISTRY_ADDRESS, DATA_REGISTRY_ABI, provider);
            const rawListings: any[] = await contract.getActiveListingsDetails(20, 0);
            const formattedListings: DataListing[] = rawListings.map(l => ({
                id: BigInt(l.id), seller: l.seller, name: l.name, description: l.description,
                dataCID: l.dataCID, metadataCID: l.metadataCID, price: BigInt(l.price), active: l.active,
            }));
            setListings(formattedListings);
        } catch (error: any) {
            console.error("Error fetching listings:", error);
            const readableError = error.reason || error.message || (error.error?.message) || 'Unknown error fetching listings.';
            setFetchListingsError(`Failed to fetch: ${readableError} (code: ${error.code})`);
            setListings([]);
        } finally {
            setIsLoadingListings(false);
        }
    }, [provider, isWrongNetwork]);

    const updateConnectionState = useCallback(async (browserProvider: BrowserProvider) => {
        console.log("Updating connection state...");
        try {
            const signers = await browserProvider.listAccounts();
            if (signers.length > 0 && signers[0]) {
                const currentSigner = signers[0];
                const currentAccount = await currentSigner.getAddress();
                const currentNetwork = await browserProvider.getNetwork();

                setProvider(browserProvider);
                setSigner(currentSigner);
                setAccount(currentAccount);
                setNetwork(currentNetwork);
                setIsConnected(true);
                setShowConnectPromptCentered(false);
                localStorage.setItem('auraweave_wallet_connected', 'true');
                setErrorMessage('');

                if (currentNetwork.chainId !== BigInt(SEPOLIA_CHAIN_ID_NUM)) {
                    setErrorMessage(`Please switch to ${SEPOLIA_NETWORK_NAME}.`);
                    setIsWrongNetwork(true);
                    setListings([]);
                } else {
                    setIsWrongNetwork(false);

                }
            } else {
                console.log("updateConnectionState: No accounts from listAccounts, disconnecting.");
                disconnectWallet();
            }
        } catch (error) {
            console.error("Error in updateConnectionState:", error);
            disconnectWallet();
        }
    }, [disconnectWallet, fetchListings]);

    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            alert('MetaMask is not installed.'); setIsLoadingEagerConnection(false); return;
        }
        setIsConnecting(true); setErrorMessage('');
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            await updateConnectionState(browserProvider);
        } catch (error: any) {
            setErrorMessage(error.message || 'Connection rejected.');
            disconnectWallet();
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

    useEffect(() => {
        console.log("MarketplacePage mounted, attempting eager connect...");
        setIsLoadingEagerConnection(true);
        const previouslyConnected = localStorage.getItem('auraweave_wallet_connected') === 'true';

        if (previouslyConnected && window.ethereum) {
            console.log("Eager connect: Found 'previouslyConnected' flag and window.ethereum.");
            const browserProvider = new ethers.BrowserProvider(window.ethereum);

            browserProvider.listAccounts().then(async (accounts) => {
                console.log("Eager connect: listAccounts returned:", accounts);
                if (accounts.length > 0 && accounts[0]) {
                    console.log("Eager connect: Accounts found, calling updateConnectionState.");
                    await updateConnectionState(browserProvider);
                } else {
                    console.log("Eager connect: No accounts found by listAccounts, clearing flag.");
                    localStorage.removeItem('auraweave_wallet_connected');
                    setIsConnected(false);
                    setShowConnectPromptCentered(true);
                }
            }).catch((error) => {
                console.error("Eager connect: Error listing accounts:", error);
                localStorage.removeItem('auraweave_wallet_connected');
                setIsConnected(false);
                setShowConnectPromptCentered(true);
            }).finally(() => {
                console.log("Eager connect: listAccounts promise finally block.");
                setIsLoadingEagerConnection(false);
            });
        } else {
            if (!previouslyConnected) console.log("Eager connect: No 'previouslyConnected' flag.");
            if (!window.ethereum) console.log("Eager connect: No window.ethereum provider.");
            setIsLoadingEagerConnection(false);
            setShowConnectPromptCentered(true);
        }
    }, [updateConnectionState, disconnectWallet]);

    useEffect(() => {
        if (isConnected && !isWrongNetwork && provider && !hasFetchedListings) {
            console.log("Auto-fetching listings once...");
            fetchListings();
            setHasFetchedListings(true);
        }
    }, [isConnected, isWrongNetwork, provider, hasFetchedListings, fetchListings]);

    useEffect(() => {
        if (window.ethereum) {
            const providerInstanceForEvents = new ethers.BrowserProvider(window.ethereum);

            const handleAccountsChanged = (accounts: string[]) => {
                console.log("Wallet accounts changed:", accounts);
                updateConnectionState(providerInstanceForEvents);
            };
            const handleChainChanged = (_chainId: string) => {
                console.log("Wallet chain changed to:", _chainId);
                updateConnectionState(providerInstanceForEvents);
            };

            const ethProvider = window.ethereum as any;

            ethProvider.on('accountsChanged', handleAccountsChanged);
            ethProvider.on('chainChanged', handleChainChanged);

            return () => {
                ethProvider.removeListener('accountsChanged', handleAccountsChanged);
                ethProvider.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, [updateConnectionState]);

    const handlePurchase = useCallback(async (listing: DataListing) => {
        if (!signer || !account || !DATA_REGISTRY_ADDRESS || !MOCK_ERC20_ADDRESS || !DATA_REGISTRY_ABI || !MOCK_ERC20_ABI) {
            alert("Wallet not connected or contract info missing."); return;
        }
        if (listing.seller.toLowerCase() === account.toLowerCase()) {
            alert("You cannot purchase your own listing."); return;
        }

        setCurrentPurchaseListing(listing);
        setShowPurchaseModal(true);
        setPurchaseStep(0);
        setPurchaseTxHashes({});
        setModalErrorMessage('');

        try {
            const dataRegistryContract = new Contract(DATA_REGISTRY_ADDRESS, DATA_REGISTRY_ABI, signer);
            const mockUsdcContract = new Contract(MOCK_ERC20_ADDRESS, MOCK_ERC20_ABI, signer);

            setPurchaseStep(1);
            const approveTx = await mockUsdcContract.approve(DATA_REGISTRY_ADDRESS, listing.price);
            setPurchaseTxHashes(prev => ({ ...prev, approve: approveTx.hash }));
            console.log("Approval transaction sent:", approveTx.hash);
            await approveTx.wait();
            console.log("Approval transaction successful:", approveTx.hash);
            setPurchaseStep(2);

            setPurchaseStep(3);
            const purchaseTx = await dataRegistryContract.purchaseData(listing.id);
            setPurchaseTxHashes(prev => ({ ...prev, purchase: purchaseTx.hash }));
            console.log("Purchase transaction sent:", purchaseTx.hash);
            await purchaseTx.wait();
            console.log("Purchase transaction successful:", purchaseTx.hash);

            setPurchaseStep(4);
            setModalErrorMessage('');
            fetchListings(provider!);

        } catch (error: any) {
            console.error("Purchase error:", error);
            const reason = error?.reason || error?.data?.message || error?.message || "Transaction failed.";
            setModalErrorMessage(`Purchase failed: ${reason}`);
            setPurchaseStep(5);
        }

    }, [signer, account, provider, fetchListings]);


    if (isLoadingEagerConnection && !isConnected) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black text-white flex flex-col items-center justify-center p-4">
                <p className="text-xl text-purple-400">Loading Auraweave Marketplace...</p>

            </div>
        );
    }
    return (
        <div
            className="min-h-screen relative text-white flex flex-col items-center pt-28 p-4 overflow-hidden"
            style={{
                backgroundImage: `url('/marketplace1.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
            }}
        >

            <div className="absolute inset-0 bg-black/50 backdrop-blur-2xl z-[-1]"></div>


            <div className="relative z-10 w-full flex flex-col items-center">
                <MarketplaceNavbar
                    isConnected={isConnected}
                    account={account}
                    networkName={network?.name}
                    isWrongNetwork={isWrongNetwork}
                    onSwitchNetwork={switchNetwork}
                    onDisconnectWallet={disconnectWallet}
                />


                <div
                    className={`
                    fixed inset-0 flex items-center justify-center transition-all duration-700 ease-in-out z-30
                    ${(showConnectPromptCentered && !isConnected && !isConnecting) ? 'opacity-100 scale-100' : 'opacity-0 scale-90 -translate-y-full'}
                `}
                    style={{ pointerEvents: (showConnectPromptCentered && !isConnected) ? 'auto' : 'none' }}
                >
                    {!isConnected && (
                        <div className="bg-slate-800/90 p-8 md:p-12 rounded-xl shadow-2xl shadow-purple-500/30 text-center max-w-md">
                            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-purple-400">Auraweave Marketplace</h1>
                            <p className="text-slate-300 mb-8 text-lg">
                                Connect your wallet to explore the decentralized data economy for AI agents.
                            </p>
                            <button
                                onClick={connectWallet}
                                disabled={isConnecting}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50"
                            >
                                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                                <span className="ml-3 text-2xl">+</span>
                            </button>
                            {errorMessage && <p className="mt-4 text-red-400 text-sm">{errorMessage}</p>}
                            {isWrongNetwork && provider && (
                                <button
                                    onClick={switchNetwork}
                                    className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                >
                                    Switch to {SEPOLIA_NETWORK_NAME}
                                </button>
                            )}
                        </div>
                    )}
                </div>


                <div className="
    w-full max-w-5xl mx-auto mt-0 flex-grow flex flex-col items-center justify-start
    transition-opacity duration-700 ease-in-out z-10
">
                    {isConnected && !isWrongNetwork && (
                        <div className="w-full pt-8">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-4xl font-extrabold text-white text-center drop-shadow-2xl">
                                    Available Data Listings
                                </h2>

                                <button
                                    onClick={fetchListings} 
                                    disabled={isLoadingListings || !provider} 
                                    className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoadingListings ? (
                                        <svg className="animate-spin h-5 w-5 mr-2 inline" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : null}
                                    {isLoadingListings ? 'Refreshing...' : 'Refresh'}
                                </button>


                            </div>

                            {isLoadingListings && <p className="text-center text-purple-300">Loading listings...</p>}
                            {!isLoadingListings && fetchListingsError && <p className="text-center text-red-400">{fetchListingsError}</p>}
                            {!isLoadingListings && !fetchListingsError && listings.length === 0 && (
                                <p className="text-center text-slate-400">No data listings found on {SEPOLIA_NETWORK_NAME}.</p>
                            )}

                            {!isLoadingListings && !fetchListingsError && listings.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {listings.map((listing) => (
                                        <div
                                            key={listing.id.toString()}
                                            className="
                                bg-white/10 backdrop-blur-md border border-purple-500/50 p-6 rounded-2xl
                                shadow-xl hover:shadow-purple-500/50 transition-transform transform hover:scale-105 duration-300
                            "
                                        >
                                            <h3
                                                className="text-lg font-bold text-purple-300 mb-2 truncate"
                                                title={listing.name}
                                            >
                                                {listing.name}
                                            </h3>

                                            <p
                                                className="text-slate-200 text-sm mb-2 h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800"
                                                title={listing.description}
                                            >
                                                {listing.description}
                                            </p>

                                            <p
                                                className="text-slate-400 text-xs mb-1 truncate"
                                                title={listing.dataCID}
                                            >
                                                Data CID: {listing.dataCID.substring(0, 10)}...
                                            </p>

                                            <p
                                                className="text-slate-400 text-xs mb-3 truncate"
                                                title={listing.metadataCID}
                                            >
                                                Metadata CID: {listing.metadataCID.substring(0, 10)}...
                                            </p>

                                            <p className="text-lg font-bold text-yellow-400 mb-4">
                                                {ethers.formatUnits(listing.price, 18)} MUSDC
                                            </p>

                                            <button
                                                onClick={() => handlePurchase(listing)}
                                                disabled={
                                                    !signer || listing.seller.toLowerCase() === account?.toLowerCase()
                                                }
                                                className="
                                    w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700
                                    text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-300
                                    disabled:bg-slate-600 disabled:cursor-not-allowed
                                "
                                            >
                                                {listing.seller.toLowerCase() === account?.toLowerCase()
                                                    ? "Your Listing"
                                                    : "Purchase"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}


                    <PurchaseProgressModal
                        isOpen={showPurchaseModal}
                        onClose={() => {
                            setShowPurchaseModal(false);
                            if (purchaseStep !== 4 && purchaseStep !== 5) setPurchaseStep(0);
                        }}
                        step={purchaseStep}
                        listingName={currentPurchaseListing?.name}
                        listingPrice={currentPurchaseListing ? `${ethers.formatUnits(currentPurchaseListing.price, 18)} MUSDC` : undefined}
                        dataCID={purchaseStep === 4 ? currentPurchaseListing?.dataCID : undefined}
                        metadataCID={purchaseStep === 4 ? currentPurchaseListing?.metadataCID : undefined}
                        txHashes={purchaseTxHashes}
                        errorMessage={purchaseStep === 5 ? modalErrorMessage : undefined}
                    />


                    {isConnected && isWrongNetwork && (
                        <div className="text-center p-8 bg-slate-800/90 backdrop-blur-md rounded-lg shadow-xl mt-16 max-w-lg mx-auto">
                            <h2 className="text-2xl font-bold text-orange-400 mb-4">Incorrect Network</h2>
                            <p className="text-slate-300 mb-6">
                                Please switch MetaMask to the <strong>{SEPOLIA_NETWORK_NAME}</strong> to interact with Auraweave.
                            </p>
                            <button
                                onClick={switchNetwork}
                                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105"
                            >
                                Switch to {SEPOLIA_NETWORK_NAME}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );

};
export default MarketplacePage;