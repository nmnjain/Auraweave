import time
import json
from web3 import Web3
import ipfshttpclient
import requests
from config import (
    RPC_URL, CONSUMER_PRIVATE_KEY, IPFS_CLIENT_URL, IPFS_GATEWAY_URL,
    DATA_REGISTRY_ADDRESS, DATA_REGISTRY_ABI,
    MOCK_ERC20_ADDRESS, MOCK_ERC20_ABI
)


w3 = Web3(Web3.HTTPProvider(RPC_URL))
if not w3.is_connected():
    print(f"ERROR: Failed to connect to Ethereum node at {RPC_URL}")
    exit()

if not CONSUMER_PRIVATE_KEY:
    print("ERROR: CONSUMER_PRIVATE_KEY not found in environment. Exiting.")
    exit()
consumer_account = w3.eth.account.from_key(CONSUMER_PRIVATE_KEY)
print(f"Consumer Agent Address: {consumer_account.address}")
try:
    balance_eth = w3.from_wei(w3.eth.get_balance(consumer_account.address), 'ether')
    print(f"Consumer Balance (ETH for gas): {balance_eth} ETH")
except Exception as e:
    print(f"Could not fetch ETH balance for consumer: {e}")

try:
    ipfs_client = ipfshttpclient.connect(IPFS_CLIENT_URL)
    print(f"Connected to IPFS node: {IPFS_CLIENT_URL}")
except Exception as e:
    print(f"WARNING: Could not connect to IPFS client: {e}. Will try gateway for downloads.")
    ipfs_client = None

if not DATA_REGISTRY_ADDRESS or not DATA_REGISTRY_ABI or not MOCK_ERC20_ADDRESS or not MOCK_ERC20_ABI:
    print("ERROR: Contract details (DataRegistry or MockERC20) not fully loaded from config. Exiting consumer.")
    exit()

data_registry_contract = w3.eth.contract(address=DATA_REGISTRY_ADDRESS, abi=DATA_REGISTRY_ABI)
mock_erc20_contract = w3.eth.contract(address=MOCK_ERC20_ADDRESS, abi=MOCK_ERC20_ABI)

def get_mock_token_balance():
    try:
        balance_wei = mock_erc20_contract.functions.balanceOf(consumer_account.address).call()
        return w3.from_wei(balance_wei, 'ether') # Display as whole tokens
    except Exception as e:
        print(f"Error getting MockUSDC balance: {e}")
        return 0

print(f"Consumer MockUSDC Balance: {get_mock_token_balance()} MUSDC")


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
                'description': item_tuple[3], 'dataCID': item_tuple[4], 'metadataCID': item_tuple[5],
                'price_token_wei': item_tuple[6], 'active': item_tuple[7]
            }
            listing['price_musdc'] = w3.from_wei(listing['price_token_wei'], 'ether')
            formatted_listings.append(listing)
            print(f"  Found: ID {listing['id']}, Name: '{listing['name']}', Price: {listing['price_musdc']} MUSDC, DataCID: {listing['dataCID']}, MetaCID: {listing['metadataCID']}")
        return formatted_listings
    except Exception as e:
        print(f"Error discovering listings: {e}")
        import traceback; traceback.print_exc();
        return []


