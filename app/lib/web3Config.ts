import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const RECEIVER_ADDRESS = '0xb2EccF0Faaa38f2af89454a4c7913CA804996385';
export const REGULAR_RPC = 'https://sepolia.base.org';
export const FLASHBLOCK_RPC = 'https://sepolia-preconf.base.org';

// Regular Base Sepolia client
export const baseSepoliaClient = createPublicClient({
    chain: baseSepolia,
    transport: http(REGULAR_RPC),
    pollingInterval: 50,
});

// Flashblock-aware client
export const flashblockClient = createPublicClient({
    chain: baseSepolia,
    transport: http(FLASHBLOCK_RPC),
    pollingInterval: 50,
});

export const wagmiConfig = getDefaultConfig({
    appName: 'Flash Numbers',
    projectId: '53d73b8ac08a7519efff4e5e42a0ffac', // Get from WalletConnect Cloud
    chains: [baseSepolia],
}); 