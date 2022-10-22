// SPDX-License-Identifier:  GPL-3.0-or-later

pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


interface IDNFT {
    function ownerOf(uint256) view external returns(address sbtOwner);
}



contract Administrable {
    address public admin;
    address public pendingAdmin;
    address public owner;
    event LogSetAdmin(address admin);
    event LogTransferAdmin(address oldadmin, address newadmin);
    event LogAcceptAdmin(address admin);

    function setAdmin(address admin_) internal {
        admin = admin_;
        owner = admin;
        emit LogSetAdmin(admin_);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        address oldAdmin = pendingAdmin;
        pendingAdmin = newAdmin;
        emit LogTransferAdmin(oldAdmin, newAdmin);
    }

    function acceptAdmin() external {
        require(msg.sender == pendingAdmin);
        admin = pendingAdmin;
        pendingAdmin = address(0);
        emit LogAcceptAdmin(admin);
    }

    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
}


contract claimBounty is Administrable, Initializable, AccessControlUpgradeable {

    uint256 public pocFactor;
    address public idnft;
    address public bountyTokenAddr;

    mapping(uint256 => uint256) public bountyBalance;

    event ClaimBounty(address claimer, uint256 tokenId, uint256 amount);
    event AddBounty(uint256[] tokenIds, uint256[] amounts);
    event RemoveBounty(address bountyAdmin, uint256 amount);


    function initialize() public initializer {
        __initRole();
    }

    bytes32 public constant ROLE_BOUNTY = keccak256("ROLE_BOUNTY");

    function __initRole() internal {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // This is set to the USDC address on the deployment chain
    function setBountyTokenAddress(address _bountyTokenAddr) public {
        _checkRole(DEFAULT_ADMIN_ROLE);
        bountyTokenAddr = _bountyTokenAddr;
    }

    // The address of the IDNFT SBT token
    function setIdNFT(address idnft_) external {
        _checkRole(DEFAULT_ADMIN_ROLE);
         idnft = idnft_;
     }

     // pocFactor of 10000 means that 1 POC = 1 USDC bounty. Can be adjusted
    function setPocFactor(uint256 _pocFactor) public {
        _checkRole(DEFAULT_ADMIN_ROLE);
        require(_pocFactor <= 10000, "pocFactor must be less than or equal to 10000 ");
        pocFactor = _pocFactor;
    }

    // view function for the frontend, so users can see how much USDC bounty they can claim
    function getBounty(uint256 tokenId) public view returns(uint256 bounty) {
        return( pocFactor * bountyBalance[tokenId] / 10000 );
    }

    // Enables users to claim their USDC bounty for their SBT tokenID whenever they wish to
    function claimPocBounty(uint256 tokenId) public {
        require(IDNFT(idnft).ownerOf(tokenId) == msg.sender, "claimBounty: Cannot claim POC for an SBT that is not yours");
        uint256 bal = pocFactor * bountyBalance[tokenId]/ 10000;
        bountyBalance[tokenId] = 0;
        IERC20(bountyTokenAddr).approve(address(this), bal);
        IERC20(bountyTokenAddr).transferFrom(address(this), msg.sender, bal);
        emit ClaimBounty(msg.sender, tokenId, bal);
    }

    // POC admin can add to the bounty of multiple users' SBT tokenIDs. The USDC is sent to the contract here
    function addPOCBounty(uint256[] calldata tokenIds, uint256[] calldata amounts) public {
        _checkRole(ROLE_BOUNTY);
        uint256 total;
        for (uint i = 0; i < tokenIds.length; i++) {
            bountyBalance[tokenIds[i]] += amounts[i];
            total += amounts[i];
        }
        total = total * pocFactor / 10000;
        IERC20(bountyTokenAddr).transferFrom(msg.sender, address(this), total);
        emit AddBounty(tokenIds, amounts);
    }

    // POC admin can remove the USDC from the contract - emergency use.
    function removePOCBounty(uint256 amount) public {
        _checkRole(ROLE_BOUNTY);
        IERC20(bountyTokenAddr).transferFrom(address(this), msg.sender, amount);
        emit RemoveBounty(msg.sender, amount);
    }

}