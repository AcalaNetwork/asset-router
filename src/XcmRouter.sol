// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";
import { IXtokens } from "@acala-network/contracts/xtokens/IXtokens.sol";

import { BaseRouter } from "./BaseRouter.sol";
import { FeeRegistry } from "./FeeRegistry.sol";

struct XcmInstructions {
    bytes dest;
    bytes weight;
}

// https://github.com/AcalaNetwork/predeploy-contracts/blob/6fc252836697ff2b3a3a935036e1d72f74f4c65a/contracts/utils/AcalaAddress.sol#L35
address constant XTOKENS = 0x0000000000000000000000000000000000000809;

contract XcmRouter is BaseRouter {
    XcmInstructions private _instructions;

    constructor(FeeRegistry fees, XcmInstructions memory instructions) BaseRouter(fees) {
        _instructions = instructions;
    }

    function routeImpl(ERC20 token) internal override {
        IXtokens(XTOKENS).transfer(
            address(token), token.balanceOf(address(this)), _instructions.dest, _instructions.weight
        );
    }
}
