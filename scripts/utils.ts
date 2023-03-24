
import { ethers, network } from 'hardhat';

export const gasOverride = {
  gasPrice: '0x33a70303ea',
  gasLimit: '0x329b140',
};

export interface Addresses {
  usdtAddr: string,
  tokenBridgeAddr: string,
  factoryAddr: string,
  feeAddr: string,
};

export const ADDRESSES: { [key: string]: Addresses } = {
  karuraTestnet: {
    usdtAddr: '0x478dEFc2Fc2be13a505dafBDF1e5400847E2efF6',
    tokenBridgeAddr: '0xd11De1f930eA1F7Dd0290Fe3a2e35b9C91AEFb37',
    factoryAddr: '0x6e29385677E28eE3Df7d0E87e285291F197A6FF3',
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

export const loadSetups = async () => {
  const [[deployer, user, relayer], FeeRegistry, Factory, Token] = await Promise.all([
    ethers.getSigners(),
    ethers.getContractFactory('FeeRegistry'),
    ethers.getContractFactory('Factory'),
    ethers.getContractFactory('MockToken'),
  ]);

  const { usdtAddr, factoryAddr, feeAddr } = ADDRESSES[network.name];

  const usdt = Token.attach(usdtAddr);
  const fee = FeeRegistry.attach(feeAddr);
  const factory = Factory.attach(factoryAddr).connect(relayer);

  console.log('setup finished');
  console.log({
    deployerAddr: deployer.address,
    userAddr: user.address,
    relayerAddr: relayer.address,
    factoryAddr: factory.address,
    usdtAddr: usdtAddr,
    feeRegistryAddr: fee.address,
    routerFee: ethers.utils.formatEther(await fee.getFee(usdtAddr)),
  });
  console.log('');

  return { deployer, user, relayer, usdt, fee, factory, ...ADDRESSES[network.name] };
};
