
pragma solidity ^0.8.28;

// No OpenZeppelin Counters import needed if you refactored in previous step
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; 
import "@openzeppelin/contracts/utils/Context.sol"; 

contract DataRegistry {
    uint256 private _listingIdsCounter;

    address public acceptedTokenAddress; 

    struct DataListing {
        uint256 id;
        address payable seller; 
        string name;
        string description;
        string dataCID;
        string metadataCID; 
        uint256 price;      
        bool active;
    }

    mapping(uint256 => DataListing) public listings;
    uint256[] public activeListingIds;

    event DataListed(
        uint256 indexed listingId,
        address indexed seller,
        string name,
        string dataCID,
        string metadataCID,
        uint256 price,
        address tokenAddress 
    );

    event DataPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price,
        address tokenAddress
    );

    modifier isActive(uint256 _listingId) {
        require(listings[_listingId].active, "Listing not active");
        _;
    }

    // Constructor to set the accepted ERC20 token address
    constructor(address _tokenAddress) {
        require(_tokenAddress != address(0), "Token address cannot be zero");
        acceptedTokenAddress = _tokenAddress;
       
    }

    function listData(
        string memory _name,
        string memory _description,
        string memory _dataCID,
        string memory _metadataCID, // New parameter
        uint256 _price // Price in units of acceptedToken
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
            metadataCID: _metadataCID,
            price: _price,
            active: true
        });
        activeListingIds.push(newListingId);
        emit DataListed(newListingId, msg.sender, _name, _dataCID, _metadataCID, _price, acceptedTokenAddress);
    }

    function purchaseData(uint256 _listingId) public isActive(_listingId) {
        DataListing storage listing = listings[_listingId];
        IERC20 token = IERC20(acceptedTokenAddress);

        
        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= listing.price, "Check token allowance for DataRegistry contract");

       
        bool success = token.transferFrom(msg.sender, listing.seller, listing.price);
        require(success, "Token transfer failed");

        emit DataPurchased(_listingId, msg.sender, listing.seller, listing.price, acceptedTokenAddress);
    }

   
    function getListing(uint256 _listingId) public view returns (DataListing memory) {
        require(_listingId > 0 && _listingId <= _listingIdsCounter, "Invalid listing ID");
        return listings[_listingId];
    }

    function getActiveListingsDetails(uint256 _limit, uint256 _offset) public view returns (DataListing[] memory) {
        uint256 activeCount = activeListingIds.length;
        if (_offset >= activeCount) { return new DataListing[](0); }
        uint256 count = activeCount - _offset < _limit ? activeCount - _offset : _limit;
        DataListing[] memory result = new DataListing[](count);
        for(uint i = 0; i < count; i++) {
            result[i] = listings[activeListingIds[_offset + i]];
        }
        return result;
    }

    
}