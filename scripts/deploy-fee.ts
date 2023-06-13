import { ethers, network } from 'hardhat';
import { ADDRESSES, ROUTER_TOKEN_INFO, KARURA } from './consts';
import { parseUnits } from 'ethers/lib/utils';

async function main() {
  // const tokenAddr = ADDRESSES[network.name].usdcAddr;
  // const Token = await ethers.getContractFactory('MockToken');
  // const token = Token.attach(tokenAddr);
  // const decimals = await token.decimals();

  // const feeConfig = [{
  //   token: tokenAddr,
  //   amount: parseUnits('0.0002', decimals),
  // }];

  const feeConfig = Object.entries(ROUTER_TOKEN_INFO[KARURA]).map(([, info]) => ({
    token: info.addr,
    amount: parseUnits(info.fee.toString(), info.decimals),
  }));
  console.log(feeConfig.reduce((acc, { token, amount }) => ({
    ...acc,
    [token]: amount.toBigInt(),
  }), {}));

  const FeeRegistry = await ethers.getContractFactory('FeeRegistry');
  const fee = await FeeRegistry.deploy(feeConfig);
  await fee.deployed();

  console.log(`feeRegistry address: ${fee.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


/* ---------------
0xF25176942A23C703aB7b79f50fF7eaBb6eee8d82
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
                                                         --------------- */
