// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "solmate/tokens/ERC20.sol";
import { SafeTransferLib } from "solmate/utils/SafeTransferLib.sol";
import { IHoma } from "@acala-network/contracts/homa/IHoma.sol";
import { IToken } from "@acala-network/contracts/token/IToken.sol";
import { HOMA } from "@acala-network/contracts/utils/Predeploy.sol";

import { BaseRouter } from "./BaseRouter.sol";
import { FeeRegistry } from "./FeeRegistry.sol";

struct HomaInstructions {
    ERC20 stakingToken;
    ERC20 liquidToken;
    bytes32 recipient;
}

contract HomaRouter is BaseRouter {
    using SafeTransferLib for ERC20;

    HomaInstructions private _instructions;

    constructor(FeeRegistry fees, HomaInstructions memory instructions) BaseRouter(fees) {
        _instructions = instructions;
    }

    function toEvmAddress(bytes32 addr) private pure returns (address) {
        bytes32 prefix = bytes32(uint256(0x65766d3a00000000000000000000000000000000000000000000000000000000));
        bool checkPrefix = addr & prefix == prefix;
        if (!checkPrefix) {
            return address(0);
        }

        bytes32 suffix = bytes32(uint256(0x000000000000000000000000000000000000000000000000ffffffffffffffff));
        bool checkSuffix = addr & suffix == 0;
        if (!checkSuffix) {
            return address(0);
        }

        // convert addr[4..24] to address
        address result = address(bytes20(addr << 32));
        return result;
    }

    function transfer(ERC20 token, bytes32 addr) private {
        address recipient = toEvmAddress(addr);
        if (recipient == address(0)) {
            // Substrate account
            // This will fail if token is not a native token.
            // That means user is doing something wrong and will lose their tokens.
            IToken(address(token)).transferToAccountId32(addr, token.balanceOf(address(this)));
        } else {
            // EVM account
            token.safeTransfer(recipient, token.balanceOf(address(this)));
        }
    }

    function routeImpl(ERC20 token) internal override {
        if (token == _instructions.stakingToken) {
            bool success = IHoma(HOMA).mint(token.balanceOf(address(this)));
            require(success, "HomaRouter: mint failed");
            transfer(_instructions.liquidToken, _instructions.recipient);
        } else {
            // received token is not staking token, transfer it to recipient to avoid it stuck in this contract
            transfer(token, _instructions.recipient);
        }
    }
}
