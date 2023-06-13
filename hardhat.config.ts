import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-foundry';

const config: HardhatUserConfig = {
  solidity: '0.8.18',
  networks: {
    mandala: {
      url: 'http://127.0.0.1:8545',
      accounts: {
        mnemonic: 'fox sight canyon orphan hotel grow hedgehog build bless august weather swarm',
        path: 'm/44\'/60\'/0\'/0',
      },
      chainId: 595,
    },
    karuraTestnet: {
      url: 'https://eth-rpc-karura-testnet.aca-staging.network',
      accounts: {
        mnemonic: 'fox sight canyon orphan hotel grow hedgehog build bless august weather swarm',
        path: 'm/44\'/60\'/0\'/0',
      },
      chainId: 596,
    },
    karura: {
      url: 'https://eth-rpc-karura.aca-staging.network',
      accounts: [],
      chainId: 686,
    },
  },
  mocha: {
    timeout: 600000, // 10 min
  },
};

export default config;
