

import React from 'react';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface PurchaseProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: number;
    listingName?: string;
    listingPrice?: string;
    dataCID?: string;
    metadataCID?: string;
    txHashes?: { approve?: string; purchase?: string };
    errorMessage?: string;
    ipfsGatewayUrl: string[];
}

const StepIndicator: React.FC<{ currentStep: number; targetStep: number; title: string; description: string; txHash?: string }> = ({
    currentStep,
    targetStep,
    title,
    description,
    txHash,
}) => {
    const isActive = currentStep === targetStep;
    const isCompleted = currentStep > targetStep;
    const isUpcoming = currentStep < targetStep;

    return (
        <div
            className={`mb-4 p-3 rounded-lg transition-all duration-300 border-l-4 ${isActive
                ? 'bg-purple-700/20 border-purple-500'
                : isCompleted
                    ? 'bg-green-700/20 border-green-500/70'
                    : 'bg-slate-700 border-slate-600'
                }`}
        >
            <div className="flex items-center mb-1">
                {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-purple-400 mr-3 animate-spin flex-shrink-0" />
                ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-600 mr-3 flex-shrink-0 border-2 border-slate-500"></div>
                )}
                <h4
                    className={`font-semibold ${isCompleted
                        ? 'text-green-300'
                        : isActive
                            ? 'text-purple-300'
                            : 'text-slate-400'
                        }`}
                >
                    {title}
                </h4>
            </div>
            <p className="text-xs text-slate-400 ml-8">{description}</p>
            {txHash && isCompleted && (
                <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300 underline ml-8 mt-1 inline-block"
                >
                    View on Etherscan
                </a>
            )}
        </div>
    );
};

const PurchaseProgressModal: React.FC<PurchaseProgressModalProps> = ({
    isOpen,
    onClose,
    step,
    listingName,
    listingPrice,
    dataCID,
    metadataCID,
    txHashes,
    errorMessage,
    ipfsGatewayUrl,
}) => {
    if (!isOpen) return null;

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                alert(`${type} copied to clipboard!`);
            })
            .catch((err) => {
                console.error('Failed to copy text: ', err);
                alert(`Failed to copy ${type}.`);
            });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-slate-900 p-6 md:p-8 rounded-xl shadow-xl w-full max-w-md relative border border-slate-700">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                    aria-label="Close modal"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-purple-300">
                        {step === 4 ? 'Purchase Successful!' : 'Purchase Progress'}
                    </h3>
                    {listingName && step < 4 && (
                        <p className="text-sm text-slate-400">
                            Acquiring:{' '}
                            <span className="font-semibold">{listingName}</span> (
                            {listingPrice})
                        </p>
                    )}
                </div>


                <StepIndicator
                    currentStep={step}
                    targetStep={1}
                    title="Step 1: Approve Token Spending"
                    description="Confirm in MetaMask to allow the marketplace to handle your MockUSDC for this purchase."
                    txHash={txHashes?.approve}
                />


                <StepIndicator
                    currentStep={step}
                    targetStep={3}
                    title="Step 2: Confirm Purchase"
                    description="Confirm in MetaMask to finalize the data purchase and transfer MockUSDC."
                    txHash={txHashes?.purchase}
                />

                {errorMessage && step < 4 && (
                    <div className="mt-4 p-3 bg-red-600/20 text-red-300 text-sm rounded-lg flex items-center border border-red-500/30">
                        <AlertCircle size={18} className="mr-2" /> {errorMessage}
                    </div>
                )}

                {step === 4 && dataCID && (
                    <div className="mt-6 text-left bg-green-800/20 p-4 rounded-lg border border-green-500/30">
                        <p className="text-green-400 font-semibold mb-3 text-center">
                            Data Acquired!
                        </p>
                        <div className="mb-2">
                            <p className="text-xs text-slate-400">Data CID:</p>
                            <button
                                onClick={() => copyToClipboard(dataCID, 'Data CID')}
                                className="text-sm text-purple-300 break-all hover:underline"
                                title="Click to copy"
                            >
                                {dataCID}
                            </button>
                        </div>
                        {metadataCID && (
                            <div className="mb-2">
                                <p className="text-xs text-slate-400">Metadata CID:</p>
                                <button
                                    onClick={() => copyToClipboard(metadataCID, 'Metadata CID')}
                                    className="text-sm text-purple-300 break-all hover:underline"
                                    title="Click to copy"
                                >
                                    {metadataCID}
                                </button>
                            </div>
                        )}
                        <div className="mt-3 flex flex-col space-y-2">
                            {ipfsGatewayUrl.map((gateway: string, index: number) => (
                                <a
                                    key={`data-link-${index}`}
                                    href={`${gateway}${dataCID}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium py-1.5 px-3 rounded-lg"
                                >
                                    View Data on IPFS (Gateway {index + 1})
                                </a>
                            ))}
                            {metadataCID && ipfsGatewayUrl.map((gateway: string, index: number) => (
                                <a
                                    key={`metadata-link-${index}`}
                                    href={`${gateway}${metadataCID}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs bg-slate-700 hover:bg-slate-600 text-white font-medium py-1.5 px-3 rounded-lg"
                                >
                                    View Metadata (Gateway {index + 1})
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {step < 4 && step !== 0 && (
                    <p className="text-center text-xs text-slate-500 mt-6">
                        Please follow the prompts in your MetaMask wallet...
                    </p>
                )}

                <button
                    onClick={onClose}
                    className="w-full mt-6 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
                >
                    {step === 4 ? 'Close' : 'Cancel / Close'}
                </button>
            </div>
        </div>
    );
};

export default PurchaseProgressModal;
