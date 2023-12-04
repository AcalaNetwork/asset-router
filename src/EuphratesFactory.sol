// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";
import { FeeRegistry } from "./FeeRegistry.sol";
import { EuphratesRouter, EuphratesInstructions } from "./EuphratesRouter.sol";

contract EuphratesFactory {
    function deployEuphratesRouter(FeeRegistry fees, EuphratesInstructions memory inst, address euphratesAddress)
        public
        returns (EuphratesRouter)
    {
        // no need to use salt as we want to keep the router address the same for the same fees &instructions
        bytes32 salt;

        EuphratesRouter router;
        try new EuphratesRouter{salt: salt}(fees, inst, euphratesAddress) returns (EuphratesRouter router_) {
            router = router_;
        } catch {
            router = EuphratesRouter(
                address(
                    uint160(
                        uint256(
                            keccak256(
                                abi.encodePacked(
                                    bytes1(0xff),
                                    address(this),
                                    salt,
                                    keccak256(
                                        abi.encodePacked(type(EuphratesRouter).creationCode, abi.encode(fees, inst))
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

    function deployEuphratesRouterAndRoute(
        FeeRegistry fees,
        EuphratesInstructions memory inst,
        address euphratesAddress,
        ERC20 token
    ) public {
        EuphratesRouter router = deployEuphratesRouter(fees, inst, euphratesAddress);
        router.route(token, msg.sender);
    }

    function deployEuphratesRouterAndRouteNoFee(
        FeeRegistry fees,
        EuphratesInstructions memory inst,
        address euphratesAddress,
        ERC20 token
    ) public {
        EuphratesRouter router = deployEuphratesRouter(fees, inst, euphratesAddress);
        router.routeNoFee(token);
    }
}
