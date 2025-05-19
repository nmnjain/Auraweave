
import React from 'react';

const Workflow: React.FC = () => {
  const workflowSteps = [
    { id: 1, title: 'Prepare & Package Data', description: 'Producer Agents generate or collect valuable data from sensors, applications, or other sources.', iconClass: 'fas fa-cogs' },
    { id: 2, title: 'Upload to Decentralized Storage', description: 'Data is uploaded to IPFS, generating a unique Content Identifier (CID) for immutable referencing.', iconClass: 'fas fa-cloud-upload-alt' },
    { id: 3, title: 'List on Auraweave Registry', description: 'The Producer Agent lists the data offering on the blockchain registry via smart contract, setting price and attaching the CID.', iconClass: 'fas fa-file-contract' },
    { id: 4, title: 'Discover & Select Data', description: 'Consumer Agents query the on-chain registry to find data listings matching their requirements and budget.', iconClass: 'fas fa-search' },
    { id: 5, title: 'Purchase On-Chain', description: 'The Consumer Agent initiates a purchase transaction via the smart contract, transferring crypto payment trustlessly.', iconClass: 'fas fa-dollar-sign' },
    { id: 6, title: 'Access & Utilize Data', description: 'Upon successful purchase, the Consumer Agent retrieves the data CID and downloads the data directly from IPFS for its tasks.', iconClass: 'fas fa-download' },
  ];

  return (
    <section id="workflow" className="py-16 md:py-24 bg-gradient-to-b from-black to-black text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            Turn any valuable data into seamless blockchain transactions — from sensing to sharing, it's all automated.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-gradient-to-b from-purple-500 to-yellow-500 hidden md:block" 
               style={{ top: '10%', bottom: '10%' }}>
          </div>

          {workflowSteps.map((step, index) => (
            <div 
              key={step.id}
              className="relative mb-16 last:mb-0"
            >

              <div className={`flex items-center ${
                index % 2 === 0 
                  ? 'md:flex-row' 
                  : 'md:flex-row-reverse'
              } flex-col`}>
                
                <div className={`w-full md:w-2/5 ${
                  index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'
                } mb-8 md:mb-0`}>
                  <div className="relative p-6 rounded-lg shadow-xl
                                 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700
                                 hover:border-purple-500/50 transition-all duration-300 hover:shadow-purple-500/20">
                    
                    <div className={`text-4xl mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-yellow-400 ${
                      index % 2 === 0 ? 'md:text-left' : 'md:text-right'
                    } text-center`}>
                      {step.iconClass && <i className={step.iconClass}></i>}
                    </div>
                    
                    <h3 className={`text-xl md:text-2xl font-semibold mb-3 text-white ${
                      index % 2 === 0 ? 'md:text-left' : 'md:text-right'
                    } text-center`}>
                      {step.title}
                    </h3>
                    
                    <p className={`text-slate-300 text-sm md:text-base leading-relaxed ${
                      index % 2 === 0 ? 'md:text-left' : 'md:text-right'
                    } text-center`}>
                      {step.description}
                    </p>

                    <div className={`mt-4 h-1 w-16 bg-gradient-to-r from-purple-600 to-yellow-500 rounded ${
                      index % 2 === 0 ? 'md:ml-0' : 'md:ml-auto'
                    } mx-auto`}></div>
                  </div>
                </div>
                <div className="w-full md:w-1/5 flex justify-center relative z-10">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-yellow-500 text-white text-xl font-bold flex items-center justify-center border-4 border-slate-900 shadow-lg">
                    {step.id}
                  </div>
                </div>

                <div className="w-full md:w-2/5 hidden md:block"></div>
              </div>

              {index < workflowSteps.length - 1 && (
                <div className="md:hidden flex justify-center my-8">
                  <div className="w-0.5 h-12 bg-gradient-to-b from-purple-500 to-yellow-500"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <h3 className="text-2xl font-bold mb-4">Want to see it live?</h3>
          <p className="text-lg text-slate-300 mb-8">
            Explore the code and watch our demo video to see Auraweave in action.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="#demo"
              className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-lg font-semibold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-purple-500/50"
            >
              Watch Demo Video
            </a>
            <a
              href="YOUR_GITHUB_REPO_URL"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-slate-700 hover:bg-slate-600 text-white text-lg font-semibold py-3 px-8 rounded-lg transition duration-300 border border-slate-600 hover:border-purple-500/50"
            >
              Explore on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Workflow;