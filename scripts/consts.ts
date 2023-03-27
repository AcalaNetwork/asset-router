export interface Addresses {
  usdtAddr: string,
  tokenBridgeAddr: string,
  factoryAddr: string,
  feeAddr: string,
};

// https://book.wormhole.com/reference/contracts.html#token-bridge
export const ADDRESSES: { [key: string]: Addresses } = {
  karuraTestnet: {
    usdtAddr: '0x478dEFc2Fc2be13a505dafBDF1e5400847E2efF6',
    tokenBridgeAddr: '0xd11De1f930eA1F7Dd0290Fe3a2e35b9C91AEFb37',
    factoryAddr: '0xc22ea30a2f5090c03149639babaeeb0b5e17b34b',
    feeAddr: '0x109FdB5a8f3EC051C21B3482ac89599e7D76561C',
  },
  acalaTestnet: {
    usdtAddr: '',
    tokenBridgeAddr: '0xebA00cbe08992EdD08ed7793E07ad6063c807004',
    factoryAddr: '',
    feeAddr: '',
  },
  karura: {
    usdtAddr: '',
    tokenBridgeAddr: '0xae9d7fe007b3327AA64A32824Aaac52C42a6E624',
    factoryAddr: '',
    feeAddr: '',
  },
  acala: {
    usdtAddr: '',
    tokenBridgeAddr: '0xae9d7fe007b3327AA64A32824Aaac52C42a6E624',
    factoryAddr: '',
    feeAddr: '',
  },
};
