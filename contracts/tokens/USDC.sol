// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.17;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract USDC is ERC20 {
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner can call this function");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _supply
    ) ERC20(_name, _symbol) {
        _mint(msg.sender, _supply);
        owner = msg.sender;
    }

    function decimals() public view override returns (uint8) {
        return 6;
    }

    function burn(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
    }

    function setOwner(address debtContract) public onlyOwner {
        owner = debtContract;
    }
}
