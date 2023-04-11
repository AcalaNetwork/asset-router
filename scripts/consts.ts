export interface Addresses {
  usdcAddr: string,
  tokenBridgeAddr: string,
  factoryAddr: string,
  feeAddr: string,
};

// https://book.wormhole.com/reference/contracts.html#token-bridge
export const ADDRESSES: { [key: string]: Addresses } = {
  karuraTestnet: {
    usdcAddr: '0xE5BA1e8E6BBbdC8BbC72A58d68E74B13FcD6e4c7',
    tokenBridgeAddr: '0xd11De1f930eA1F7Dd0290Fe3a2e35b9C91AEFb37',
    factoryAddr: '0xed9ae45a067cadc843e26d377c9cd8e963b299f1',
    feeAddr: '0x8dA2DebebFE5cCe133a80e7114621192780765BB',
  },
  acalaTestnet: {
    usdcAddr: '',
    tokenBridgeAddr: '0xebA00cbe08992EdD08ed7793E07ad6063c807004',
    factoryAddr: '',
    feeAddr: '',
  },
  karura: {
    usdcAddr: '',
    tokenBridgeAddr: '0xae9d7fe007b3327AA64A32824Aaac52C42a6E624',
    factoryAddr: '',
    feeAddr: '',
  },
  acala: {
    usdcAddr: '',
    tokenBridgeAddr: '0xae9d7fe007b3327AA64A32824Aaac52C42a6E624',
    factoryAddr: '',
    feeAddr: '',
  },
};
