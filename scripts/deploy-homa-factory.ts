import { DOT, LDOT } from '@acala-network/contracts/utils/AcalaTokens';
import { ethers, run } from 'hardhat';

const deployAccountHelper = async () => {
  const AccountHelper = await ethers.getContractFactory('AccountHelper');
  const ac = await AccountHelper.deploy();
  await ac.deployed();

  if (process.env.VERIFY) {
    await run('verify:verify', {
      address: ac.address,
      constructorArguments: [],
    });
  }

  console.log(`AccountHelper address: ${ac.address}`);
  return ac;
};

async function main() {
  const accountHelper = await deployAccountHelper();

  const stakingToken = DOT;
  const liquidToken = LDOT;

  const Factory = await ethers.getContractFactory('HomaFactory', {
    libraries: {
      AccountHelper: accountHelper.address,
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
