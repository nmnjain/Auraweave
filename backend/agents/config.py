
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

def get_deployment_details():
    if not os.path.exists(CONTRACT_INFO_FILE):
        raise FileNotFoundError(f"Deployment info file not found: {CONTRACT_INFO_FILE} for network '{ACTIVE_NETWORK}'")
    with open(CONTRACT_INFO_FILE, 'r') as f:
        return json.load(f)

# Load all deployment details
DEPLOYMENT_DETAILS = None
DATA_REGISTRY_ADDRESS = None
DATA_REGISTRY_ABI = None
MOCK_ERC20_ADDRESS = None
MOCK_ERC20_ABI = None

try:
    DEPLOYMENT_DETAILS = get_deployment_details()
    DATA_REGISTRY_INFO = DEPLOYMENT_DETAILS.get('DataRegistry', {})
    MOCK_ERC20_INFO = DEPLOYMENT_DETAILS.get('MockERC20', {})

    DATA_REGISTRY_ADDRESS = DATA_REGISTRY_INFO.get('address')
    DATA_REGISTRY_ABI = DATA_REGISTRY_INFO.get('abi')
    MOCK_ERC20_ADDRESS = MOCK_ERC20_INFO.get('address')
    MOCK_ERC20_ABI = MOCK_ERC20_INFO.get('abi')

    if not all([DATA_REGISTRY_ADDRESS, DATA_REGISTRY_ABI, MOCK_ERC20_ADDRESS, MOCK_ERC20_ABI]):
        print("Warning: Some contract details might be missing from deployment file.")

except FileNotFoundError as e:
    print(f"Warning: {e}")
    print("Contract details not loaded. Ensure contracts are deployed to the '{ACTIVE_NETWORK}' network.")
except KeyError as e:
    print(f"Warning: Key {e} not found in deployment file. Structure might be incorrect.")


print(f"--- AGENT CONFIG USING NETWORK: {ACTIVE_NETWORK} ---")
if RPC_URL: print(f"RPC URL: {RPC_URL}")
if DATA_REGISTRY_ADDRESS: print(f"DataRegistry Address: {DATA_REGISTRY_ADDRESS}")
if MOCK_ERC20_ADDRESS: print(f"MockERC20 Address: {MOCK_ERC20_ADDRESS}")