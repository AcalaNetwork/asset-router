import { BigNumber } from 'ethers';
import { DOT, LDOT } from '@acala-network/contracts/utils/AcalaTokens';
import { HOMA } from '@acala-network/contracts/utils/Predeploy';
import { IHoma__factory } from '@acala-network/contracts/typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { formatEther, formatUnits, parseEther, parseUnits } from 'ethers/lib/utils';

import { ADDRESSES } from '../scripts/consts';
import { FeeRegistry, HomaFactory, MockToken } from '../typechain-types';

type Resolved<T> = T extends Promise<infer U> ? U : T;

const toHuman = (amount: BigNumber, decimals: number) => Number(formatUnits(amount, decimals));

const almostEq = (a: BigNumber, b: BigNumber) => {
  const diff = a.sub(b).abs();
  return a.div(diff).gt(100);   // within 1% diff
};

const ONE_ACA = parseEther('1');

const { homaFactoryAddr, feeAddr } = ADDRESSES.ACALA;

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

  // dynamic
  let routerAddr: string;
  let bal0: Resolved<ReturnType<typeof fetchTokenBalances>>;
  let bal1: Resolved<ReturnType<typeof fetchTokenBalances>>;

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

    const Token = await ethers.getContractFactory('MockToken');
    const Fee = await ethers.getContractFactory('FeeRegistry');
    const Factory = await ethers.getContractFactory('HomaFactory');

    dot = Token.attach(DOT);
    ldot = Token.attach(LDOT);
    fee = Fee.attach(feeAddr);
    factory = Factory.attach(homaFactoryAddr);
    decimals = await dot.decimals();
    routingFee = await fee.getFee(dot.address);
    stakeAmount = parseUnits('101', decimals);

    console.log(`dot address: ${dot.address}`);
    console.log(`feeRegistry address: ${fee.address}`);
    console.log(`factory address: ${factory.address}`);
    console.log(`user address: ${user.address}`);
    console.log(`relayer address: ${relayer.address}`);
    console.log(`token decimals: ${decimals}`);
    console.log(`router fee: ${Number(ethers.utils.formatUnits(routingFee, decimals))}`);
  });

  it('predict router address', async () => {
    routerAddr = await factory.callStatic.deployHomaRouter(fee.address, user.address);
    console.log({ predictedRouterAddr: routerAddr });
  });

  it('init state', async () => {
    console.log('\n-------------------- init state --------------------');
    bal0 = await fetchTokenBalances();
    expect(bal0.userBalDot).to.gte(stakeAmount);

    const [userBal, relayerBal] = await Promise.all([
      user.getBalance(),
      relayer.getBalance(),
    ]);

    expect(userBal).to.be.gt(ONE_ACA.mul(10));
    if (relayerBal < ONE_ACA.mul(5)) {
      await (await user.sendTransaction({
        to: relayer.address,
        value: ONE_ACA.mul(5),
      })).wait();
    }

    // router shouldn't exist
    const routerCode = await relayer.provider!.getCode(routerAddr);
    expect(routerCode).to.eq('0x');
  });

  it('after user deposited to router', async () => {
    console.log('\n-------------------- after user deposited to router --------------------');

    await (await dot.connect(user).transfer(
      routerAddr,
      stakeAmount,
    )).wait();

    await fetchTokenBalances();
  });

  it('after router routed and staked', async () => {
    console.log('\n-------------------- after router routed and staked --------------------');
    const deployAndRoute = await factory.connect(relayer).deployHomaRouterAndRoute(
      fee.address,
      user.address,
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
    const routerCode = await relayer.provider!.getCode(routerAddr);
    expect(routerCode).to.eq('0x');
  });
});