def approve_token_spending(spender_address, amount_token_wei):
    if not isinstance(amount_token_wei, int):
        try:
            amount_token_wei = int(amount_token_wei)
        except ValueError:
            print(f"ERROR: amount_token_wei '{amount_token_wei}' is not a valid integer for approval.")
            return False

    print(f"\nApproving DataRegistry ({spender_address}) to spend {w3.from_wei(amount_token_wei, 'ether')} MUSDC...")
    try:
        nonce = w3.eth.get_transaction_count(consumer_account.address)
        current_allowance = mock_erc20_contract.functions.allowance(consumer_account.address, spender_address).call()
        if current_allowance >= amount_token_wei:
            print("Sufficient allowance already set.")
            return True

        try:
            estimated_gas = mock_erc20_contract.functions.approve(
                spender_address, amount_token_wei
            ).estimate_gas({'from': consumer_account.address})
            print(f"Debug: Estimated gas for approve: {estimated_gas}")
        except Exception as e:
            print(f"Gas estimation failed for approve: {e}. Using default gas limit: 100000")
            estimated_gas = 100000

        transaction_dict_approve = {
            'from': consumer_account.address,
            'nonce': nonce,
            'gas': estimated_gas + 20000,
        }

        latest_block_approve = w3.eth.get_block('latest')
        base_fee_approve = latest_block_approve.get('baseFeePerGas')

        if base_fee_approve is not None: 
            try:
                max_priority_fee_gwei = w3.to_wei('2', 'gwei') 
                transaction_dict_approve['maxPriorityFeePerGas'] = int(max_priority_fee_gwei)
            except ValueError:
                print("Error converting max_priority_fee_gwei to int. Using default.")
                transaction_dict_approve['maxPriorityFeePerGas'] = 2 * 10**9 

            try:
                calculated_max_fee = (int(base_fee_approve) * 2) + transaction_dict_approve['maxPriorityFeePerGas']
                transaction_dict_approve['maxFeePerGas'] = int(calculated_max_fee)
            except ValueError:
                print("Error calculating or converting maxFeePerGas. Using a fallback.")
                transaction_dict_approve['maxFeePerGas'] = int(w3.eth.gas_price * 3) if w3.eth.gas_price else 50 * 10**9

            print(f"Debug: Using EIP-1559 fees: maxPriorityFeePerGas={transaction_dict_approve['maxPriorityFeePerGas']}, maxFeePerGas={transaction_dict_approve['maxFeePerGas']}")
        else: # Legacy network
            transaction_dict_approve['gasPrice'] = int(w3.eth.gas_price) 
            print(f"Debug: Using legacy gasPrice: {transaction_dict_approve['gasPrice']}")
        
        print(f"Debug: Transaction dict for approve: {transaction_dict_approve}")

      
        transaction_approve = mock_erc20_contract.functions.approve(
            spender_address, amount_token_wei 
        ).build_transaction(transaction_dict_approve) 

        print(f"Debug: Built transaction for approve: {transaction_approve}")

       
        signed_tx_approve = w3.eth.account.sign_transaction(transaction_approve, CONSUMER_PRIVATE_KEY)
        print(f"Debug: Signed transaction for approve. Type: {type(signed_tx_approve)}")

        
        tx_hash_bytes = None 
        try:
            tx_hash_bytes = w3.eth.send_raw_transaction(signed_tx_approve.raw_transaction) 
            tx_hash_hex = w3.to_hex(tx_hash_bytes) 
            print(f"APPROVAL TX SENT: {tx_hash_hex}")
        except Exception as send_error:
            print(f"ERROR sending approval transaction: {send_error}")
            import traceback; traceback.print_exc();
            return False 

        
        print("Waiting for approval transaction receipt...")
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash_bytes, timeout=240)

        if tx_receipt.status == 1:
            print("SUCCESS: Token spending approved.")
            return True
        else:
            print(f"ERROR: Approval transaction FAILED. Receipt: {tx_receipt}")
            return False

    except Exception as e:
        print(f"ERROR in outer try-except of approve_token_spending: {e}")
        import traceback; traceback.print_exc();
        return False


def purchase_data_on_chain(listing_id):
    target_listing_details = None
    price_token_wei = None 

    try: 
       
        if not isinstance(listing_id, int):
            listing_id = int(listing_id)

        raw_listing = data_registry_contract.functions.getListing(listing_id).call()
       ve [7]
        price_token_wei = raw_listing[6]
        if not isinstance(price_token_wei, int):
            price_token_wei = int(price_token_wei)

        print(f"\nAttempting to purchase listing ID {listing_id} for {w3.from_wei(price_token_wei, 'ether')} MUSDC...")
    except Exception as e:
        print(f"ERROR: Could not fetch details or price for listing ID {listing_id} before purchase: {e}")
        import traceback; traceback.print_exc();
        return False

    if price_token_wei is None: 
        return False

    try:
       
        approval_successful = approve_token_spending(DATA_REGISTRY_ADDRESS, price_token_wei)
        if not approval_successful:
            print("Purchase aborted due to token approval failure.")
            return False

        print("Token approval successful. Proceeding with purchase call...")
        
        nonce = w3.eth.get_transaction_count(consumer_account.address)


        try:
            estimated_gas_purchase = data_registry_contract.functions.purchaseData(
                listing_id
            ).estimate_gas({'from': consumer_account.address}) 
            print(f"Debug: Estimated gas for purchaseData: {estimated_gas_purchase}")
        except Exception as e:
            print(f"Gas estimation failed for purchaseData: {e}. Using default gas limit: 400000")
            estimated_gas_purchase = 400000

        transaction_dict_purchase = {
            'from': consumer_account.address,
            'nonce': nonce,
            'gas': estimated_gas_purchase + 50000, 
        }

        latest_block_purchase = w3.eth.get_block('latest')
        base_fee_purchase = latest_block_purchase.get('baseFeePerGas')

        if base_fee_purchase is not None: 
            try:
                max_priority_fee_gwei = w3.to_wei('2', 'gwei')
                transaction_dict_purchase['maxPriorityFeePerGas'] = int(max_priority_fee_gwei)
            except ValueError:
                transaction_dict_purchase['maxPriorityFeePerGas'] = 2 * 10**9

            try:
                calculated_max_fee = (int(base_fee_purchase) * 2) + transaction_dict_purchase['maxPriorityFeePerGas']
                transaction_dict_purchase['maxFeePerGas'] = int(calculated_max_fee)
            except ValueError:
                transaction_dict_purchase['maxFeePerGas'] = int(w3.eth.gas_price * 3) if w3.eth.gas_price else 60 * 10**9
            
            print(f"Debug: Using EIP-1559 fees for purchase: maxPriorityFeePerGas={transaction_dict_purchase['maxPriorityFeePerGas']}, maxFeePerGas={transaction_dict_purchase['maxFeePerGas']}")
        else: 
            transaction_dict_purchase['gasPrice'] = int(w3.eth.gas_price)
            print(f"Debug: Using legacy gasPrice for purchase: {transaction_dict_purchase['gasPrice']}")

        print(f"Debug: Transaction dict for purchaseData: {transaction_dict_purchase}")

        transaction_purchase = data_registry_contract.functions.purchaseData(
            listing_id 
        ).build_transaction(transaction_dict_purchase) 
        
        print(f"Debug: Built transaction for purchaseData: {transaction_purchase}")

        signed_tx_purchase = w3.eth.account.sign_transaction(transaction_purchase, CONSUMER_PRIVATE_KEY)
        print(f"Debug: Signed transaction for purchase. Type: {type(signed_tx_purchase)}")

       
        tx_hash_bytes_purchase = None # Initialize
        try:
            tx_hash_bytes_purchase = w3.eth.send_raw_transaction(signed_tx_purchase.raw_transaction) # Use .
            tx_hash_hex_purchase = w3.to_hex(tx_hash_bytes_purchase)
            print(f"PURCHASE TX SENT: {tx_hash_hex_purchase}")
        except Exception as send_error:
            print(f"ERROR sending purchase transaction: {send_error}")
            import traceback; traceback.print_exc();
            return False

    
        print(f"Waiting for purchase transaction receipt (listing ID: {listing_id})...")
        tx_receipt_purchase = w3.eth.wait_for_transaction_receipt(tx_hash_bytes_purchase, timeout=240)

        if tx_receipt_purchase.status == 1:
            print(f"SUCCESS: Data purchased for listing ID {listing_id}. Block: {tx_receipt_purchase.blockNumber}")
            return True
        else:
            print(f"ERROR: Purchase transaction for listing ID {listing_id} FAILED. Receipt: {tx_receipt_purchase}")
            return False
            
    except Exception as e:
        print(f"ERROR in outer try-except of purchase_data_on_chain for listing ID {listing_id}: {e}")
        import traceback; traceback.print_exc();
        return False


