
import time
import json
from web3 import Web3
import ipfshttpclient 
import requests 
from config import (
    RPC_URL, CONSUMER_PRIVATE_KEY, IPFS_CLIENT_URL, IPFS_GATEWAY_URL,
    CONTRACT_ADDRESS, CONTRACT_ABI
)

w3 = Web3(Web3.HTTPProvider(RPC_URL))
if not w3.is_connected():
    print(f"ERROR: Failed to connect to Ethereum node at {RPC_URL}")
    exit()

if not CONSUMER_PRIVATE_KEY:
    print("ERROR: CONSUMER_PRIVATE_KEY not found in .env or config. Please set it.")
    exit()
consumer_account = w3.eth.account.from_key(CONSUMER_PRIVATE_KEY)
print(f"Consumer Agent Address: {consumer_account.address}")
print(f"Consumer Balance: {w3.from_wei(w3.eth.get_balance(consumer_account.address), 'ether')} ETH/Native")

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
        print("IPFS_CLIENT_URL not configured. IPFS operations will be skipped for downloads if client fails.")
except Exception as e:
    print(f"WARNING: Could not connect to IPFS client: {e}. Will try gateway for downloads.")

if not CONTRACT_ADDRESS or not CONTRACT_ABI:
    print("ERROR: Contract Address or ABI not loaded from config.py. Ensure contract is deployed.")
    exit()
data_registry_contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)


def discover_listings(limit=5, offset=0):
    print(f"\nDiscovering listings (limit {limit}, offset {offset})...")
    try:
        listings_data = data_registry_contract.functions.getActiveListingsDetails(limit, offset).call()
        
        if not listings_data:
            print("No active listings found.")
            return []

        formatted_listings = []
        for item_tuple in listings_data:
            listing = {
                'id': item_tuple[0], 'seller': item_tuple[1], 'name': item_tuple[2],
                'description': item_tuple[3], 'dataCID': item_tuple[4],
                'price_wei': item_tuple[5], 'active': item_tuple[6]
            }
            listing['price_ether'] = w3.from_wei(listing['price_wei'], 'ether')
            if listing['active']: # Only show active ones
                formatted_listings.append(listing)
                print(f"  Found Active: ID {listing['id']}, Name: '{listing['name']}', Price: {listing['price_ether']} ETH")
        return formatted_listings
    except Exception as e:
        print(f"Error discovering listings: {e}")
        import traceback
        traceback.print_exc()
        return []

def purchase_data_on_chain(listing_id, price_wei, listing_name="Unknown"):
    print(f"\nAttempting to purchase listing ID {listing_id} ('{listing_name}') for {w3.from_wei(price_wei, 'ether')} ETH...")
    try:
        nonce = w3.eth.get_transaction_count(consumer_account.address)
        
        estimated_gas = 300000 
        try:
            estimated_gas = data_registry_contract.functions.purchaseData(
                listing_id
            ).estimate_gas({'from': consumer_account.address, 'value': price_wei})
            print(f"INFO: Estimated gas for purchasing ID {listing_id}: {estimated_gas}")
        except Exception as e:
            print(f"WARNING: Gas estimation failed for purchasing ID {listing_id}: {e}. Using default: {estimated_gas}")

        is_local_hardhat_node = (w3.eth.chain_id == 1337 or w3.eth.chain_id == 31337)
        tx_params = {
            'from': consumer_account.address,
            'value': price_wei,
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
                    print(f"INFO: Using EIP-1559 fees for purchasing ID {listing_id}.")
                except Exception as e_fee:
                    print(f"WARNING: Could not set EIP-1559 fees for purchasing ID {listing_id} due to: {e_fee}. Falling back.")
                    if hasattr(w3.eth, 'gas_price'):
                        tx_params['gasPrice'] = w3.eth.gas_price
            elif hasattr(w3.eth, 'gas_price'):
                tx_params['gasPrice'] = w3.eth.gas_price
                print(f"INFO: Using legacy gasPrice for purchasing ID {listing_id}.")
        else:
            if hasattr(w3.eth, 'gas_price'):
                tx_params['gasPrice'] = w3.eth.gas_price
                print(f"INFO: Using legacy gasPrice for purchasing ID {listing_id} on local Hardhat node: {w3.from_wei(tx_params['gasPrice'], 'gwei')} gwei")
            else:
                print(f"WARNING: w3.eth.gas_price not available for local Hardhat node for purchasing ID {listing_id}.")
        

        print(f"DEBUG: Transaction parameters for purchasing ID {listing_id}: {tx_params}")
        transaction = data_registry_contract.functions.purchaseData(listing_id).build_transaction(tx_params)
        print(f"DEBUG: Built transaction for purchasing ID {listing_id}.")

        try:
            signed_tx = w3.eth.account.sign_transaction(transaction, private_key=CONSUMER_PRIVATE_KEY)
            
            if not hasattr(signed_tx, 'raw_transaction'):
                print(f"CRITICAL ERROR: signed_tx object for purchasing ID {listing_id} does not have 'rawTransaction'. Object: {signed_tx}")
                return False
            
            raw_tx = signed_tx.raw_transaction
            tx_hash = w3.eth.send_raw_transaction(raw_tx)
            print(f"PURCHASE TX SENT for ID {listing_id}: {w3.to_hex(tx_hash)}")
            print(f"Waiting for transaction receipt (purchase ID: {listing_id})...")
            tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)

            if tx_receipt.status == 1:
                print(f"SUCCESS: Data purchased for listing ID {listing_id}. Block: {tx_receipt.blockNumber}")
                return True
            else:
                print(f"ERROR: Purchase transaction for listing ID {listing_id} FAILED. Receipt status: {tx_receipt.status}. Full receipt: {tx_receipt}")
                return False
        except Exception as e_sign_send:
            print(f"ERROR during signing or sending transaction for purchasing ID {listing_id}: {e_sign_send}")
            import traceback
            traceback.print_exc()
            return False

    except Exception as e_outer:
        print(f"ERROR preparing purchase transaction for listing ID {listing_id}: {e_outer}")
        import traceback
        traceback.print_exc()
        return False

