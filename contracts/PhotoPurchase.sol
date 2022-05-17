pragma solidity ^0.5.0;

contract PhotoPurchase {

  address[500] public runners;

  // Purchasing a photo
  function purchase(uint photoId, address payable recipient) public payable {
    require(photoId >= 0 && photoId < 500);
    runners[photoId] = msg.sender;
    recipient.transfer(msg.value);
  }

  // Retrieving the runners
  function getRunners() public view returns (address[500] memory) {
    return runners;
  }
}
