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
      url: 'https://eth-rpc-karura.aca-api.network',
      accounts: [],
      chainId: 686,
    },
  },
  mocha: {
    timeout: 600000, // 10 min
  },
  etherscan: {
    apiKey: {
      karuraTestnet: 'no-api-key-needed',
      acalaTestnet: 'no-api-key-needed',
      karura: 'no-api-key-needed',
      acala: 'no-api-key-needed',
    },
    customChains: [
      {
        network: 'karuraTestnet',
        chainId: 596,
        urls: {
          apiURL: 'https://blockscout.karura-testnet.aca-staging.network/api',
          browserURL: 'https://blockscout.karura-testnet.aca-staging.network',
        },
      },
      {
        network: 'acalaTestnet',
        chainId: 597,
        urls: {
          apiURL: 'https://blockscout.acala-dev.aca-dev.network/api',
          browserURL: 'https://blockscout.acala-dev.aca-dev.network',
        },
      },
      {
        network: 'karura',
        chainId: 686,
        urls: {
          apiURL: 'https://blockscout.karura.network/api',
          browserURL: 'https://blockscout.karura.network',
        },
      },
      {
        network: 'acala',
        chainId: 787,
        urls: {
          apiURL: 'https://blockscout.acala.network/api',
          browserURL: 'https://blockscout.acala.network',
        },
      },
    ],
  },
};

export default config;
