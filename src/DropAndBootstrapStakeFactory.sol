// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";
import { Create2 } from "@openzeppelin/contracts/utils/Create2.sol";
import { SafeTransferLib } from "solmate/utils/SafeTransferLib.sol";
import { FeeRegistry } from "./FeeRegistry.sol";
import { DropAndBootstrapStakeRouter, DropAndBootstrapStakeInstructions } from "./DropAndBootstrapStakeRouter.sol";

contract DropAndBootstrapStakeFactory {
    using SafeTransferLib for ERC20;

    function deployDropAndBootstrapStakeRouter(
        FeeRegistry fees,
        DropAndBootstrapStakeInstructions memory inst,
        uint256 dropAmount
    ) public returns (DropAndBootstrapStakeRouter) {
        require(
            inst.recipient != address(0) && inst.feeReceiver != address(0) && address(inst.dropToken) != address(0)
                && inst.euphrates != address(0) && address(inst.otherContributionToken) != address(0),
            "invalid inst"
        );

        // no need to use salt as we want to keep the router address the same for the same fees &instructions
        bytes32 salt;
        bytes memory bytecode = abi.encodePacked(type(DropAndBootstrapStakeRouter).creationCode, abi.encode(fees, inst));
        address routerAddr = Create2.computeAddress(salt, keccak256(bytecode));

        if (routerAddr.code.length == 0) {
            routerAddr = Create2.deploy(0, salt, bytecode);

            if (dropAmount > 0) {
                inst.dropToken.safeTransferFrom(msg.sender, routerAddr, dropAmount);
            }
        }

        return DropAndBootstrapStakeRouter(routerAddr);
    }

    function deployDropAndBootstrapStakeRouterAndRoute(
        FeeRegistry fees,
        DropAndBootstrapStakeInstructions memory inst,
        ERC20 token,
        uint256 dropAmount
    ) public {
        DropAndBootstrapStakeRouter router = deployDropAndBootstrapStakeRouter(fees, inst, dropAmount);
        router.route(token, msg.sender, false);
    }

    function deployDropAndBootstrapStakeRouterAndRouteNoFee(
        FeeRegistry fees,
        DropAndBootstrapStakeInstructions memory inst,
        ERC20 token,
        uint256 dropAmount
    ) public {
        DropAndBootstrapStakeRouter router = deployDropAndBootstrapStakeRouter(fees, inst, dropAmount);
        router.routeNoFee(token);
    }

    function deployDropAndBootstrapStakeRouterAndRescue(
        FeeRegistry fees,
        DropAndBootstrapStakeInstructions memory inst,
        uint256 dropAmount,
        ERC20[] memory tokens
    ) public {
        DropAndBootstrapStakeRouter router = deployDropAndBootstrapStakeRouter(fees, inst, dropAmount);
        router.rescue(tokens);
    }
}
