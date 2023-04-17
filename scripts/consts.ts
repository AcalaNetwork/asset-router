import { XTOKENS } from '@acala-network/contracts/utils/Predeploy';
import { CONTRACTS } from '@certusone/wormhole-sdk';

export interface Addresses {
  tokenBridgeAddr: string,
  factoryAddr: string,
  feeAddr: string,
  usdcAddr: string,
  xtokensAddr: string,
};

// https://book.wormhole.com/reference/contracts.html#token-bridge
export const ADDRESSES: { [key: string]: Addresses } = {
  karuraTestnet: {
    tokenBridgeAddr: CONTRACTS.TESTNET.karura.token_bridge,
    factoryAddr: '0xed9ae45a067cadc843e26d377c9cd8e963b299f1',
    feeAddr: '0x8dA2DebebFE5cCe133a80e7114621192780765BB',
    usdcAddr: '0xE5BA1e8E6BBbdC8BbC72A58d68E74B13FcD6e4c7',
    xtokensAddr: XTOKENS,
  },
  acalaTestnet: {
    tokenBridgeAddr: CONTRACTS.TESTNET.acala.token_bridge,
    factoryAddr: '',
    feeAddr: '',
    usdcAddr: '0x7E0CCD4209Ef7039901512fF9f6a01d0de0691e2',
    xtokensAddr: XTOKENS,
  },
  karura: {
    tokenBridgeAddr: CONTRACTS.MAINNET.karura.token_bridge,
    factoryAddr: '',
    feeAddr: '',
    usdcAddr: '0x1F3a10587A20114EA25Ba1b388EE2dD4A337ce27',
    xtokensAddr: XTOKENS,
  },
  acala: {
    tokenBridgeAddr: CONTRACTS.MAINNET.karura.token_bridge,
    factoryAddr: '',
    feeAddr: '',
    usdcAddr: '0x07DF96D1341A7d16Ba1AD431E2c847d978BC2bCe',
    xtokensAddr: XTOKENS,
  },
};
