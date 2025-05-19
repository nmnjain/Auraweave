
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


contract DataRegistry {
    

    uint256 private _listingIdsCounter; 

    struct DataListing {
        uint256 id;
        address payable seller;
        string name;
        string description;
        string dataCID; 
        uint256 price;  // in wei
        bool active;
    }

    mapping(uint256 => DataListing) public listings;
    uint256[] public activeListingIds;

    event DataListed(
        uint256 indexed listingId,
        address indexed seller,
        string name,
        string dataCID,
        uint256 price
    );

    event DataPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );

    modifier isActive(uint256 _listingId) {
        require(listings[_listingId].active, "Listing not active");
        _;
    }

    function listData(
        string memory _name,
        string memory _description,
        string memory _dataCID,
        uint256 _price 
    ) public {
        require(_price > 0, "Price must be > 0");
        require(bytes(_dataCID).length > 0, "Data CID required");

        _listingIdsCounter++; 
        uint256 newListingId = _listingIdsCounter;

        listings[newListingId] = DataListing({
            id: newListingId,
            seller: payable(msg.sender),
            name: _name,
            description: _description,
            dataCID: _dataCID,
            price: _price,
            active: true
        });
        activeListingIds.push(newListingId);
        emit DataListed(newListingId, msg.sender, _name, _dataCID, _price);
    }

   
    function purchaseData(uint256 _listingId) public payable isActive(_listingId) {
        DataListing storage listing = listings[_listingId];
        require(msg.value >= listing.price, "Insufficient ETH sent");

        (bool success, ) = listing.seller.call{value: listing.price}("");
        require(success, "Payment transfer failed");

        emit DataPurchased(_listingId, msg.sender, listing.seller, listing.price);

        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
    }

    function getListing(uint256 _listingId) public view returns (DataListing memory) {
        // Ensure _listingId > 0 if your IDs start from 1
        require(_listingId > 0 && _listingId <= _listingIdsCounter, "Invalid listing ID");
        return listings[_listingId];
    }

    function getActiveListingsDetails(uint256 _limit, uint256 _offset) public view returns (DataListing[] memory) {
        uint256 activeCount = activeListingIds.length;
        if (_offset >= activeCount) {
            return new DataListing[](0);
        }
        uint256 count = activeCount - _offset < _limit ? activeCount - _offset : _limit;

        DataListing[] memory result = new DataListing[](count);
        for(uint i = 0; i < count; i++) {
            // listings mapping is still valid, activeListingIds stores the correct IDs
            result[i] = listings[activeListingIds[_offset + i]];
        }
        return result;
    }
}