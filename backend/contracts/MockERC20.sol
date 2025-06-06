
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockERC20 is ERC20, Ownable {
    constructor(string memory name, string memory symbol, address initialOwner) ERC20(name, symbol) Ownable(initialOwner) {
        
        // _mint(initialOwner, 1000000 * (10**decimals())); 
    }

    /**
     * @dev Creates `amount` new tokens for `to`.
     * See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // The Ownable contract provides an `owner()` view function and `transferOwnership(newOwner)`
    // We rely on msg.sender being the initial owner due to Ownable constructor.
}