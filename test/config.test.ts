import { expect } from 'chai';
import {
  CHAIN,
  CHAIN_NAME,
  CHAIN_NAME_TO_WORMHOLE_CHAIN_ID,
  ROUTER_TOKEN_INFO,
  ROUTER_CHAIN,
} from '../scripts/consts';
import { MockToken__factory } from '../dist/typechain-types';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Bridge__factory } from '@certusone/wormhole-sdk/lib/cjs/ethers-contracts';
import { CONTRACTS, ChainName, tryNativeToHexString } from '@certusone/wormhole-sdk';

const getProvider = (networkName: string) => {
  const ethRpc = ({
    [CHAIN.ACALA]: 'https://eth-rpc-acala.aca-staging.network',
    [CHAIN.KARURA]: 'https://eth-rpc-karura.aca-staging.network',
    [CHAIN.ETH]: 'https://ethereum.publicnode.com',
    [CHAIN.ARB]: 'https://endpoints.omniatech.io/v1/arbitrum/one/public',
    [CHAIN.BSC]: 'https://bsc.publicnode.com',
    [CHAIN.POLYGON]: 'https://polygon.llamarpc.com',
  })[networkName];
  if (!ethRpc) throw new Error(`unsupported network ${networkName}`);

  return new JsonRpcProvider(ethRpc);
};

const getWrappedAddr = async (
  dstNetwork: ROUTER_CHAIN,
  srcNetwork: string,
  tokenAddr: string,
) => {
  const dstTokenBridge = CONTRACTS.MAINNET[dstNetwork.toLowerCase() as ChainName].token_bridge;
  const wormholeChainId = CHAIN_NAME_TO_WORMHOLE_CHAIN_ID[srcNetwork as CHAIN_NAME];

  if (!dstTokenBridge || !wormholeChainId) {
    throw new Error('cannot find dstTokenBridge or wormholeChainId!');
  }

  const tokenBridge = Bridge__factory.connect(dstTokenBridge, getProvider(dstNetwork));
  return tokenBridge.wrappedAsset(
    wormholeChainId,
    Buffer.from(tryNativeToHexString(tokenAddr, wormholeChainId), 'hex'),
  );
};

describe('config', () => {
  it('source token and dst token match', async () => {
    const dstNetwork = CHAIN.KARURA;
    for (const [tokenName, info] of Object.entries(ROUTER_TOKEN_INFO[dstNetwork])) {
      process.stdout.write(`verifying ${tokenName} ...`);
      const srcToken = MockToken__factory.connect(info.originAddr, getProvider(info.originChain));

      const [
        symbol,
        decimals,
        wrappedAddr,
      ] = await Promise.all([
        srcToken.symbol(),
        srcToken.decimals(),
        getWrappedAddr(dstNetwork, info.originChain, info.originAddr),
      ]);

      expect(symbol).to.equal(tokenName.toUpperCase());
      expect(decimals).to.equal(info.decimals);
      expect(wrappedAddr).to.equal(info.addr);
      console.log('ok');
    }
  });
});
