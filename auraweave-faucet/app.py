import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from web3 import Web3
from web3.middleware import geth_poa_middleware
from dotenv import load_dotenv
import json
import logging

load_dotenv() 

app = Flask(__name__)
CORS(app) 

# --- Configuration ---
RPC_URL = os.getenv("SEPOLIA_RPC_URL")
FAUCET_OPERATOR_PRIVATE_KEY = os.getenv("FAUCET_OPERATOR_PRIVATE_KEY")
MOCK_ERC20_ADDRESS = os.getenv("MOCK_ERC20_CONTRACT_ADDRESS")
MINT_AMOUNT_UNITS_STR = os.getenv("MINT_AMOUNT_UNITS", "100") 


# Basic logging
logging.basicConfig(level=logging.INFO)

if not all([RPC_URL, FAUCET_OPERATOR_PRIVATE_KEY, MOCK_ERC20_ADDRESS]):
    app.logger.error("CRITICAL: Missing one or more environment variables (RPC_URL, FAUCET_OPERATOR_PRIVATE_KEY, MOCK_ERC20_CONTRACT_ADDRESS)")
    

# --- Web3 Setup ---
w3 = None
faucet_account = None
mock_erc20_contract = None
MOCK_ERC20_ABI = None 

def initialize_web3():
    global w3, faucet_account, mock_erc20_contract, MOCK_ERC20_ABI
    if not RPC_URL or not FAUCET_OPERATOR_PRIVATE_KEY or not MOCK_ERC20_ADDRESS:
        app.logger.error("Cannot initialize Web3: Essential environment variables missing.")
        return False

    try:
        w3 = Web3(Web3.HTTPProvider(RPC_URL))
        
        w3.middleware_onion.inject(geth_poa_middleware, layer=0)

        if not w3.is_connected():
            app.logger.error(f"Failed to connect to Ethereum node at {RPC_URL}")
            return False

        faucet_account = w3.eth.account.from_key(FAUCET_OPERATOR_PRIVATE_KEY)
        app.logger.info(f"Faucet operator address: {faucet_account.address}")

        #
        backend_deployments_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'deployments', 'sepolia.json')
        if not os.path.exists(backend_deployments_path):
            
            app.logger.warning(f"Deployment file not found at {backend_deployments_path}. Using minimal ABI.")
            MOCK_ERC20_ABI = json.loads('[{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]')
        else:
            with open(backend_deployments_path, 'r') as f:
                deployment_info = json.load(f)
            MOCK_ERC20_ABI = deployment_info.get('MockERC20', {}).get('abi')

        if not MOCK_ERC20_ABI:
            app.logger.error("MockERC20 ABI could not be loaded.")
            return False

        mock_erc20_contract = w3.eth.contract(address=MOCK_ERC20_ADDRESS, abi=MOCK_ERC20_ABI)
        app.logger.info(f"MockERC20 contract initialized at address: {MOCK_ERC20_ADDRESS}")
        return True
    except Exception as e:
        app.logger.error(f"Error during Web3 initialization: {e}")
        return False


if not initialize_web3():
    app.logger.error("Web3 initialization failed on startup. Faucet may not function.")


@app.route('/request-tokens', methods=['POST'])
def request_tokens():
    if not w3 or not faucet_account or not mock_erc20_contract:
        return jsonify({"error": "Faucet service not properly initialized. Please try again later."}), 503

    data = request.get_json()
    if not data or 'address' not in data:
        return jsonify({"error": "Missing 'address' in request body"}), 400

    recipient_address_str = data['address']
 


    if not w3.is_address(recipient_address_str):
        return jsonify({"error": "Invalid recipient Ethereum address"}), 400
    
    recipient_address = w3.to_checksum_address(recipient_address_str)

    try:
        
        amount_to_mint_wei = w3.to_wei(MINT_AMOUNT_UNITS_STR, 'ether')

        nonce = w3.eth.get_transaction_count(faucet_account.address)
        
        
        tx_fields = {
            'from': faucet_account.address,
            'nonce': nonce,
        }
        latest_block = w3.eth.get_block('latest')
        base_fee = latest_block.get('baseFeePerGas')
        if base_fee is not None:
            priority_fee = w3.to_wei('2', 'gwei') 
            tx_fields['maxPriorityFeePerGas'] = priority_fee
            tx_fields['maxFeePerGas'] = (base_fee * 2) + priority_fee
        else: 
            tx_fields['gasPrice'] = w3.eth.gas_price

        app.logger.info(f"Attempting to mint {MINT_AMOUNT_UNITS_STR} MUSDC to {recipient_address}")
        
        mint_tx = mock_erc20_contract.functions.mint(
            recipient_address,
            amount_to_mint_wei
        ).build_transaction(tx_fields)

       
        try:
            gas_estimate = w3.eth.estimate_gas(mint_tx)
            mint_tx['gas'] = gas_estimate + 20000 
        except Exception as e:
            app.logger.warning(f"Gas estimation failed for mint: {e}. Using default 200k.")
            mint_tx['gas'] = 200000


        try:
            signed_tx = w3.eth.account.sign_transaction(mint_tx, FAUCET_OPERATOR_PRIVATE_KEY)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            app.logger.info(f"Mint transaction sent: {w3.to_hex(tx_hash)} for {recipient_address}")
        except Exception as e:
            app.logger.error(f"Failed to send transaction: {str(e)}")
            return jsonify({"error": "Failed to send transaction"}), 500

        # Don't wait for receipt here to keep API responsive, user can check Etherscan
        return jsonify({
            "message": f"{MINT_AMOUNT_UNITS_STR} MockUSDC mint transaction sent to {recipient_address}.",
            "transactionHash": w3.to_hex(tx_hash)
        }), 200

    except Exception as e:
        app.logger.error(f"Error processing token request for {recipient_address}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/')
def home():
    return "Auraweave MockUSDC Faucet is running!"

if __name__ == '__main__':
    # For local development, not used by Gunicorn/Railway
    # Try to re-initialize web3 if it failed at startup
    if not w3 or not faucet_account or not mock_erc20_contract:
        app.logger.info("Re-attempting Web3 initialization for local run...")
        initialize_web3()
    app.run(debug=True, host='0.0.0.0', port=int(os.getenv("PORT", 5001)))