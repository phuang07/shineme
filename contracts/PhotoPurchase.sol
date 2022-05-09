pragma solidity ^0.5.0;

contract PhotoPurchase {
address[999999] public runners;

// Purchasing a photo
function purchase(uint photoId) public returns (uint) {
  require(photoId >= 0 && photoId <= 999999);

  runners[photoId] = msg.sender;

  return photoId;
}

// Retrieving the runners
function getRunners() public view returns (address[999999] memory) {
  return runners;
}



}
