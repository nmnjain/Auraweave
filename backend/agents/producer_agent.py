
import time
import random
import json
from web3 import Web3
import ipfshttpclient
from config import (
    RPC_URL, PRODUCER_PRIVATE_KEY, IPFS_CLIENT_URL,
    CONTRACT_ADDRESS, CONTRACT_ABI 
)

# --- Connect to Services ---
w3 = Web3(Web3.HTTPProvider(RPC_URL))
if not w3.is_connected():
    print(f"ERROR: Failed to connect to Ethereum node at {RPC_URL}")
    exit()

if not PRODUCER_PRIVATE_KEY:
    print("ERROR: PRODUCER_PRIVATE_KEY not found in .env or config. Please set it.")
    exit()
producer_account = w3.eth.account.from_key(PRODUCER_PRIVATE_KEY)
print(f"Producer Agent Address: {producer_account.address}")
print(f"Producer Balance: {w3.from_wei(w3.eth.get_balance(producer_account.address), 'ether')} ETH/Native")

# Initialize IPFS client
ipfs_client = None
try:
    if IPFS_CLIENT_URL:
        ipfs_client = ipfshttpclient.connect(IPFS_CLIENT_URL)
        print(f"Attempting to connect to IPFS node: {IPFS_CLIENT_URL}")
        try:
            ipfs_client.id() 
            print(f"Successfully connected to IPFS node and got ID.")
        except Exception as ipfs_id_err:
            print(f"Connected to IPFS API but ID check failed (daemon might be too old but basic ops might work): {ipfs_id_err}")
            
    else:
        print("IPFS_CLIENT_URL not configured. IPFS operations will be skipped.")
except Exception as e:
    print(f"ERROR: Could not connect to IPFS: {e}. Check if daemon is running and URL is correct.")

if not CONTRACT_ADDRESS or not CONTRACT_ABI:
    print("ERROR: Contract Address or ABI not loaded from config.py. Ensure contract is deployed and deployments/localhost.json exists.")
    exit()
data_registry_contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)


def generate_dummy_data(sensor_id="aura_sensor_01"):
    return {
        "timestamp": time.time(),
        "sensor_id": sensor_id,
        "temperature_celsius": round(random.uniform(18.0, 28.0), 1),
        "humidity_percent": round(random.uniform(40.0, 65.0), 1),
        "co2_ppm": random.randint(400, 1200)
    }

def upload_to_ipfs(data_content):
    if not ipfs_client:
        print("Skipping IPFS upload as client is not available.")
        return "DUMMY_CID_IPFS_UNAVAILABLE"
    try:
        data_bytes = json.dumps(data_content).encode('utf-8')
        res = ipfs_client.add_bytes(data_bytes) 
        print(f"Data uploaded to IPFS. CID: {res}")
        return str(res)
    except Exception as e:
        print(f"Error uploading to IPFS: {e}")
        return "DUMMY_CID_UPLOAD_FAILED"

