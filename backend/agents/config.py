
import os
import json
from dotenv import load_dotenv

def load_env_vars():
    dotenv_path_root = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(dotenv_path_root):
        load_dotenv(dotenv_path=dotenv_path_root)
load_env_vars()

ACTIVE_NETWORK = os.getenv("AURAWEAVE_NETWORK", "localhost").lower() 
if ACTIVE_NETWORK == "localhost":
    RPC_URL = "http://127.0.0.1:8545" 
elif ACTIVE_NETWORK == "sepolia": 
    RPC_URL = os.getenv("SEPOLIA_RPC_URL")
    if not RPC_URL:
        raise ValueError("SEPOLIA_RPC_URL not set in .env for 'sepolia' network")
else:
    raise ValueError(f"Unsupported AURAWEAVE_NETWORK: {ACTIVE_NETWORK}")

PRODUCER_PRIVATE_KEY = os.getenv("PRODUCER_PRIVATE_KEY")
CONSUMER_PRIVATE_KEY = os.getenv("CONSUMER_PRIVATE_KEY")

if not PRODUCER_PRIVATE_KEY or not CONSUMER_PRIVATE_KEY:
    print("WARNING: PRODUCER_PRIVATE_KEY or CONSUMER_PRIVATE_KEY not found in .env.")
    print("Ensure these are set after running 'npx hardhat node' for local testing.")

IPFS_CLIENT_URL = os.getenv("IPFS_HTTP_CLIENT_URL", "/ip4/127.0.0.1/tcp/5001/http")
IPFS_GATEWAY_URL = os.getenv("IPFS_GATEWAY_URL", "http://127.0.0.1:8080/ipfs/")

CONTRACT_INFO_FILE = os.path.join(os.path.dirname(__file__), '..', 'deployments', f'{ACTIVE_NETWORK}.json')

def get_contract_deployment_info():
    if not os.path.exists(CONTRACT_INFO_FILE):
        raise FileNotFoundError(
            f"Deployment info file not found: {CONTRACT_INFO_FILE}. "
            f"Please deploy the contract to the '{ACTIVE_NETWORK}' network first using "
            f"'npx hardhat run scripts/deploy.js --network {ACTIVE_NETWORK}'."
        )
    with open(CONTRACT_INFO_FILE, 'r') as f:
        deployment_info = json.load(f)
    return deployment_info['DataRegistry']['address'], deployment_info['DataRegistry']['abi']

CONTRACT_ADDRESS = None
CONTRACT_ABI = None
try:
    CONTRACT_ADDRESS, CONTRACT_ABI = get_contract_deployment_info()
except FileNotFoundError as e:
    print(f"Warning: {e}")
    print("Contract address and ABI not loaded. Will try to load them dynamically in agent scripts.")


print(f"--- AGENT CONFIG USING NETWORK: {ACTIVE_NETWORK} ---")
if RPC_URL: print(f"RPC URL: {RPC_URL}")
if CONTRACT_ADDRESS: print(f"Contract Address: {CONTRACT_ADDRESS}")