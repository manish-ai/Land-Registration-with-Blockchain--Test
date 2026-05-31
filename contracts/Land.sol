pragma solidity >= 0.5.2;
pragma experimental ABIEncoderV2;
contract Land {
    struct Landreg {
        uint id;
        uint area;
        string city;
        string state;
        uint landPrice;
        string propertyPID;
        string physicalSurveyNumber;
        string ipfsHash;
        string document;
    }

    struct Buyer{
        address id;
        string name;
        uint age;
        string city;
        string email;
        string verificationId;
        string documentHash;
    }

    struct Seller{
        address id;
        string name;
        uint age;
        string landsOwned;
        string verificationId;
        string documentHash;
    }

    struct LandInspector {
        uint id;
        string name;
        uint age;
        string designation;
    }

    struct LandRequest{
        uint reqId;
        address sellerId;
        address buyerId;
        uint landId;
        uint offerPrice;
    }

    //key value pairs
    mapping(uint => Landreg) public lands;
    mapping(uint => LandInspector) public InspectorMapping;
    mapping(address => Seller) public SellerMapping;
    mapping(address => Buyer) public BuyerMapping;
    mapping(uint => LandRequest) public RequestsMapping;

    mapping(address => bool) public RegisteredAddressMapping;
    mapping(address => bool) public RegisteredSellerMapping;
    mapping(address => bool) public RegisteredBuyerMapping;
    mapping(address => bool) public SellerVerification;
    mapping(address => bool) public SellerRejection;
    mapping(address => bool) public BuyerVerification;
    mapping(address => bool) public BuyerRejection;
    mapping(uint => bool) public LandVerification;
    mapping(uint => bool) public LandRejection;
    mapping(uint => address) public LandOwner;
    mapping(uint => bool) public RequestStatus;
    mapping(uint => bool) public RequestedLands;
    mapping(uint => bool) public PaymentReceived;

    mapping(bytes32 => bool) public registeredPIDs;
    mapping(bytes32 => bool) public registeredSurveyNumbers;

    address public Land_Inspector;
    address[] public sellers;
    address[] public buyers;

    uint public landsCount;
    uint public inspectorsCount;
    uint public sellersCount;
    uint public buyersCount;
    uint public requestsCount;

    event UserRegistered(address indexed user, string role, uint timestamp);
    event LandAdded(uint indexed landId, address indexed owner, uint timestamp);
    event LandRequested(uint indexed reqId, address indexed buyer, uint landId, uint timestamp);
    event RequestApproved(uint indexed reqId, address indexed seller, uint timestamp);
    event PaymentDone(address indexed buyer, address indexed seller, uint reqId, uint amount);
    event OwnershipTransferred(uint indexed landId, address indexed newOwner, uint timestamp);
    event Verified(address _id);
    event Rejected(address _id);
    event LandVerifiedEvent(uint indexed landId, uint timestamp);
    event LandRejectedEvent(uint indexed landId, uint timestamp);

    constructor() public{
        Land_Inspector = msg.sender ;
        addLandInspector("Inspector 1", 45, "Tehsil Manager");
    }

    function addLandInspector(string memory _name, uint _age, string memory _designation) private {
        inspectorsCount++;
        InspectorMapping[inspectorsCount] = LandInspector(inspectorsCount, _name, _age, _designation);
    }

    function getLandsCount() public view returns (uint) {
        return landsCount;
    }

    function getBuyersCount() public view returns (uint) {
        return buyersCount;
    }

    function getSellersCount() public view returns (uint) {
        return sellersCount;
    }

    function getRequestsCount() public view returns (uint) {
        return requestsCount;
    }

    function getArea(uint i) public view returns (uint) {
        return lands[i].area;
    }

    function getCity(uint i) public view returns (string memory) {
        return lands[i].city;
    }

    function getState(uint i) public view returns (string memory) {
        return lands[i].state;
    }

    function getPrice(uint i) public view returns (uint) {
        return lands[i].landPrice;
    }

    function getPID(uint i) public view returns (string memory) {
        return lands[i].propertyPID;
    }

    function getSurveyNumber(uint i) public view returns (string memory) {
        return lands[i].physicalSurveyNumber;
    }

    function getImage(uint i) public view returns (string memory) {
        return lands[i].ipfsHash;
    }

    function getDocument(uint i) public view returns (string memory) {
        return lands[i].document;
    }

    function getLandOwner(uint id) public view returns (address) {
        return LandOwner[id];
    }

    function verifySeller(address _sellerId) public{
        require(isLandInspector(msg.sender));

        SellerVerification[_sellerId] = true;
        emit Verified(_sellerId);
    }

    function rejectSeller(address _sellerId) public{
        require(isLandInspector(msg.sender));

        SellerRejection[_sellerId] = true;
        emit Rejected(_sellerId);
    }

    function verifyBuyer(address _buyerId) public{
        require(isLandInspector(msg.sender));

        BuyerVerification[_buyerId] = true;
        emit Verified(_buyerId);
    }

    function rejectBuyer(address _buyerId) public{
        require(isLandInspector(msg.sender));

        BuyerRejection[_buyerId] = true;
        emit Rejected(_buyerId);
    }

    function verifyLand(uint _landId) public{
        require(isLandInspector(msg.sender));

        LandVerification[_landId] = true;
        LandRejection[_landId] = false;

        emit LandVerifiedEvent(_landId, block.timestamp);
    }

    function rejectLand(uint _landId) public{
        require(isLandInspector(msg.sender));

        LandRejection[_landId] = true;
        LandVerification[_landId] = false;

        emit LandRejectedEvent(_landId, block.timestamp);
    }

    function isLandVerified(uint _id) public view returns (bool) {
        if(LandVerification[_id]){
            return true;
        }
    }

    function isLandRejected(uint _id) public view returns (bool) {
        if(LandRejection[_id]){
            return true;
        }
    }

    function isVerified(address _id) public view returns (bool) {
        if(SellerVerification[_id] || BuyerVerification[_id]){
            return true;
        }
    }

    function isRejected(address _id) public view returns (bool) {
        if(SellerRejection[_id] || BuyerRejection[_id]){
            return true;
        }
    }

    function isSeller(address _id) public view returns (bool) {
        if(RegisteredSellerMapping[_id]){
            return true;
        }
    }

    function isLandInspector(address _id) public view returns (bool) {
        if(Land_Inspector == _id){
            return true;
        }else{
            return false;
        }
    }

    function isBuyer(address _id) public view returns (bool) {
        if(RegisteredBuyerMapping[_id]){
            return true;
        }
    }

    function isRegistered(address _id) public view returns (bool) {
        if(RegisteredAddressMapping[_id]){
            return true;
        }
    }

    function addLand(uint _area, string memory _city, string memory _state, uint landPrice, string memory _propertyPID, string memory _surveyNum, string memory _ipfsHash, string memory _document) public {
        require((isSeller(msg.sender)) && (isVerified(msg.sender)));

        bytes32 pidHash = keccak256(abi.encodePacked(_propertyPID));
        bytes32 surveyHash = keccak256(abi.encodePacked(_surveyNum));
        require(!registeredPIDs[pidHash], "PID already registered on blockchain");
        require(!registeredSurveyNumbers[surveyHash], "Survey number already registered");

        registeredPIDs[pidHash] = true;
        registeredSurveyNumbers[surveyHash] = true;

        landsCount++;
        lands[landsCount] = Landreg(landsCount, _area, _city, _state, landPrice, _propertyPID, _surveyNum, _ipfsHash, _document);
        LandOwner[landsCount] = msg.sender;

        emit LandAdded(landsCount, msg.sender, block.timestamp);
    }

    //registration of seller
    function registerSeller(string memory _name, uint _age, string memory _landsOwned, string memory _verificationId, string memory _documentHash) public {
        //require that Seller is not already registered
        require(!RegisteredAddressMapping[msg.sender]);

        RegisteredAddressMapping[msg.sender] = true;
        RegisteredSellerMapping[msg.sender] = true ;
        sellersCount++;
        SellerMapping[msg.sender] = Seller(msg.sender, _name, _age, _landsOwned, _verificationId, _documentHash);
        sellers.push(msg.sender);

        emit UserRegistered(msg.sender, "Seller", block.timestamp);
    }

    function updateSeller(string memory _name, uint _age, string memory _landsOwned) public {
        //require that Seller is already registered
        require(RegisteredAddressMapping[msg.sender] && (SellerMapping[msg.sender].id == msg.sender));

        SellerMapping[msg.sender].name = _name;
        SellerMapping[msg.sender].age = _age;
        SellerMapping[msg.sender].landsOwned = _landsOwned;
    }

    function getSeller() public view returns( address [] memory ){
        return(sellers);
    }

    function getSellerDetails(address i) public view returns (string memory, uint, string memory, string memory, string memory) {
        return (SellerMapping[i].name, SellerMapping[i].age, SellerMapping[i].landsOwned, SellerMapping[i].verificationId, SellerMapping[i].documentHash);
    }

    function registerBuyer(string memory _name, uint _age, string memory _city, string memory _email, string memory _verificationId, string memory _documentHash) public {
        //require that Buyer is not already registered
        require(!RegisteredAddressMapping[msg.sender]);

        RegisteredAddressMapping[msg.sender] = true;
        RegisteredBuyerMapping[msg.sender] = true ;
        buyersCount++;
        BuyerMapping[msg.sender] = Buyer(msg.sender, _name, _age, _city, _email, _verificationId, _documentHash);
        buyers.push(msg.sender);

        emit UserRegistered(msg.sender, "Buyer", block.timestamp);
    }

    function updateBuyer(string memory _name, uint _age, string memory _city, string memory _email) public {
        //require that Buyer is already registered
        require(RegisteredAddressMapping[msg.sender] && (BuyerMapping[msg.sender].id == msg.sender));

        BuyerMapping[msg.sender].name = _name;
        BuyerMapping[msg.sender].age = _age;
        BuyerMapping[msg.sender].city = _city;
        BuyerMapping[msg.sender].email = _email;
    }

    function getBuyer() public view returns( address [] memory ){
        return(buyers);
    }

    function getBuyerDetails(address i) public view returns (string memory, uint, string memory, string memory, string memory, string memory) {
        return (BuyerMapping[i].name, BuyerMapping[i].age, BuyerMapping[i].city, BuyerMapping[i].email, BuyerMapping[i].verificationId, BuyerMapping[i].documentHash);
    }

    function requestLand(address _sellerId, uint _landId, uint _offerPrice) public{
        require(isBuyer(msg.sender) && isVerified(msg.sender));

        requestsCount++;
        RequestsMapping[requestsCount] = LandRequest(requestsCount, _sellerId, msg.sender, _landId, _offerPrice);
        RequestStatus[requestsCount] = false;
        RequestedLands[requestsCount] = true;

        emit LandRequested(requestsCount, msg.sender, _landId, block.timestamp);
    }

    function getRequestDetails (uint i) public view returns (address, address, uint, bool, uint) {
        return(RequestsMapping[i].sellerId, RequestsMapping[i].buyerId, RequestsMapping[i].landId, RequestStatus[i], RequestsMapping[i].offerPrice);
    }

    function isRequested(uint _id) public view returns (bool) {
        if(RequestedLands[_id]){
            return true;
        }
    }

    function isApproved(uint _id) public view returns (bool) {
        if(RequestStatus[_id]){
            return true;
        }
    }

    function approveRequest(uint _reqId) public {
        require((isSeller(msg.sender)) && (isVerified(msg.sender)));

        RequestStatus[_reqId] = true;

        emit RequestApproved(_reqId, msg.sender, block.timestamp);
    }

    function LandOwnershipTransfer(uint _landId, address _newOwner) public{
        require(isLandInspector(msg.sender));

        LandOwner[_landId] = _newOwner;

        emit OwnershipTransferred(_landId, _newOwner, block.timestamp);
    }

    function isPaid(uint _reqId) public view returns (bool) {
        if(PaymentReceived[_reqId]){
            return true;
        }
    }

    function payment(address payable _receiver, uint _reqId) public payable {
        require(RequestsMapping[_reqId].buyerId == msg.sender, "Not the authorized buyer");
        require(RequestStatus[_reqId] == true, "Request not approved by seller");
        require(!PaymentReceived[_reqId], "Already paid");

        PaymentReceived[_reqId] = true;
        _receiver.transfer(msg.value);

        emit PaymentDone(msg.sender, _receiver, _reqId, msg.value);
    }
}
