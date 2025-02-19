// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "hardhat/console.sol";

// Interface for ERC20 standard
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

// Mock implementation of the ERC20 standard
contract MockDAI is IERC20 {
    string public name = "Mock DAI";
    string public symbol = "mDAI";
    uint8 public decimals = 18;
    uint256 public override totalSupply;
    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    // Constructor to initialize the total supply and assign it to the deployer
    constructor(uint256 initialSupply) {
        require(initialSupply > 0, "Initial supply must be >0");
        totalSupply = initialSupply;
        balanceOf[msg.sender] = initialSupply;
    }

    // Transfer function to move tokens from sender to recipient
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        return true;
    }

    // Approve function to set allowance for a spender
    function approve(address spender, uint256 amount) public override returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    // TransferFrom function to move tokens on behalf of the owner
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        require(balanceOf[sender] >= amount, "Insufficient balance");
        require(allowance[sender][msg.sender] >= amount, "Allowance exceeded");
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        allowance[sender][msg.sender] -= amount;
        return true;
    }
}