def fetch_from_ipfs(cid):
    print(f"Fetching data from IPFS with CID: {cid}...")
    if not cid or "DUMMY_CID" in cid:
        print("Invalid or dummy CID provided, cannot fetch.")
        return None
    content = None
    if ipfs_client:
        try:
            content_bytes = ipfs_client.cat(cid, timeout=30)
            try:
                content_str = content_bytes.decode('utf-8')
                content = json.loads(content_str)
            except (json.JSONDecodeError, UnicodeDecodeError): content = content_str
            return content
        except Exception as e: print(f"Error fetching CID {cid} from IPFS client: {e}. Trying gateway...")
    if IPFS_GATEWAY_URL:
        try:
            gateway_fetch_url = f"{IPFS_GATEWAY_URL.strip('/')}/{cid}"
            response = requests.get(gateway_fetch_url, timeout=60)
            response.raise_for_status()
            try: content = response.json()
            except requests.exceptions.JSONDecodeError: content = response.text
            return content
        except Exception as e: print(f"Error fetching CID {cid} from IPFS gateway: {e}")
    return None


if __name__ == "__main__":
    print("\n--- Auraweave Consumer Agent Starting (Sepolia & Stablecoin Mode) ---")
    print(f"Consumer MockUSDC Balance (start): {get_mock_token_balance()} MUSDC")

    listings = discover_listings(limit=5)
    if not listings:
        print("No listings found.")
    else:
        target_listing = None
        current_musdc_balance_wei = mock_erc20_contract.functions.balanceOf(consumer_account.address).call()

        for listing in listings:
            if listing['seller'].lower() == consumer_account.address.lower():
                print(f"Skipping own listing ID {listing['id']}")
                continue
            if current_musdc_balance_wei >= listing['price_token_wei']:
                target_listing = listing
                print(f"Selected listing ID {target_listing['id']} ('{target_listing['name']}') for purchase.")
                break
        
        if not target_listing:
            print("No affordable listings found (or only own listings).")
        else:
            purchase_successful = purchase_data_on_chain(target_listing['id']) 
            if purchase_successful:
                print(f"Consumer MockUSDC Balance (after purchase): {get_mock_token_balance()} MUSDC")
                data_content = fetch_from_ipfs(target_listing['dataCID'])
                if data_content:
                    print("\n--- PURCHASED DATA CONTENT ---")
                    print(json.dumps(data_content, indent=2))
                    print("----------------------------")
            else:
                print("Purchase was not successful.")
    print("\n--- Auraweave Consumer Agent Finished ---")