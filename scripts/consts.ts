import { XTOKENS } from '@acala-network/contracts/utils/Predeploy';
import { CONTRACTS } from '@certusone/wormhole-sdk';

export interface Addresses {
  tokenBridgeAddr: string,
  factoryAddr: string,
  feeAddr: string,
  usdcAddr: string,
  xtokensAddr: string,
};

export interface RouterTokenInfo {
  srcChain: string,
  srcAddr: string
  addr: string,
  decimals: number,
  fee: number,
}

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
    factoryAddr: '0xFa0e2F000Fd07f1820383528357dF6aa50E44586',
    feeAddr: '0xF25176942A23C703aB7b79f50fF7eaBb6eee8d82',
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

export const ACALA = 'ACALA';
export const KARURA = 'KARURA';
export const ETH = 'ETH';
export const BSC = 'BSC';
export const ARB = 'ARB';
export const POLYGON = 'POLYGON';

export const ROUTER_TOKEN_INFO: {
  [karuraOrAcala: string]: {
    [tokenName: string]: RouterTokenInfo
  }
} = {
  [KARURA]: {
    arb: {
      srcChain: ARB,
      srcAddr: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      addr: '0x21a3e77E77f1A73f303B0e050bDFa33c439E57D3',
      decimals: 18,
      fee: 0.036,
    },
    wmatic: {
      srcChain: POLYGON,
      srcAddr: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      addr: '0xC5033741CA1ce8F4f956eCA6c2fF7360cABFA08d',
      decimals: 18,
      fee: 0.05,
    },
    wbnb: {
      srcChain: BSC,
      srcAddr: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      addr: '0x8cc494086Db58859bDDC5Df0F33679dFe3729a03',
      decimals: 18,
      fee: 0.00016,
    },
    busd: {
      srcChain: BSC,
      srcAddr: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      addr: '0x1516D2d4436d7f2EB0eadeB9be597b8CDbfb5724',
      decimals: 18,
      fee: 0.04,
    },
    weth: {
      srcChain: ETH,
      srcAddr: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      addr: '0xecE0cc38021e734bEF1D5Da071B027Ac2f71181f',
      decimals: 18,
      fee: 0.000022,
    },
    wbtc: {
      srcChain: ETH,
      srcAddr: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      addr: '0x66291c7D88D2Ed9a708147Bae4E0814A76705e2f',
      decimals: 8,
      fee: 0.00000157,
    },
    ldo: {
      srcChain: ETH,
      srcAddr: '0x5a98fcbea516cf06857215779fd812ca3bef1b32',
      addr: '0xb4CE1f6109854243d1Af13b8EA34Ed28542f31e0',
      decimals: 18,
      fee: 0.018,
    },
    shib: {
      srcChain: ETH,
      srcAddr: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
      addr: '0x9759CA009CbCD75A84786Ac19BB5D02f8e68BcD9',
      decimals: 18,
      fee: 5063,
    },
    uni: {
      srcChain: ETH,
      srcAddr: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      addr: '0x77Cf14F938Cb97308d752647D554439D99B39a3f',
      decimals: 18,
      fee: 0.009,
    },
    link: {
      srcChain: ETH,
      srcAddr: '0x514910771af9ca656af840dff83e8264ecf986ca',
      addr: '0x2C7De70b32Cf5f20e02329A88d2e3B00eF85eb90',
      decimals: 18,
      fee: 0.0066,
    },
    ape: {
      srcChain: ETH,
      srcAddr: '0x4d224452801aced8b2f0aebe155379bb5d594381',
      addr: '0x30b1f4BA0b07789bE9986fA090A57e0FE5631eBB',
      decimals: 18,
      fee: 0.013,
    },
    usdc: {
      srcChain: ETH,
      srcAddr: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      addr: '0x1F3a10587A20114EA25Ba1b388EE2dD4A337ce27',
      decimals: 6,
      fee: 0.04,
    },
    usdt: {
      srcChain: ETH,
      srcAddr: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      addr: '0x54e183E533FD3c6E72DEBB2D1cAB451d017FaF72',
      decimals: 6,
      fee: 0.04,
    },
    csm: {
      srcChain: ETH,
      srcAddr: '0x2620638EDA99F9e7E902Ea24a285456EE9438861',
      addr: '0xFdb9E75eC0B329B23B2C8cb165F718A5688E66dC',
      decimals: 18,
      fee: 5.4,
    },
  },
  [ACALA]: {
  },
};
