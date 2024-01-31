import { DOT, LDOT } from '@acala-network/contracts/utils/AcalaTokens';
import { KSM, LKSM } from '@acala-network/contracts/utils/KaruraTokens';
import { ethers, run } from 'hardhat';

import { ADDRESSES } from './consts';

async function main() {
  const stakingToken = KSM;
  const liquidToken = LKSM;

  const Factory = await ethers.getContractFactory('HomaFactory', {
    libraries: {
      AccountHelper: ADDRESSES.KARURA.accountHelperAddr,
    },
  });
  const factory = await Factory.deploy(stakingToken, liquidToken);
  await factory.deployed();

  console.log(`homa factory address: ${factory.address}`);
  console.log('remember to publish it!');

  if (process.env.VERIFY) {
    await run('verify:verify', {
      address: factory.address,
      constructorArguments: [stakingToken, liquidToken],
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
