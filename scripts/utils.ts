
import { BigNumber } from 'ethers';
import { decodeAddress } from '@polkadot/util-crypto';
import { ethers, network } from 'hardhat';
import { formatUnits, parseEther } from 'ethers/lib/utils';

import { ADDRESSES } from './consts';

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

// convert evm addr to bytes32 with prefix of `evm:` and suffix of 8 bytes of zeros
const EVM_PREFIX = '65766d3a';    // evm:
export const evmToAddr32 = (addr: string) => `0x${EVM_PREFIX}${addr.slice(2)}${'0'.repeat(16)}`;

export const nativeToAddr32 = (addr: string) => '0x' + Buffer.from(decodeAddress(addr)).toString('hex');

export type Resolved<T> = T extends Promise<infer U> ? U : T;

export const toHuman = (amount: BigNumber, decimals: number) => Number(formatUnits(amount, decimals));

export const almostEq = (a: BigNumber, b: BigNumber) => {
  const diff = a.sub(b).abs();
  return a.div(diff).gt(100);   // within 1% diff
};

export const ONE_ACA = parseEther('1');
