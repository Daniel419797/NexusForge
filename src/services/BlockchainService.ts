import api from "./api";

export interface Wallet {
    id: string;
    projectId: string;
    address: string;
    network: string;
    balance: string;
    isPrimary: boolean;
    createdAt: string;
}

export interface Transaction {
    id: string;
    projectId: string;
    walletId: string;
    txHash: string;
    type: string;
    status: "pending" | "confirmed" | "failed";
    amount: string;
    currency: string;
    createdAt: string;
}

export interface NFT {
    id: string;
    projectId: string;
    contractAddress: string;
    tokenId: string;
    metadata: any;
    ownerAddress: string;
    createdAt: string;
}

const BlockchainService = {
    // Wallets
    async getWallets(projectId: string): Promise<Wallet[]> {
        const { data } = await api.get("/blockchain/wallets", {
            headers: { "x-project-id": projectId },
        });
        return data.data || [];
    },

    async createWallet(projectId: string, payload: { network: string; isPrimary?: boolean }): Promise<Wallet> {
        const { data } = await api.post("/blockchain/wallets", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    // Transactions
    async getTransactions(projectId: string, params?: any): Promise<Transaction[]> {
        const { data } = await api.get("/blockchain/transactions", {
            headers: { "x-project-id": projectId },
            params,
        });
        // Return array (data.data.items if paginated, else data.data)
        return data.data?.items || data.data || [];
    },

    // NFTs
    async getNFTs(projectId: string): Promise<NFT[]> {
        const { data } = await api.get("/blockchain/nfts", {
            headers: { "x-project-id": projectId },
        });
        return data.data?.items || data.data || [];
    },

};

export default BlockchainService;