def list_data_on_chain(name, description, data_cid, price_ether):
    price_wei = w3.to_wei(price_ether, 'ether')
    try:
        nonce = w3.eth.get_transaction_count(producer_account.address)
        
        estimated_gas = 500000 
        try:
            estimated_gas = data_registry_contract.functions.listData(
                name, description, data_cid, price_wei
            ).estimate_gas({'from': producer_account.address})
            print(f"INFO: Estimated gas for '{name}': {estimated_gas}")
        except Exception as e:
            print(f"WARNING: Gas estimation failed for '{name}': {e}. Using default gas limit: {estimated_gas}")

        is_local_hardhat_node = (w3.eth.chain_id == 1337 or w3.eth.chain_id == 31337)
        tx_params = {
            'from': producer_account.address,
            'nonce': nonce,
            'gas': estimated_gas + 30000,
            'chainId': w3.eth.chain_id
        }

        if not is_local_hardhat_node:
            if hasattr(w3.eth, 'max_priority_fee') and 'baseFeePerGas' in w3.eth.get_block('latest'):
                try:
                    base_fee = w3.eth.get_block('latest')['baseFeePerGas']
                    suggested_priority_fee = w3.to_wei('1.5', 'gwei')
                    tx_params['maxPriorityFeePerGas'] = suggested_priority_fee
                    tx_params['maxFeePerGas'] = (base_fee * 2) + suggested_priority_fee
                    print(f"INFO: Using EIP-1559 fees for '{name}'.")
                except Exception as e_fee:
                    print(f"WARNING: Could not set EIP-1559 fees for '{name}' due to: {e_fee}. Falling back.")
                    if hasattr(w3.eth, 'gas_price'):
                        tx_params['gasPrice'] = w3.eth.gas_price
            elif hasattr(w3.eth, 'gas_price'):
                tx_params['gasPrice'] = w3.eth.gas_price
                print(f"INFO: Using legacy gasPrice for '{name}'.")
        else: 
            if hasattr(w3.eth, 'gas_price'):
                tx_params['gasPrice'] = w3.eth.gas_price 
                print(f"INFO: Using legacy gasPrice for '{name}' on local Hardhat node: {w3.from_wei(tx_params['gasPrice'], 'gwei')} gwei")
            else:
                print(f"WARNING: w3.eth.gas_price not available for local Hardhat node for '{name}'. Relying on node defaults.")
        

        print(f"DEBUG: Transaction parameters for '{name}': {tx_params}")
        transaction = data_registry_contract.functions.listData(
            name, description, data_cid, price_wei
        ).build_transaction(tx_params)
        print(f"DEBUG: Built transaction for '{name}'.")

        try:
            signed_tx = w3.eth.account.sign_transaction(transaction, private_key=PRODUCER_PRIVATE_KEY)
            
            if not hasattr(signed_tx, 'raw_transaction'):
                print(f"CRITICAL ERROR: signed_tx object for '{name}' does not have 'rawTransaction' attribute. Object: {signed_tx}")
                return False
            
            raw_tx = signed_tx.raw_transaction
            tx_hash = w3.eth.send_raw_transaction(raw_tx)
            print(f"LISTING TX SENT for '{name}': {w3.to_hex(tx_hash)}")
            print(f"Waiting for transaction receipt (listing: '{name}')...")
            tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
            
            if tx_receipt.status == 1:
                print(f"SUCCESS: Data '{name}' listed on-chain. Block: {tx_receipt.blockNumber}")
             
                return True
            else:
                print(f"ERROR: Listing transaction for '{name}' FAILED. Receipt status: {tx_receipt.status}. Full receipt: {tx_receipt}")
                return False
        except Exception as e_sign_send:
            print(f"ERROR during signing or sending transaction for '{name}': {e_sign_send}")
            import traceback
            traceback.print_exc()
            return False
            
    except Exception as e_outer:
        print(f"ERROR preparing transaction for '{name}': {e_outer}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\n--- Auraweave Producer Agent Starting ---")
    
    data1 = generate_dummy_data("office_env_sensor")
    cid1 = upload_to_ipfs(data1)
    if cid1 and "DUMMY_CID" not in cid1: 
        print(f"\nAttempting to list data: Office Environment Data (CID: {cid1})")
        list_data_on_chain("Office Environment Data", "Temp, Humidity, CO2 from Office A", cid1, 0.0001)
    else:
        print(f"Skipping on-chain listing for Office Environment Data due to IPFS issue (CID: {cid1}).")

    time.sleep(3) 

    data2 = generate_dummy_data("lab_pressure_sensor")
    cid2 = upload_to_ipfs(data2)
    if cid2 and "DUMMY_CID" not in cid2:
        print(f"\nAttempting to list data: Lab Pressure Data (CID: {cid2})")
        list_data_on_chain("Lab Pressure Data", "Pressure readings from Lab B", cid2, 0.0002)
    else:
        print(f"Skipping on-chain listing for Lab Pressure Data due to IPFS issue (CID: {cid2}).")
    
    print("\n--- Auraweave Producer Agent Finished ---")