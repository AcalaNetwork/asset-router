import { ethers, run } from 'hardhat';
import { DOT, LDOT } from '@acala-network/contracts/utils/AcalaTokens';

async function main() {
  const stakingToken = DOT;
  const liquidToken = LDOT;

  const Factory = await ethers.getContractFactory('HomaFactory');
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
