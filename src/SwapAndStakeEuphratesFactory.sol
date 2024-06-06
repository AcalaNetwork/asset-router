// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";
import { SafeTransferLib } from "solmate/utils/SafeTransferLib.sol";
import { FeeRegistry } from "./FeeRegistry.sol";
import { SwapAndStakeEuphratesRouter, SwapAndStakeEuphratesInstructions } from "./SwapAndStakeEuphratesRouter.sol";

contract SwapAndStakeEuphratesFactory {
    using SafeTransferLib for ERC20;

    function deploySwapAndStakeEuphratesRouter(
        FeeRegistry fees,
        SwapAndStakeEuphratesInstructions memory inst,
        uint256 targetAmount
    ) public returns (SwapAndStakeEuphratesRouter) {
        require(
            inst.recipient != address(0) && inst.maker != address(0) && address(inst.targetToken) != address(0)
                && inst.euphrates != address(0),
            "invalid inst"
        );

        // no need to use salt as we want to keep the router address the same for the same fees &instructions
        bytes32 salt;

        SwapAndStakeEuphratesRouter router;
        try new SwapAndStakeEuphratesRouter{salt: salt}(fees, inst) returns (SwapAndStakeEuphratesRouter router_) {
            router = router_;
        } catch {
            router = SwapAndStakeEuphratesRouter(
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
                                            type(SwapAndStakeEuphratesRouter).creationCode, abi.encode(fees, inst)
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            );
        }

        if (targetAmount > 0) {
            require(inst.maker == msg.sender, "must provide target token as maker");
            inst.targetToken.safeTransferFrom(inst.maker, address(router), targetAmount);
        }

        return router;
    }

    function deploySwapAndStakeEuphratesRouterAndRoute(
        FeeRegistry fees,
        SwapAndStakeEuphratesInstructions memory inst,
        ERC20 token,
        uint256 targetAmount
    ) public {
        SwapAndStakeEuphratesRouter router = deploySwapAndStakeEuphratesRouter(fees, inst, targetAmount);
        router.route(token, msg.sender);
    }

    function deploySwapAndStakeEuphratesRouterAndRouteNoFee(
        FeeRegistry fees,
        SwapAndStakeEuphratesInstructions memory inst,
        ERC20 token,
        uint256 targetAmount
    ) public {
        SwapAndStakeEuphratesRouter router = deploySwapAndStakeEuphratesRouter(fees, inst, targetAmount);
        router.routeNoFee(token);
    }
}
