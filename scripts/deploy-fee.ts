import { ethers, run, network } from 'hardhat';
import {  ROUTER_TOKEN_INFO, CHAIN } from './consts';
import { parseUnits } from 'ethers/lib/utils';
import { FeeStruct } from '../typechain-types/src/FeeRegistry';

async function main() {
  // const tokenAddr = ADDRESSES[network.name].usdcAddr;
  // const Token = await ethers.getContractFactory('MockToken');
  // const token = Token.attach(tokenAddr);
  // const decimals = await token.decimals();

  // const feeConfig = [{
  //   token: tokenAddr,
  //   amount: parseUnits('0.0002', decimals),
  // }];

  const isAcala = network.name === 'acala';
  const feeConfig = Object.entries(ROUTER_TOKEN_INFO)
    .filter(([, info]) => isAcala ? !!info.acalaAddr : !!info.karuraAddr)
    .map(([, info]) => ({
      token: info[isAcala ? 'acalaAddr' : 'karuraAddr'],
      amount: parseUnits(info.fee.toString(), info.decimals),
    }));

  console.log(feeConfig.reduce((acc, { token, amount }) => ({
    ...acc,
    [token!]: amount.toBigInt(),
  }), {}));

  const FeeRegistry = await ethers.getContractFactory('FeeRegistry');
  const fee = await FeeRegistry.deploy(feeConfig as FeeStruct[]);
  await fee.deployed();

  console.log(`feeRegistry address: ${fee.address}`);

  await run('verify:verify', {
    address: fee.address,
    constructorArguments: [feeConfig],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


/* ---------------
karura: 0xF25176942A23C703aB7b79f50fF7eaBb6eee8d82
{
  '0x21a3e77E77f1A73f303B0e050bDFa33c439E57D3': 36000000000000000n,
  '0xC5033741CA1ce8F4f956eCA6c2fF7360cABFA08d': 50000000000000000n,
  '0x8cc494086Db58859bDDC5Df0F33679dFe3729a03': 160000000000000n,
  '0x1516D2d4436d7f2EB0eadeB9be597b8CDbfb5724': 40000000000000000n,
  '0xecE0cc38021e734bEF1D5Da071B027Ac2f71181f': 22000000000000n,
  '0x66291c7D88D2Ed9a708147Bae4E0814A76705e2f': 157n,
  '0xb4CE1f6109854243d1Af13b8EA34Ed28542f31e0': 18000000000000000n,
  '0x9759CA009CbCD75A84786Ac19BB5D02f8e68BcD9': 5063000000000000000000n,
  '0x77Cf14F938Cb97308d752647D554439D99B39a3f': 9000000000000000n,
  '0x2C7De70b32Cf5f20e02329A88d2e3B00eF85eb90': 6600000000000000n,
  '0x30b1f4BA0b07789bE9986fA090A57e0FE5631eBB': 13000000000000000n,
  '0x1F3a10587A20114EA25Ba1b388EE2dD4A337ce27': 40000n,
  '0x54e183E533FD3c6E72DEBB2D1cAB451d017FaF72': 40000n,
  '0xFdb9E75eC0B329B23B2C8cb165F718A5688E66dC': 5400000000000000000n
}

acala: 0x3638ebA6948784cefF8A2dE3534Cd4923FAd6f0a
{
  '0xD53E4bA478cCA5080C47435769ff82F41e5e4cd0': 36000000000000000n,
  '0x19EbA3efA7D0E02956678C5f3c63c46Beda2D7D8': 50000000000000000n,
  '0xb05122241f63A69A6435de54981b743707Fd17d5': 160000000000000n,
  '0x7D52316b1132c26626670FBf52Aa7F5CE6f9b388': 40000000000000000n,
  '0x5A4D6ACDc4e3e5ab15717F407aFe957F7A242578': 22000000000000n,
  '0xC80084aF223C8b598536178D9361dC55BFDA6818': 157n,
  '0xD1729649Ee6D5E3740Ee2F9254C4226AAbD0Dc5b': 18000000000000000n,
  '0xAF6997a70FeB868DF863D5380c3Ab93DA4297eDC': 5063000000000000000000n,
  '0x13Fe490489204abDE3265bfd81179e6Ddd2020c3': 9000000000000000n,
  '0x604cAe74cDC395a8824557d422fccf8Db6809A2F': 6600000000000000n,
  '0xf4C723E61709D90f89939C1852F516E373d418a8': 13000000000000000n,
  '0x07DF96D1341A7d16Ba1AD431E2c847d978BC2bCe': 40000n,
  '0x492f4E41BD378D6dbd92Ab645AC4020B01784Db3': 40000n,
  '0x54A37A01cD75B616D63E0ab665bFfdb0143c52AE': 40000000000000000n,
  '0xa72206Fdf839c785B3073870013f2fd57ba10B63': 5400000000000000000n
}
                                                         --------------- */
