// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";
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

        DropAndBootstrapStakeRouter router;
        try new DropAndBootstrapStakeRouter{ salt: salt }(fees, inst) returns (DropAndBootstrapStakeRouter router_) {
            router = router_;
        } catch {
            router = DropAndBootstrapStakeRouter(
                address(
                    uint160(
                        uint256(
                            keccak256(
                                abi.encodePacked(
                                    bytes1(0xff),
                                    address(this),
                                    salt,
                                    keccak256(
                                        abi.encodePacked(
                                            type(DropAndBootstrapStakeRouter).creationCode, abi.encode(fees, inst)
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            );
        }

        if (dropAmount > 0) {
            inst.dropToken.safeTransferFrom(msg.sender, address(router), dropAmount);
        }

        return router;
    }

    function deployDropAndBootstrapStakeRouterAndRoute(
        FeeRegistry fees,
        DropAndBootstrapStakeInstructions memory inst,
        ERC20 token,
        uint256 dropAmount
    ) public {
        DropAndBootstrapStakeRouter router = deployDropAndBootstrapStakeRouter(fees, inst, dropAmount);
        router.route(token, msg.sender);
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
        ERC20 token,
        uint256 dropAmount,
        bool isGasDrop
    ) public {
        DropAndBootstrapStakeRouter router = deployDropAndBootstrapStakeRouter(fees, inst, dropAmount);
        router.rescue(token, isGasDrop);
    }
}
