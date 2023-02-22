// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";

import "../src/Factory.sol";
import "../src/XcmRouter.sol";

contract CounterScript is Script {
    function setUp() public { }

    function run() public {
        vm.broadcast();

        // Factory f = new Factory();

        // XcmInstructions memory inst;
        // XcmRouter r1 = f.deployXcmRouter(inst);
        // XcmRouter r2 = f.deployXcmRouter(inst);

        // console2.logAddress(address(r1));
        // console2.logAddress(address(r2));
    }
}
