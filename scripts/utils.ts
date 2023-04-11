
import { ethers, network } from 'hardhat';
import { ADDRESSES } from './consts';

export const gasOverride = {
  gasPrice: '0x33a70303ea',
  gasLimit: '0x329b140',
};

export const loadSetups = async () => {
  const [[deployer, user, relayer], FeeRegistry, Factory, Token] = await Promise.all([
    ethers.getSigners(),
    ethers.getContractFactory('FeeRegistry'),
    ethers.getContractFactory('Factory'),
    ethers.getContractFactory('MockToken'),
  ]);

  const { usdcAddr, factoryAddr, feeAddr } = ADDRESSES[network.name];

  const usdt = Token.attach(usdcAddr);
  const fee = FeeRegistry.attach(feeAddr);
  const factory = Factory.attach(factoryAddr).connect(relayer);

  console.log('setup finished');
  console.log({
    deployerAddr: deployer.address,
    userAddr: user.address,
    relayerAddr: relayer.address,
    factoryAddr: factory.address,
    usdcAddr: usdcAddr,
    feeRegistryAddr: fee.address,
    routerFee: ethers.utils.formatEther(await fee.getFee(usdcAddr)),
  });
  console.log('');

  return { deployer, user, relayer, usdt, fee, factory, ...ADDRESSES[network.name] };
};
