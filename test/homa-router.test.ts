import { BigNumber } from 'ethers';
import { DOT, LDOT } from '@acala-network/contracts/utils/AcalaTokens';
import { EVMAccounts__factory, IHoma__factory } from '@acala-network/contracts/typechain';
import { EVM_ACCOUNTS, HOMA } from '@acala-network/contracts/utils/Predeploy';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { formatEther, parseEther, parseUnits } from 'ethers/lib/utils';

import { ADDRESSES } from '../scripts/consts';
import { FeeRegistry, HomaFactory, MockToken } from '../typechain-types';
import { ONE_ACA, almostEq, evmToAddr32, nativeToAddr32, toHuman } from '../scripts/utils';

const { homaFactoryAddr, feeAddr, accountHelperAddr } = ADDRESSES.ACALA;

describe('Homa Router', () => {
  // fixed
  let dot: MockToken;
  let ldot: MockToken;
  let fee: FeeRegistry;
  let factory: HomaFactory;
  let decimals: number;
  let routingFee: BigNumber;
  let stakeAmount: BigNumber;
  let user: SignerWithAddress;
  let relayer: SignerWithAddress;
  let userAddr32: string;

  // dynamic
  let routerAddr: string;
  let bal0: Awaited<ReturnType<typeof fetchTokenBalances>>;
  let bal1: Awaited<ReturnType<typeof fetchTokenBalances>>;

  const fetchTokenBalances = async () => {
    const [
      userBalDot,
      relayerBalDot,
      routerBalDot,
      userBalLdot,
      relayerBalLdot,
      routerBalLdot,
    ] = await Promise.all([
      dot.balanceOf(user.address),
      dot.balanceOf(relayer.address),
      dot.balanceOf(routerAddr),
      ldot.balanceOf(user.address),
      ldot.balanceOf(relayer.address),
      ldot.balanceOf(routerAddr),
    ]);

    console.log({
      userBalDot: toHuman(userBalDot, decimals),
      relayerBalDot: toHuman(relayerBalDot, decimals),
      routerBalDot: toHuman(routerBalDot, decimals),
      userBalLdot: toHuman(userBalLdot, decimals),
      relayerBalLdot: toHuman(relayerBalLdot, decimals),
      routerBalLdot: toHuman(routerBalLdot, decimals),
    });

    return {
      userBalDot,
      relayerBalDot,
      routerBalDot,
      userBalLdot,
      relayerBalLdot,
      routerBalLdot,
    };
  };

  before('setup', async () => {
    ([user, relayer] = await ethers.getSigners());

    const evmAccounts = EVMAccounts__factory.connect(EVM_ACCOUNTS, user);
    const Token = await ethers.getContractFactory('MockToken');
    const Fee = await ethers.getContractFactory('FeeRegistry');
    const Factory = await ethers.getContractFactory('HomaFactory', {
      libraries: {
        AccountHelper: accountHelperAddr,
      },
    });

    dot = Token.attach(DOT);
    ldot = Token.attach(LDOT);
    fee = Fee.attach(feeAddr);
    factory = Factory.attach(homaFactoryAddr);
    decimals = await dot.decimals();
    routingFee = await fee.getFee(dot.address);
    stakeAmount = parseUnits('101', decimals);
    userAddr32 = await evmAccounts.getAccountId(user.address);

    // user should be bound to alice
    const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    expect(userAddr32).to.eq(nativeToAddr32(ALICE));

    console.log(`dot address: ${dot.address}`);
    console.log(`feeRegistry address: ${fee.address}`);
    console.log(`factory address: ${factory.address}`);
    console.log(`user address: ${user.address}`);
    console.log(`user address32: ${userAddr32}`);
    console.log(`relayer address: ${relayer.address}`);
    console.log(`token decimals: ${decimals}`);
    console.log(`router fee: ${Number(ethers.utils.formatUnits(routingFee, decimals))}`);

    // make sure user and relayer have enough balance to send txs
    const [userBal, relayerBal] = await Promise.all([
      user.getBalance(),
      relayer.getBalance(),
    ]);

    expect(userBal).to.be.gt(ONE_ACA.mul(100));
    if (relayerBal.lt(ONE_ACA.mul(30))) {
      await (await user.sendTransaction({
        to: relayer.address,
        value: ONE_ACA.mul(30),
      })).wait();
    }
  });

  const testHomaRouter = async (addr32: string) => {
    routerAddr = await factory.callStatic.deployHomaRouter(fee.address, addr32);
    console.log({ predictedRouterAddr: routerAddr });

    console.log('\n-------------------- init state --------------------');
    bal0 = await fetchTokenBalances();
    expect(bal0.userBalDot).to.gte(stakeAmount);

    // router shouldn't exist
    let routerCode = await relayer.provider!.getCode(routerAddr);
    expect(routerCode).to.eq('0x');

    console.log('\n-------------------- after user deposited to router --------------------');

    await (await dot.connect(user).transfer(
      routerAddr,
      stakeAmount,
    )).wait();

    await fetchTokenBalances();

    console.log('\n-------------------- after router routed and staked --------------------');
    const deployAndRoute = await factory.connect(relayer).deployHomaRouterAndRoute(
      fee.address,
      addr32,
      DOT,
    );
    await deployAndRoute.wait();

    bal1 = await fetchTokenBalances();

    // router should have no remaining balance
    expect(bal1.routerBalDot).to.eq(0);
    expect(bal1.routerBalLdot).to.eq(0);

    // user should receive LDOT
    const homa = IHoma__factory.connect(HOMA, user);
    const exchangeRate = parseEther((1 / Number(formatEther(await homa.getExchangeRate()))).toString());    // 10{18} DOT => ? LDOT
    const expectedLdot = stakeAmount.sub(routingFee).mul(exchangeRate).div(ONE_ACA);
    const ldotReceived = bal1.userBalLdot.sub(bal0.userBalLdot);

    expect(almostEq(expectedLdot, ldotReceived)).to.be.true;
    expect(bal0.userBalDot.sub(bal1.userBalDot)).to.eq(stakeAmount);

    // relayer should receive fee
    expect(bal1.relayerBalDot.sub(bal0.relayerBalDot)).to.eq(routingFee);

    // router should be destroyed
    routerCode = await relayer.provider!.getCode(routerAddr);
    expect(routerCode).to.eq('0x');
  };

  it('route to evm address', async () => {
    await testHomaRouter(evmToAddr32(user.address));
  });

  it('route to substrate address', async () => {
    await testHomaRouter(userAddr32);
  });
});