def fetch_from_ipfs(cid):
    print(f"Fetching data from IPFS with CID: {cid}...")
    if not cid or "DUMMY_CID" in cid:
        print("Invalid or dummy CID provided, cannot fetch.")
        return None
    
    content = None
    if ipfs_client:
        try:
            print(f"Attempting to fetch CID {cid} using IPFS client...")
            content_bytes = ipfs_client.cat(cid, timeout=30) 
            try:
                content_str = content_bytes.decode('utf-8')
                content = json.loads(content_str)
                print("Successfully fetched and parsed JSON data from IPFS via client.")
            except (json.JSONDecodeError, UnicodeDecodeError) as decode_err:
                print(f"Could not decode as JSON, trying as text. Error: {decode_err}")
                content = content_str 
                print("Successfully fetched text data from IPFS via client (not JSON).")
            return content
        except Exception as e:
            print(f"Error fetching CID {cid} from IPFS client: {e}. Trying gateway...")

    if IPFS_GATEWAY_URL:
        try:
            gateway_fetch_url = f"{IPFS_GATEWAY_URL.strip('/')}/{cid}"
            print(f"Fetching CID {cid} using gateway: {gateway_fetch_url}")
            response = requests.get(gateway_fetch_url, timeout=60)
            response.raise_for_status()
            try:
                content = response.json()
                print("Successfully fetched and parsed JSON data from IPFS via gateway.")
            except requests.exceptions.JSONDecodeError:
                content = response.text
                print("Successfully fetched text data from IPFS via gateway (not JSON).")
            return content
        except Exception as e:
            print(f"Error fetching CID {cid} from IPFS gateway ({gateway_fetch_url}): {e}")
    
    print(f"Failed to fetch CID {cid} from all IPFS sources.")
    return None


if __name__ == "__main__":
    print("\n--- Auraweave Consumer Agent Starting ---")
    time.sleep(5) 

    listings = discover_listings(limit=10)

    if not listings:
        print("No active listings found to purchase.")
    else:
        target_listing = None
        my_balance_wei = w3.eth.get_balance(consumer_account.address)
        print(f"\nConsumer balance: {w3.from_wei(my_balance_wei, 'ether')} ETH")

        for listing in listings:
            if listing['seller'].lower() == consumer_account.address.lower():
                print(f"Skipping own listing ID {listing['id']}")
                continue
            if my_balance_wei >= listing['price_wei'] and listing['active']:
                target_listing = listing
                print(f"Selected listing ID {target_listing['id']} ('{target_listing['name']}') for purchase.")
                break
        
        if not target_listing:
            print("No affordable active listings found (or only own listings available).")
        else:
            purchase_successful = purchase_data_on_chain(target_listing['id'], target_listing['price_wei'], target_listing['name'])

            if purchase_successful:
                print(f"\nAttempting to fetch purchased data (CID: {target_listing['dataCID']})...")
                purchased_data_content = fetch_from_ipfs(target_listing['dataCID'])
                if purchased_data_content:
                    print("\n--- PURCHASED DATA CONTENT ---")
                    try:
                        print(json.dumps(purchased_data_content, indent=2))
                    except TypeError: 
                        print(purchased_data_content)
                    print("----------------------------")
                    print("Consumer agent can now use this data!")
                else:
                    print("Failed to fetch purchased data from IPFS.")
            else:
                print("Purchase was not successful, cannot fetch data.")

    print("\n--- Auraweave Consumer Agent Finished ---")