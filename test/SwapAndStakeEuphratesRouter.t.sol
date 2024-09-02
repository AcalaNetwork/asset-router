// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";

import "../src/SwapAndStakeEuphratesRouter.sol";
import "../src/FeeRegistry.sol";
import "./MockToken.sol";
import "./MockEuphrates.sol";

contract SwapAndStakeEuphratesRouterTest is Test {
    FeeRegistry public fees;
    MockToken public token1;
    MockToken public token2;
    MockToken public token3;
    MockEuphrates public euphrates;
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

        euphrates = new MockEuphrates();
        euphrates.addPool(IERC20(address(token1)));
        euphrates.addPool(IERC20(address(token3)));
    }

    function testRouteWithFee_zeroTargetToken() public {
        SwapAndStakeEuphratesInstructions memory inst =
            SwapAndStakeEuphratesInstructions(alice, 2 ether, maker, token2, 0, address(euphrates));
        SwapAndStakeEuphratesRouter router = new SwapAndStakeEuphratesRouter(fees, inst);

        token1.transfer(address(router), 6 ether);

        assertEq(token1.balanceOf(address(router)), 6 ether);
        assertEq(token2.balanceOf(address(router)), 0);
        assertEq(token1.balanceOf(alice), 0);
        assertEq(token2.balanceOf(alice), 0);
        assertEq(token1.balanceOf(bob), 0);
        assertEq(token1.balanceOf(maker), 0);
        assertEq(token2.balanceOf(maker), 0);
        assertEq(token1.balanceOf(address(euphrates)), 0);
        assertEq(euphrates.shares(0, alice), 0);

        vm.prank(bob);
        router.route(token1, bob);
        assertEq(token1.balanceOf(address(router)), 0);
        assertEq(token2.balanceOf(address(router)), 0);
        assertEq(token1.balanceOf(alice), 0);
        assertEq(token2.balanceOf(alice), 0);
        assertEq(token1.balanceOf(bob), 1 ether);
        assertEq(token1.balanceOf(maker), 2 ether);
        assertEq(token2.balanceOf(maker), 0);
        assertEq(token1.balanceOf(address(euphrates)), 3 ether);
        assertEq(euphrates.shares(0, alice), 3 ether);
    }

    function testRouteWithFee_zeroTargetToken_errorPoolId() public {
        SwapAndStakeEuphratesInstructions memory inst =
            SwapAndStakeEuphratesInstructions(alice, 2 ether, maker, token2, 1, address(euphrates));
        SwapAndStakeEuphratesRouter router = new SwapAndStakeEuphratesRouter(fees, inst);

        token1.transfer(address(router), 6 ether);

        assertEq(token1.balanceOf(address(router)), 6 ether);
        assertEq(token2.balanceOf(address(router)), 0);
        assertEq(token1.balanceOf(alice), 0);
        assertEq(token2.balanceOf(alice), 0);
        assertEq(token1.balanceOf(bob), 0);
        assertEq(token1.balanceOf(maker), 0);
        assertEq(token2.balanceOf(maker), 0);
        assertEq(token1.balanceOf(address(euphrates)), 0);
        assertEq(euphrates.shares(0, alice), 0);

        vm.prank(bob);
        router.route(token1, bob);
        assertEq(token1.balanceOf(address(router)), 0);
        assertEq(token2.balanceOf(address(router)), 0);
        assertEq(token1.balanceOf(alice), 3 ether);
        assertEq(token2.balanceOf(alice), 0);
        assertEq(token1.balanceOf(bob), 1 ether);
        assertEq(token1.balanceOf(maker), 2 ether);
        assertEq(token2.balanceOf(maker), 0);
        assertEq(token1.balanceOf(address(euphrates)), 0);
        assertEq(euphrates.shares(0, alice), 0);
    }

    function testRouteWithoutFee_zeroTargetToken() public {
        SwapAndStakeEuphratesInstructions memory inst =
            SwapAndStakeEuphratesInstructions(alice, 2 ether, maker, token2, 0, address(euphrates));
        SwapAndStakeEuphratesRouter router = new SwapAndStakeEuphratesRouter(fees, inst);

        token1.transfer(address(router), 6 ether);

        assertEq(token1.balanceOf(address(router)), 6 ether);
        assertEq(token2.balanceOf(address(router)), 0);
        assertEq(token1.balanceOf(alice), 0);
        assertEq(token2.balanceOf(alice), 0);
        assertEq(token1.balanceOf(maker), 0);
        assertEq(token2.balanceOf(maker), 0);
        assertEq(token1.balanceOf(address(euphrates)), 0);
        assertEq(euphrates.shares(0, alice), 0);

        vm.prank(bob);
        router.routeNoFee(token1);
        assertEq(token1.balanceOf(address(router)), 0);
        assertEq(token2.balanceOf(address(router)), 0);
        assertEq(token1.balanceOf(alice), 0);
        assertEq(token2.balanceOf(alice), 0);
        assertEq(token1.balanceOf(maker), 2 ether);
        assertEq(token2.balanceOf(maker), 0);
        assertEq(token1.balanceOf(address(euphrates)), 4 ether);
        assertEq(euphrates.shares(0, alice), 4 ether);
    }

    function testRouteWithoutFee_zeroTargetToken_errorPoolId() public {
        SwapAndStakeEuphratesInstructions memory inst =
            SwapAndStakeEuphratesInstructions(alice, 2 ether, maker, token2, 1, address(euphrates));
        SwapAndStakeEuphratesRouter router = new SwapAndStakeEuphratesRouter(fees, inst);

        token1.transfer(address(router), 6 ether);

        assertEq(token1.balanceOf(address(router)), 6 ether);
        assertEq(token2.balanceOf(address(router)), 0);
        assertEq(token1.balanceOf(alice), 0);
        assertEq(token2.balanceOf(alice), 0);
        assertEq(token1.balanceOf(maker), 0);
        assertEq(token2.balanceOf(maker), 0);
        assertEq(token1.balanceOf(address(euphrates)), 0);
        assertEq(euphrates.shares(0, alice), 0);

        vm.prank(bob);
        router.routeNoFee(token1);
        assertEq(token1.balanceOf(address(router)), 0);
        assertEq(token2.balanceOf(address(router)), 0);
        assertEq(token1.balanceOf(alice), 4 ether);
        assertEq(token2.balanceOf(alice), 0);
        assertEq(token1.balanceOf(maker), 2 ether);
        assertEq(token2.balanceOf(maker), 0);
        assertEq(token1.balanceOf(address(euphrates)), 0);
        assertEq(euphrates.shares(0, alice), 0);
    }

    function testRouteWithoutFee_zeroTargetToken_notEnoughSupplyAmount() public {
        SwapAndStakeEuphratesInstructions memory inst =
            SwapAndStakeEuphratesInstructions(alice, 10 ether, maker, token2, 0, address(euphrates));
        SwapAndStakeEuphratesRouter router = new SwapAndStakeEuphratesRouter(fees, inst);

        token1.transfer(address(router), 6 ether);

        assertEq(token1.balanceOf(address(router)), 6 ether);
        assertEq(token2.balanceOf(address(router)), 0);
        assertEq(token1.balanceOf(alice), 0);
        assertEq(token2.balanceOf(alice), 0);
        assertEq(token1.balanceOf(maker), 0);
        assertEq(token2.balanceOf(maker), 0);
        assertEq(token1.balanceOf(address(euphrates)), 0);
        assertEq(euphrates.shares(0, alice), 0);

        vm.prank(bob);
        vm.expectRevert("SwapAndStakeEuphratesRouter: not enough token supplied");
        router.routeNoFee(token1);
    }

    function testRescue_withTargetToken() public {
        SwapAndStakeEuphratesInstructions memory inst =
            SwapAndStakeEuphratesInstructions(alice, 2 ether, maker, token2, 0, address(euphrates));
        SwapAndStakeEuphratesRouter router = new SwapAndStakeEuphratesRouter(fees, inst);

        token1.transfer(address(router), 6 ether);
        token2.transfer(address(router), 10 ether);

        assertEq(token1.balanceOf(address(router)), 6 ether);
        assertEq(token2.balanceOf(address(router)), 10 ether);
        assertEq(token1.balanceOf(alice), 0);
        assertEq(token2.balanceOf(alice), 0);
        assertEq(token1.balanceOf(bob), 0);
        assertEq(token1.balanceOf(maker), 0);
        assertEq(token2.balanceOf(maker), 0);
        assertEq(token1.balanceOf(address(euphrates)), 0);
        assertEq(euphrates.shares(0, alice), 0);

        vm.prank(bob);
        router.rescue(token1);
        assertEq(token1.balanceOf(address(router)), 0);
        assertEq(token2.balanceOf(address(router)), 0);
        assertEq(token1.balanceOf(alice), 4 ether);
        assertEq(token2.balanceOf(alice), 10 ether);
        assertEq(token1.balanceOf(bob), 0);
        assertEq(token1.balanceOf(maker), 2 ether);
        assertEq(token2.balanceOf(maker), 0);
        assertEq(token1.balanceOf(address(euphrates)), 0);
        assertEq(euphrates.shares(0, alice), 0);
    }
}
