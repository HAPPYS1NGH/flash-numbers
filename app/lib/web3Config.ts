import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const RECEIVER_ADDRESS = '0xb2EccF0Faaa38f2af89454a4c7913CA804996385';
export const FLASHBLOCKS_WS = 'wss://sepolia.flashblocks.base.org/ws';
export const BASE_SEPOLIA_WS = 'wss://base-sepolia.drpc.org';
export const PRECONF_RPC = 'https://sepolia-preconf.base.org';

export const baseSepoliaClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
    pollingInterval: 50,
});

export const preconfClient = createPublicClient({
    chain: baseSepolia,
    transport: http(PRECONF_RPC),
    pollingInterval: 50,
});

export const wagmiConfig = getDefaultConfig({
    appName: 'Flash Numbers',
    projectId: '53d73b8ac08a7519efff4e5e42a0ffac', // Get from WalletConnect Cloud
    chains: [baseSepolia],
}); 