// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import { ERC20 } from "solmate/tokens/ERC20.sol";

import "../src/SwapFactory.sol";
import "../src/SwapRouter.sol";
import "../src/FeeRegistry.sol";
import "./MockToken.sol";

contract SwapFactoryTest is Test {
    FeeRegistry public fees;
    MockToken public token1;
    MockToken public token2;
    MockToken public token3;
    SwapFactory public factory;
    address public alice = address(0x01010101010101010101);
    address public bob = address(0x02020202020202020202);
    address public maker = address(0x03030303030303030303);

    function setUp() public {
        token1 = new MockToken("Token1", "TK1");
        token2 = new MockToken("Token2", "TK2");
        token3 = new MockToken("token3", "TK3");

        Fee[] memory feeArray = new Fee[](2);
        feeArray[0] = Fee(address(token1), 1 ether);
        feeArray[1] = Fee(address(token2), 2 ether);

        fees = new FeeRegistry(feeArray);

        factory = new SwapFactory();
    }

    function testDeploySwapRouter_failedForInvalidInst() public {
        SwapInstructions memory inst1 = SwapInstructions(address(0), 2 ether, maker, token2);
        SwapInstructions memory inst2 = SwapInstructions(alice, 2 ether, address(0), token2);
        SwapInstructions memory inst3 = SwapInstructions(alice, 2 ether, maker, ERC20(address(0)));

        vm.startPrank(maker);

        vm.expectRevert("invalid inst");
        factory.deploySwapRouter(fees, inst1, 0);
        vm.expectRevert("invalid inst");
        factory.deploySwapRouter(fees, inst2, 0);
        vm.expectRevert("invalid inst");
        factory.deploySwapRouter(fees, inst3, 0);
    }

    function testDeploySwapRouter_withZeroTargetAmount() public {
        SwapInstructions memory inst1 = SwapInstructions(alice, 2 ether, maker, token2);

        vm.prank(bob);
        factory.deploySwapRouter(fees, inst1, 0);

        vm.prank(maker);
        factory.deploySwapRouter(fees, inst1, 0);
    }

    function testDeploySwapRouter_withTargetAmount() public {
        SwapInstructions memory inst1 = SwapInstructions(alice, 2 ether, maker, token2);
        SwapInstructions memory inst2 = SwapInstructions(alice, 2 ether, bob, token2);

        vm.prank(bob);
        vm.expectRevert("TRANSFER_FROM_FAILED");
        factory.deploySwapRouter(fees, inst1, 10 ether);

        token2.transfer(bob, 10 ether);
        vm.startPrank(bob);

        token2.approve(address(factory), 10 ether);

        assertEq(token2.balanceOf(bob), 10 ether);
        SwapRouter router = factory.deploySwapRouter(fees, inst2, 10 ether);
        assertEq(token2.balanceOf(bob), 0);
        assertEq(token2.balanceOf(address(router)), 10 ether);
    }
}
