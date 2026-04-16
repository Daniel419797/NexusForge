import api from "./api";

export interface Wallet {
    id: string;
    projectId: string;
    userId?: string | null;
    address: string;
    chain: string;
    label?: string | null;
    balanceCache?: string | null;
    lastSynced?: string | null;
    createdAt: string;
}

export interface Transaction {
    id: string;
    projectId: string;
    txHash: string;
    fromAddress?: string | null;
    toAddress?: string | null;
    value?: string | null;
    chain: string;
    status: "pending" | "confirmed" | "failed";
    blockNumber?: number | null;
    timestamp: string;
}

export interface NFT {
    id: string;
    projectId: string;
    contractAddress: string;
    tokenId: string;
    metadata?: Record<string, unknown> | null;
    ownerAddress?: string | null;
    chain: string;
    mintedAt?: string | null;
    createdAt: string;
}

export interface ContractEvent {
    id: string;
    projectId: string;
    contractAddress: string;
    eventName: string;
    chain: string;
    txHash?: string | null;
    blockNumber?: number | null;
    logIndex?: number | null;
    args?: Record<string, unknown> | null;
    processedAt?: string | null;
    createdAt: string;
}

export interface Contract {
    id: string;
    projectId: string;
    address: string;
    chain: string;
    abi: Array<Record<string, unknown>>;
    label?: string | null;
    createdAt?: string;
}

export interface HotWallet {
    id: string;
    projectId: string;
    address: string;
    chain: string;
    label?: string | null;
    encryptedPrivateKey?: string;
    createdAt?: string;
}

export interface ContractWatcher {
    id: string;
    projectId: string;
    contractId: string;
    eventName: string;
    isActive?: boolean;
    createdAt?: string;
}

interface WalletListResponse {
    wallets: Wallet[];
    nextCursor?: string | null;
    hasMore?: boolean;
}

interface TransactionListResponse {
    transactions: Transaction[];
    nextCursor?: string | null;
    hasMore?: boolean;
}

interface NftListResponse {
    nfts: NFT[];
    nextCursor?: string | null;
    hasMore?: boolean;
}

interface EventListResponse {
    events: ContractEvent[];
    nextCursor?: string | null;
    hasMore?: boolean;
}

interface ContractListResponse {
    contracts: Contract[];
}

interface HotWalletListResponse {
    wallets: HotWallet[];
}

interface WatcherListResponse {
    watchers: ContractWatcher[];
}

