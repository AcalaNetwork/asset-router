// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";

import "../src/EuphratesRouter.sol";
import "../src/FeeRegistry.sol";
import "./MockToken.sol";
import "./MockEuphrates.sol";

contract EuphratesRouterTest is Test {
    FeeRegistry public fees;
    MockToken public token1;
    MockToken public token2;
    MockToken public token3;
    MockEuphrates public euphrates;
    address public alice = address(0x01010101010101010101);
    address public bob = address(0x02020202020202020202);
    address public charlie = address(0x03030303030303030303);

    function setUp() public {
        token1 = new MockToken("Token1", "TK1");
        token2 = new MockToken("Token2", "TK2");
        token3 = new MockToken("token3", "TK3");

        Fee[] memory feeArray = new Fee[](2);
        feeArray[0] = Fee(address(token1), 1 ether);
        feeArray[1] = Fee(address(token2), 2 ether);

        fees = new FeeRegistry(feeArray);

        euphrates = new MockEuphrates();
        //vm.etch(EUPHRATES, address(euphrates).code);
        euphrates.addPool(IERC20(address(token1)));
        euphrates.addPool(IERC20(address(token2)));
    }

    function testRouteWithFee() public {
        EuphratesInstructions memory inst = EuphratesInstructions(0, alice);
        EuphratesRouter router = new EuphratesRouter(fees, inst, address(euphrates));

        token1.transfer(address(router), 5 ether);

        vm.prank(bob);
        router.route(token1, bob);

        assertEq(token1.balanceOf(address(router)), 0);
        assertEq(euphrates.shares(0, alice), 4 ether); // (amount - fee)
        assertEq(token1.balanceOf(bob), 1 ether); // fee
    }

    function testRouteWithFeeWithOtherRecipient() public {
        EuphratesInstructions memory inst = EuphratesInstructions(0, alice);
        EuphratesRouter router = new EuphratesRouter(fees, inst, address(euphrates));

        token1.transfer(address(router), 5 ether);

        vm.prank(bob);
        router.route(token1, charlie);

        assertEq(token1.balanceOf(address(router)), 0);
        assertEq(euphrates.shares(0, alice), 4 ether); // (amount - fee)
        assertEq(token1.balanceOf(charlie), 1 ether); // fee
    }

    function testRouteWithoutFee() public {
        EuphratesInstructions memory inst = EuphratesInstructions(0, alice);
        EuphratesRouter router = new EuphratesRouter(fees, inst, address(euphrates));

        token1.transfer(address(router), 5 ether);

        vm.prank(bob);
        router.routeNoFee(token1);

        assertEq(token1.balanceOf(address(router)), 0);
        assertEq(euphrates.shares(0, alice), 5 ether);
        assertEq(token1.balanceOf(bob), 0);
    }

    function testRouteForNotMatchedToken() public {
        EuphratesInstructions memory inst = EuphratesInstructions(0, alice);
        EuphratesRouter router = new EuphratesRouter(fees, inst, address(euphrates));

        token2.transfer(address(router), 5 ether);

        vm.prank(bob);
        router.route(token2, bob);

        assertEq(token2.balanceOf(address(router)), 0);
        assertEq(euphrates.shares(0, alice), 0);
        assertEq(token2.balanceOf(alice), 3 ether); // (amount - fee)
        assertEq(token2.balanceOf(bob), 2 ether); // fee
    }
}
