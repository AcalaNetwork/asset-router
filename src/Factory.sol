// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";

import { FeeRegistry } from "./FeeRegistry.sol";
import { XcmRouter, XcmInstructions } from "./XcmRouter.sol";
import { WormholeRouter } from "./WormholeRouter.sol";

contract Factory {
    function deployXcmRouter(FeeRegistry fees, XcmInstructions memory inst) public returns (XcmRouter) {
        // no need to use salt as we want to keep the router address the same for the same fees &instructions
        bytes32 salt;

        XcmRouter router;
        try new XcmRouter{salt: salt}(fees, inst) returns (XcmRouter router_) {
            router = router_;
        } catch {
            router = XcmRouter(
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
                                            type(XcmRouter).creationCode, abi.encode(fees), abi.encode(inst)
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            );
        }

        return router;
    }

    function deployXcmRouterAndRoute(FeeRegistry fees, XcmInstructions memory inst, ERC20 token) public {
        XcmRouter router = deployXcmRouter(fees, inst);
        router.route(token);
    }

    function deployXcmRouterAndRouteNoFee(FeeRegistry fees, XcmInstructions memory inst, ERC20 token) public {
        XcmRouter router = deployXcmRouter(fees, inst);
        router.routeNoFee(token);
    }

    function deployWormholeRouter() public returns (WormholeRouter) {
        return new WormholeRouter();
    }
}