const BlockchainService = {
    // Wallets
    async getWallets(projectId: string, params?: { chain?: string; limit?: number; cursor?: string }): Promise<Wallet[]> {
        const { data } = await api.get("/blockchain/wallets", {
            headers: { "x-project-id": projectId },
            params,
        });
        const payload = data.data as WalletListResponse | Wallet[];
        return Array.isArray(payload) ? payload : payload.wallets || [];
    },

    async createWallet(projectId: string, payload: { address: string; chain: string; label?: string }): Promise<Wallet> {
        const { data } = await api.post("/blockchain/wallets", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async getWallet(projectId: string, walletId: string): Promise<Wallet> {
        const { data } = await api.get(`/blockchain/wallets/${walletId}`, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async deleteWallet(projectId: string, walletId: string): Promise<{ success: boolean }> {
        const { data } = await api.delete(`/blockchain/wallets/${walletId}`, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async updateWalletBalance(projectId: string, walletId: string, balance: string): Promise<Wallet> {
        const { data } = await api.patch(`/blockchain/wallets/${walletId}/balance`, { balance }, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    // Transactions
    async getTransactions(
        projectId: string,
        params?: { chain?: string; status?: "pending" | "confirmed" | "failed"; limit?: number; cursor?: string },
    ): Promise<Transaction[]> {
        const { data } = await api.get("/blockchain/transactions", {
            headers: { "x-project-id": projectId },
            params,
        });
        const payload = data.data as TransactionListResponse | Transaction[];
        return Array.isArray(payload) ? payload : payload.transactions || [];
    },

    async createTransaction(projectId: string, payload: {
        txHash: string;
        fromAddress?: string;
        toAddress?: string;
        value?: string;
        chain: "ethereum" | "base" | "polygon" | "solana" | "arbitrum" | "bsc" | "other";
        status?: "pending" | "confirmed" | "failed";
        blockNumber?: number;
    }): Promise<Transaction> {
        const { data } = await api.post("/blockchain/transactions", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async getTransaction(projectId: string, transactionId: string): Promise<Transaction> {
        const { data } = await api.get(`/blockchain/transactions/${transactionId}`, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async updateTransactionStatus(
        projectId: string,
        transactionId: string,
        payload: { status: "pending" | "confirmed" | "failed"; blockNumber?: number },
    ): Promise<Transaction> {
        const { data } = await api.patch(`/blockchain/transactions/${transactionId}/status`, payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    // NFTs
    async getNFTs(projectId: string, params?: { chain?: string; limit?: number; cursor?: string }): Promise<NFT[]> {
        const { data } = await api.get("/blockchain/nfts", {
            headers: { "x-project-id": projectId },
            params,
        });
        const payload = data.data as NftListResponse | NFT[];
        return Array.isArray(payload) ? payload : payload.nfts || [];
    },

    async getNFT(projectId: string, nftId: string): Promise<NFT> {
        const { data } = await api.get(`/blockchain/nfts/${nftId}`, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async getEvents(projectId: string, params?: { chain?: string; limit?: number; cursor?: string }): Promise<ContractEvent[]> {
        const { data } = await api.get("/blockchain/events", {
            headers: { "x-project-id": projectId },
            params,
        });
        const payload = data.data as EventListResponse | ContractEvent[];
        return Array.isArray(payload) ? payload : payload.events || [];
    },

    async getEvent(projectId: string, eventId: string): Promise<ContractEvent> {
        const { data } = await api.get(`/blockchain/events/${eventId}`, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    // Contracts
    async createContract(projectId: string, payload: {
        address: string;
        chain: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc";
        abi: Array<Record<string, unknown>>;
        label?: string;
    }): Promise<Contract> {
        const { data } = await api.post("/blockchain/contracts", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async getContracts(projectId: string, params?: { chain?: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc" }): Promise<Contract[]> {
        const { data } = await api.get("/blockchain/contracts", {
            headers: { "x-project-id": projectId },
            params,
        });
        const payload = data.data as ContractListResponse | Contract[];
        return Array.isArray(payload) ? payload : payload.contracts || [];
    },

    async getContract(projectId: string, contractId: string): Promise<Contract> {
        const { data } = await api.get(`/blockchain/contracts/${contractId}`, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async deleteContract(projectId: string, contractId: string): Promise<{ success: boolean }> {
        const { data } = await api.delete(`/blockchain/contracts/${contractId}`, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    // Hot wallets
    async generateHotWallet(projectId: string, payload: {
        chain: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc";
        label?: string;
    }): Promise<HotWallet> {
        const { data } = await api.post("/blockchain/hot-wallets/generate", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async importHotWallet(projectId: string, payload: {
        chain: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc";
        label?: string;
        privateKey: string;
    }): Promise<HotWallet> {
        const { data } = await api.post("/blockchain/hot-wallets/import", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async getHotWallets(projectId: string): Promise<HotWallet[]> {
        const { data } = await api.get("/blockchain/hot-wallets", {
            headers: { "x-project-id": projectId },
        });
        const payload = data.data as HotWalletListResponse | HotWallet[];
        return Array.isArray(payload) ? payload : payload.wallets || [];
    },

    async getHotWallet(projectId: string, walletId: string): Promise<HotWallet> {
        const { data } = await api.get(`/blockchain/hot-wallets/${walletId}`, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async deleteHotWallet(projectId: string, walletId: string): Promise<{ success: boolean }> {
        const { data } = await api.delete(`/blockchain/hot-wallets/${walletId}`, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    // Signer
    async sendSignerTransaction(projectId: string, payload: {
        hotWalletId: string;
        chain: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc";
        to: string;
        value?: string;
        data?: string;
    }): Promise<Record<string, unknown>> {
        const { data } = await api.post("/blockchain/signer/send", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async writeContract(projectId: string, payload: {
        hotWalletId: string;
        chain: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc";
        contractAddress: string;
        abi: Array<Record<string, unknown>>;
        functionName: string;
        args?: unknown[];
        value?: string;
    }): Promise<Record<string, unknown>> {
        const { data } = await api.post("/blockchain/signer/write", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async readContract(projectId: string, payload: {
        chain: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc";
        contractAddress: string;
        abi: Array<Record<string, unknown>>;
        functionName: string;
        args?: unknown[];
    }): Promise<Record<string, unknown>> {
        const { data } = await api.post("/blockchain/signer/read", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async estimateGas(projectId: string, payload: {
        hotWalletId: string;
        chain: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc";
        to: string;
        value?: string;
        data?: string;
    }): Promise<Record<string, unknown>> {
        const { data } = await api.post("/blockchain/signer/estimate-gas", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    // Watchers
    async startWatcher(projectId: string, payload: { contractId: string; eventName?: string }): Promise<ContractWatcher> {
        const { data } = await api.post("/blockchain/watchers", payload, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async getWatchers(projectId: string): Promise<ContractWatcher[]> {
        const { data } = await api.get("/blockchain/watchers", {
            headers: { "x-project-id": projectId },
        });
        const payload = data.data as WatcherListResponse | ContractWatcher[];
        return Array.isArray(payload) ? payload : payload.watchers || [];
    },

    async stopWatcher(projectId: string, watcherId: string): Promise<ContractWatcher> {
        const { data } = await api.patch(`/blockchain/watchers/${watcherId}/stop`, {}, {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

    async getCapabilities(projectId: string): Promise<{
        mode: string;
        supportsOnChainExecution: boolean;
        supportsEventIngestion: boolean;
        supportsEventRead: boolean;
    }> {
        const { data } = await api.get("/blockchain/capabilities", {
            headers: { "x-project-id": projectId },
        });
        return data.data;
    },

};

export default BlockchainService;
