
import { ethers } from 'hardhat';

export const gasOverride = {
  gasPrice: '0x33a70303ea',
  gasLimit: '0x329b140',
};

/* ------------------------------ edit me for diffrent networks ------------------------------ */
export const KARURA_TESTNET_USDT_ADDRESS = '0x478dEFc2Fc2be13a505dafBDF1e5400847E2efF6';
export const KARURA_TESTNET_TOKEN_BRIDGE_ADDRESS = '0xd11De1f930eA1F7Dd0290Fe3a2e35b9C91AEFb37';
export const KARURA_TESTNET_FACTORY_ADDRESS = '0x6e29385677E28eE3Df7d0E87e285291F197A6FF3';
export const KARURA_TESTNET_FEE_ADDRESS = '0x109FdB5a8f3EC051C21B3482ac89599e7D76561C';
/* ------------------------------------------------------------------------------------------- */

export const loadSetups = async () => {
  const [[deployer, user, relayer], FeeRegistry, Factory, Token] = await Promise.all([
    ethers.getSigners(),
    ethers.getContractFactory('FeeRegistry'),
    ethers.getContractFactory('Factory'),
    ethers.getContractFactory('MockToken'),
  ]);

  const usdt = Token.attach(KARURA_TESTNET_USDT_ADDRESS);
  const fee = FeeRegistry.attach(KARURA_TESTNET_FEE_ADDRESS);
  const factory = Factory.attach(KARURA_TESTNET_FACTORY_ADDRESS).connect(relayer);

  console.log('setup finished');
  console.log({
    deployerAddr: deployer.address,
    userAddr: user.address,
    relayerAddr: relayer.address,
    factoryAddr: factory.address,
    usdtAddr: KARURA_TESTNET_USDT_ADDRESS,
    feeRegistryAddr: fee.address,
    routerFee: ethers.utils.formatEther(await fee.getFee(KARURA_TESTNET_USDT_ADDRESS)),
  });
  console.log('');

  return { deployer, user, relayer, usdt, fee, factory };
};
