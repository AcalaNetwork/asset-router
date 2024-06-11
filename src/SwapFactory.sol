// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";
import { SafeTransferLib } from "solmate/utils/SafeTransferLib.sol";
import { FeeRegistry } from "./FeeRegistry.sol";
import { SwapRouter, SwapInstructions } from "./SwapRouter.sol";

contract SwapFactory {
    using SafeTransferLib for ERC20;

    function deploySwapRouter(FeeRegistry fees, SwapInstructions memory inst, uint256 targetAmount)
        public
        returns (SwapRouter)
    {
        require(
            inst.recipient != address(0) && inst.maker != address(0) && address(inst.targetToken) != address(0),
            "invalid inst"
        );

        // no need to use salt as we want to keep the router address the same for the same fees &instructions
        bytes32 salt;

        SwapRouter router;
        try new SwapRouter{salt: salt}(fees, inst) returns (SwapRouter router_) {
            router = router_;
        } catch {
            router = SwapRouter(
                address(
                    uint160(
                        uint256(
                            keccak256(
                                abi.encodePacked(
                                    bytes1(0xff),
                                    address(this),
                                    salt,
                                    keccak256(abi.encodePacked(type(SwapRouter).creationCode, abi.encode(fees, inst)))
                                )
                            )
                        )
                    )
                )
            );
        }

        if (targetAmount > 0) {
            inst.targetToken.safeTransferFrom(inst.maker, address(router), targetAmount);
        }

        return router;
    }

    function deploySwapRouterAndRoute(FeeRegistry fees, SwapInstructions memory inst, ERC20 token, uint256 targetAmount)
        public
    {
        SwapRouter router = deploySwapRouter(fees, inst, targetAmount);
        router.route(token, msg.sender);
    }

    function deploySwapRouterAndRouteNoFee(
        FeeRegistry fees,
        SwapInstructions memory inst,
        ERC20 token,
        uint256 targetAmount
    ) public {
        SwapRouter router = deploySwapRouter(fees, inst, targetAmount);
        router.routeNoFee(token);
    }
}
