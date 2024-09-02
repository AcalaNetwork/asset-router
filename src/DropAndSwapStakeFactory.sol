// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";
import { SafeTransferLib } from "solmate/utils/SafeTransferLib.sol";
import { FeeRegistry } from "./FeeRegistry.sol";
import { DropAndSwapStakeRouter, DropAndSwapStakeInstructions } from "./DropAndSwapStakeRouter.sol";

contract DropAndSwapStakeFactory {
    using SafeTransferLib for ERC20;

    function deployDropAndSwapStakeRouter(
        FeeRegistry fees,
        DropAndSwapStakeInstructions memory inst,
        uint256 dropAmount
    ) public returns (DropAndSwapStakeRouter) {
        require(
            inst.recipient != address(0) && inst.feeReceiver != address(0) && address(inst.dropToken) != address(0)
                && inst.euphrates != address(0),
            "invalid inst"
        );

        // no need to use salt as we want to keep the router address the same for the same fees &instructions
        bytes32 salt;

        DropAndSwapStakeRouter router;
        try new DropAndSwapStakeRouter{salt: salt}(fees, inst) returns (DropAndSwapStakeRouter router_) {
            router = router_;
        } catch {
            router = DropAndSwapStakeRouter(
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
                                            type(DropAndSwapStakeRouter).creationCode, abi.encode(fees, inst)
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

    function deployDropAndSwapStakeRouterAndRoute(
        FeeRegistry fees,
        DropAndSwapStakeInstructions memory inst,
        ERC20 token,
        uint256 dropAmount
    ) public {
        DropAndSwapStakeRouter router = deployDropAndSwapStakeRouter(fees, inst, dropAmount);
        router.route(token, msg.sender);
    }

    function deployDropAndSwapStakeRouterAndRouteNoFee(
        FeeRegistry fees,
        DropAndSwapStakeInstructions memory inst,
        ERC20 token,
        uint256 dropAmount
    ) public {
        DropAndSwapStakeRouter router = deployDropAndSwapStakeRouter(fees, inst, dropAmount);
        router.routeNoFee(token);
    }

    function deployDropAndSwapStakeRouterAndRescue(
        FeeRegistry fees,
        DropAndSwapStakeInstructions memory inst,
        ERC20 token,
        uint256 dropAmount,
        bool isGasDrop
    ) public {
        DropAndSwapStakeRouter router = deployDropAndSwapStakeRouter(fees, inst, dropAmount);
        router.rescue(token, isGasDrop);
    }
}
