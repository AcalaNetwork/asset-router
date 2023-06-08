import { expect } from 'chai';
import { ACALA, ARB, BSC, ETH, KARURA, POLYGON, ROUTER_TOKEN_INFO } from '../scripts/consts';
import { MockToken__factory } from '../dist/typechain-types';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Bridge__factory } from '@certusone/wormhole-sdk/lib/cjs/ethers-contracts';
import { CONTRACTS, ChainId, ChainName, tryNativeToHexString } from '@certusone/wormhole-sdk';

const getProvider = (networkName: string) => {
  const ethRpc = ({
    [ACALA]: 'https://eth-rpc-acala.aca-staging.network',
    [KARURA]: 'https://eth-rpc-karura.aca-staging.network',
    [ETH]: 'https://ethereum.publicnode.com',
    [ARB]: 'https://endpoints.omniatech.io/v1/arbitrum/one/public',
    [BSC]: 'https://bsc.publicnode.com',
    [POLYGON]: 'https://polygon.llamarpc.com',
  })[networkName];
  if (!ethRpc) throw new Error(`unsupported network ${networkName}`);

  return new JsonRpcProvider(ethRpc);
};

const getWrappedAddr = async (
  dstNetwork: typeof KARURA | typeof ACALA,
  srcNetwork: string,
  tokenAddr: string,
) => {
  const dstTokenBridge = CONTRACTS.MAINNET[dstNetwork.toLowerCase() as ChainName].token_bridge;
  const wormholeChainId = ({
    [ETH]: 2,
    [ARB]: 23,
    [BSC]: 4,
    [POLYGON]: 5,
  })[srcNetwork] as ChainId;

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
    const dstNetwork = KARURA;
    for (const [tokenName, info] of Object.entries(ROUTER_TOKEN_INFO[dstNetwork])) {
      process.stdout.write(`verifying ${tokenName} ...`);
      const srcToken = MockToken__factory.connect(info.srcAddr, getProvider(info.srcChain));

      const [
        symbol,
        decimals,
        wrappedAddr,
      ] = await Promise.all([
        srcToken.symbol(),
        srcToken.decimals(),
        getWrappedAddr(dstNetwork, info.srcChain, info.srcAddr),
      ]);

      expect(symbol).to.equal(tokenName.toUpperCase());
      expect(decimals).to.equal(info.decimals);
      expect(wrappedAddr).to.equal(info.addr);
      console.log('ok');
    }
  });
});
