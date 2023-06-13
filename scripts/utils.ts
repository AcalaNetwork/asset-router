
import { ethers, network as curNetwork } from 'hardhat';
import { ACALA, ADDRESSES, KARURA, KARURA_TESTNET } from './consts';
import { formatUnits } from 'ethers/lib/utils';
import { Network } from 'hardhat/types';

export const getNetworNameFromHardhatNetwork = (network: Network) => {
  const networkName = ({
    karuraTestnet: KARURA_TESTNET,
    karura: KARURA,
    acala: ACALA,
  })[network.name] as typeof KARURA_TESTNET | typeof KARURA | typeof ACALA;

  if (!networkName) {
    throw new Error(`unsupported network: ${networkName}`);
  };

  return networkName;
};

export const loadSetups = async () => {
  // eslint-disable-next-line prefer-const
  let [[deployer, user, relayer], FeeRegistry, Factory, Token] = await Promise.all([
    ethers.getSigners(),
    ethers.getContractFactory('FeeRegistry'),
    ethers.getContractFactory('Factory'),
    ethers.getContractFactory('MockToken'),
  ]);

  const networkName = getNetworNameFromHardhatNetwork(curNetwork);

  const isMainnet = [KARURA, ACALA].includes(networkName);
  if (isMainnet) {
    relayer = deployer;
  }

  const { usdcAddr, factoryAddr, feeAddr } = ADDRESSES[networkName];

  const usdc = Token.attach(usdcAddr);
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
    routerFee: formatUnits(await fee.getFee(usdcAddr), 6),
  });
  console.log('');

  const portalUrl = isMainnet
    ? 'https://www.portalbridge.com/#/redeem'
    : 'https://wormhole-foundation.github.io/example-token-bridge-ui/#/redeem';

  return {
    deployer,
    user,
    relayer,
    usdc,
    fee,
    factory,
    portalUrl,
    isMainnet,
    ...ADDRESSES[networkName],
  };
};
