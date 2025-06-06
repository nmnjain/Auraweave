import time
import random
import json
from web3 import Web3
import ipfshttpclient
from config import (
    RPC_URL, PRODUCER_PRIVATE_KEY, IPFS_CLIENT_URL,
    DATA_REGISTRY_ADDRESS, DATA_REGISTRY_ABI,
)

w3 = Web3(Web3.HTTPProvider(RPC_URL))
if not w3.is_connected():
    print(f"ERROR: Failed to connect to Ethereum node at {RPC_URL}")
    exit()

if not PRODUCER_PRIVATE_KEY:
    print("ERROR: PRODUCER_PRIVATE_KEY not found in environment. Exiting.")
    exit()
producer_account = w3.eth.account.from_key(PRODUCER_PRIVATE_KEY)
print(f"Producer Agent Address: {producer_account.address}")
try:
    balance_eth = w3.from_wei(w3.eth.get_balance(producer_account.address), 'ether')
    print(f"Producer Balance (ETH for gas): {balance_eth} ETH")
except Exception as e:
    print(f"Could not fetch ETH balance for producer: {e}")


try:
    ipfs_client = ipfshttpclient.connect(IPFS_CLIENT_URL)
    print(f"Connected to IPFS node: {IPFS_CLIENT_URL}")
except Exception as e:
    print(f"ERROR: Could not connect to IPFS: {e}. Make sure IPFS daemon is running.")
    ipfs_client = None s

if not DATA_REGISTRY_ADDRESS or not DATA_REGISTRY_ABI:
    print("ERROR: DataRegistry contract address or ABI not loaded from config. Exiting producer.")
    exit()
data_registry_contract = w3.eth.contract(address=DATA_REGISTRY_ADDRESS, abi=DATA_REGISTRY_ABI)


def generate_dummy_data(sensor_id="aura_sensor_01"):
   
    return {
        "timestamp": time.time(), "sensor_id": sensor_id,
        "temperature_celsius": round(random.uniform(18.0, 28.0), 1),
        "humidity_percent": round(random.uniform(40.0, 65.0), 1),
        "co2_ppm": random.randint(400, 1200)
    }

def generate_dummy_metadata(data_name):
    return {
        "name": data_name,
        "data_type": "environmental_sensor",
        "schema": {"timestamp": "unix_float", "sensor_id": "string", "temperature_celsius": "float", "...": "..."}
    }

def upload_to_ipfs(content_dict, filename_hint="file.json"):
    
    if not ipfs_client:
        print(f"Skipping IPFS upload for {filename_hint} as client is not available.")
        return f"DUMMY_CID_FOR_{filename_hint.split('.')[0]}"
    try:
        content_bytes = json.dumps(content_dict).encode('utf-8')
        res = ipfs_client.add_bytes(content_bytes)
        print(f"Content '{filename_hint}' uploaded to IPFS. CID: {res}")
        return res
    except Exception as e:
        print(f"Error uploading {filename_hint} to IPFS: {e}")
        return None


def list_data_on_chain(name, description, data_cid, metadata_cid, price_mock_stablecoin_units):
    price_token_wei = w3.to_wei(price_mock_stablecoin_units, 'ether') 

    print(f"\nAttempting to list data: '{name}'")
    print(f"  Data CID: {data_cid}, Metadata CID: {metadata_cid}, Price: {price_mock_stablecoin_units} MUSDC ({price_token_wei} token_wei)")

    try:
        nonce = w3.eth.get_transaction_count(producer_account.address)
        
        try:
            estimated_gas = data_registry_contract.functions.listData(
                name, description, data_cid, metadata_cid, price_token_wei
            ).estimate_gas({'from': producer_account.address})
        except Exception as e:
            print(f"Gas estimation failed for listData: {e}. Using default.")
            estimated_gas = 600000 
        tx_params = {
            'from': producer_account.address, 'nonce': nonce,
            'gas': estimated_gas + 50000, 
            
        }
        if hasattr(w3.eth, 'max_priority_fee'):
            tx_params['maxPriorityFeePerGas'] = w3.eth.max_priority_fee
            tx_params['maxFeePerGas'] = w3.eth.gas_price * 2 + w3.eth.max_priority_fee


        transaction = data_registry_contract.functions.listData(
            name, description, data_cid, metadata_cid, price_token_wei
        ).build_transaction(tx_params)

        signed_tx = w3.eth.account.sign_transaction(transaction, PRODUCER_PRIVATE_KEY)
  
        try:
            tx_hash_bytes = w3.eth.send_raw_transaction(signed_tx.raw_transaction) 
            tx_hash = w3.to_hex(tx_hash_bytes)
            print(f"LISTING TX SENT: {tx_hash}")
        except Exception as e_send:
            print(f"Error sending raw transaction: {e_send}")
            import traceback
            traceback.print_exc()
            return False
        print(f"Waiting for tx receipt (listing: '{name}')...")
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=240)

        if tx_receipt.status == 1:
            print(f"SUCCESS: Data '{name}' listed. Block: {tx_receipt.blockNumber}")
           
            return True
        else:
            print(f"ERROR: Listing tx for '{name}' FAILED. Receipt: {tx_receipt}")
            return False
    except Exception as e:
        print(f"ERROR listing data '{name}': {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\n--- Auraweave Producer Agent Starting (Sepolia & Stablecoin Mode) ---")

    data_name1 = "Office Sensor Data Set A"
    data1 = generate_dummy_data("office_A_env")
    metadata1 = generate_dummy_metadata(data_name1)
    cid_data1 = upload_to_ipfs(data1, "data1.json")
    cid_meta1 = upload_to_ipfs(metadata1, "meta1.json")

    if cid_data1 and cid_meta1:
        list_data_on_chain(data_name1, "Temp, Hum, CO2 from Office A", cid_data1, cid_meta1, 0.5) # Price: 0.5 MUSDC

    time.sleep(5) 

    data_name2 = "Lab Pressure Readings B"
    data2 = generate_dummy_data("lab_B_pressure")
    metadata2 = generate_dummy_metadata(data_name2)
    cid_data2 = upload_to_ipfs(data2, "data2.json")
    cid_meta2 = upload_to_ipfs(metadata2, "meta2.json")

    if cid_data2 and cid_meta2:
        list_data_on_chain(data_name2, "High-res pressure data from Lab B", cid_data2, cid_meta2, 1.2) # Price: 1.2 MUSDC

    print("\n--- Auraweave Producer Agent Finished ---")