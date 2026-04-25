import api from "./api";
import { assert, assertNonEmptyString, assertProjectId, unwrapDataEnvelope, isRecord } from "./serviceGuards";

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

export interface SignerTransactionResult {
    txHash: string;
    status: "success" | "reverted";
    blockNumber: number;
}

export interface GasEstimateResult {
    gas: string;
    chain: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc";
}

function requiredString(value: unknown, fieldName: string): string {
    assert(typeof value === "string" && value.trim().length > 0, `${fieldName} is required`);
    return value;
}

function optionalString(value: unknown): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    assert(typeof value === "string", "Expected string, null, or undefined");
    return value;
}

function optionalNumber(value: unknown): number | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    assert(typeof value === "number" && Number.isFinite(value), "Expected finite number, null, or undefined");
    return value;
}

function mapList<T>(payload: unknown, key: string, mapper: (value: unknown) => T): T[] {
    if (Array.isArray(payload)) {
        return payload.map(mapper);
    }
    if (isRecord(payload) && Array.isArray(payload[key])) {
        return (payload[key] as unknown[]).map(mapper);
    }
    return [];
}

function asWallet(value: unknown): Wallet {
    assert(isRecord(value), "Invalid wallet response item");
    return {
        id: requiredString(value.id, "wallet.id"),
        projectId: requiredString(value.projectId, "wallet.projectId"),
        userId: optionalString(value.userId),
        address: requiredString(value.address, "wallet.address"),
        chain: requiredString(value.chain, "wallet.chain"),
        label: optionalString(value.label),
        balanceCache: optionalString(value.balanceCache),
        lastSynced: optionalString(value.lastSynced),
        createdAt: requiredString(value.createdAt, "wallet.createdAt"),
    };
}

function asTransaction(value: unknown): Transaction {
    assert(isRecord(value), "Invalid transaction response item");
    const status = value.status;
    assert(status === "pending" || status === "confirmed" || status === "failed", "Invalid transaction.status");
    return {
        id: requiredString(value.id, "transaction.id"),
        projectId: requiredString(value.projectId, "transaction.projectId"),
        txHash: requiredString(value.txHash, "transaction.txHash"),
        fromAddress: optionalString(value.fromAddress),
        toAddress: optionalString(value.toAddress),
        value: optionalString(value.value),
        chain: requiredString(value.chain, "transaction.chain"),
        status,
        blockNumber: optionalNumber(value.blockNumber),
        timestamp: requiredString(value.timestamp, "transaction.timestamp"),
    };
}

function asNft(value: unknown): NFT {
    assert(isRecord(value), "Invalid NFT response item");
    const metadata = value.metadata;
    assert(metadata == null || isRecord(metadata), "nft.metadata must be an object or null");
    return {
        id: requiredString(value.id, "nft.id"),
        projectId: requiredString(value.projectId, "nft.projectId"),
        contractAddress: requiredString(value.contractAddress, "nft.contractAddress"),
        tokenId: requiredString(value.tokenId, "nft.tokenId"),
        metadata: metadata == null ? null : metadata,
        ownerAddress: optionalString(value.ownerAddress),
        chain: requiredString(value.chain, "nft.chain"),
        mintedAt: optionalString(value.mintedAt),
        createdAt: requiredString(value.createdAt, "nft.createdAt"),
    };
}

function asContractEvent(value: unknown): ContractEvent {
    assert(isRecord(value), "Invalid contract event response item");
    const args = value.args;
    assert(args == null || isRecord(args), "event.args must be an object or null");
    return {
        id: requiredString(value.id, "event.id"),
        projectId: requiredString(value.projectId, "event.projectId"),
        contractAddress: requiredString(value.contractAddress, "event.contractAddress"),
        eventName: requiredString(value.eventName, "event.eventName"),
        chain: requiredString(value.chain, "event.chain"),
        txHash: optionalString(value.txHash),
        blockNumber: optionalNumber(value.blockNumber),
        logIndex: optionalNumber(value.logIndex),
        args: args == null ? null : args,
        processedAt: optionalString(value.processedAt),
        createdAt: requiredString(value.createdAt, "event.createdAt"),
    };
}

function asContract(value: unknown): Contract {
    assert(isRecord(value), "Invalid contract response item");
    assert(Array.isArray(value.abi), "contract.abi must be an array");
    return {
        id: requiredString(value.id, "contract.id"),
        projectId: requiredString(value.projectId, "contract.projectId"),
        address: requiredString(value.address, "contract.address"),
        chain: requiredString(value.chain, "contract.chain"),
        abi: value.abi.filter((item): item is Record<string, unknown> => isRecord(item)),
        label: optionalString(value.label),
        createdAt: optionalString(value.createdAt) ?? undefined,
    };
}

function asHotWallet(value: unknown): HotWallet {
    assert(isRecord(value), "Invalid hot wallet response item");
    return {
        id: requiredString(value.id, "hotWallet.id"),
        projectId: requiredString(value.projectId, "hotWallet.projectId"),
        address: requiredString(value.address, "hotWallet.address"),
        chain: requiredString(value.chain, "hotWallet.chain"),
        label: optionalString(value.label),
        encryptedPrivateKey: optionalString(value.encryptedPrivateKey) ?? undefined,
        createdAt: optionalString(value.createdAt) ?? undefined,
    };
}

function asContractWatcher(value: unknown): ContractWatcher {
    assert(isRecord(value), "Invalid contract watcher response item");
    return {
        id: requiredString(value.id, "watcher.id"),
        projectId: requiredString(value.projectId, "watcher.projectId"),
        contractId: requiredString(value.contractId, "watcher.contractId"),
        eventName: requiredString(value.eventName, "watcher.eventName"),
        isActive: value.isActive == null ? undefined : Boolean(value.isActive),
        createdAt: optionalString(value.createdAt) ?? undefined,
    };
}

function asSignerTransactionResult(value: unknown): SignerTransactionResult {
    assert(isRecord(value), "Invalid signer transaction response");
    const status = value.status;
    assert(status === "success" || status === "reverted", "Invalid signer transaction status");
    const blockNumber = value.blockNumber;
    assert(typeof blockNumber === "number" && Number.isFinite(blockNumber), "signer.blockNumber must be a number");

    return {
        txHash: requiredString(value.txHash, "signer.txHash"),
        status,
        blockNumber,
    };
}

function asGasEstimateResult(value: unknown): GasEstimateResult {
    assert(isRecord(value), "Invalid gas estimate response");
    const chain = value.chain;
    assert(
        chain === "ethereum" || chain === "base" || chain === "polygon" || chain === "arbitrum" || chain === "bsc",
        "Invalid gas estimate chain",
    );

    return {
        gas: requiredString(value.gas, "estimate.gas"),
        chain,
    };
}

function asSuccessResult(value: unknown): { success: boolean } {
    assert(isRecord(value), "Invalid action response");
    return {
        success: Boolean(value.success),
    };
}

function projectHeaders(projectId: string): { "x-project-id": string } {
    assertProjectId(projectId);
    return { "x-project-id": projectId };
}

const BlockchainService = {
    // Wallets
    async getWallets(projectId: string, params?: { chain?: string; limit?: number; cursor?: string }): Promise<Wallet[]> {
        const { data } = await api.get("/blockchain/wallets", {
            headers: projectHeaders(projectId),
            params,
        });
        return mapList(unwrapDataEnvelope(data), "wallets", asWallet);
    },

    async createWallet(projectId: string, payload: { address: string; chain: string; label?: string }): Promise<Wallet> {
        assertNonEmptyString(payload.address, "address");
        assertNonEmptyString(payload.chain, "chain");
        const { data } = await api.post("/blockchain/wallets", payload, {
            headers: projectHeaders(projectId),
        });
        return asWallet(unwrapDataEnvelope(data));
    },

    async getWallet(projectId: string, walletId: string): Promise<Wallet> {
        assertNonEmptyString(walletId, "walletId");
        const { data } = await api.get(`/blockchain/wallets/${walletId}`, {
            headers: projectHeaders(projectId),
        });
        return asWallet(unwrapDataEnvelope(data));
    },

    async deleteWallet(projectId: string, walletId: string): Promise<{ success: boolean }> {
        assertNonEmptyString(walletId, "walletId");
        const { data } = await api.delete(`/blockchain/wallets/${walletId}`, {
            headers: projectHeaders(projectId),
        });
        return asSuccessResult(unwrapDataEnvelope(data));
    },

    async updateWalletBalance(projectId: string, walletId: string, balance: string): Promise<Wallet> {
        assertNonEmptyString(walletId, "walletId");
        assertNonEmptyString(balance, "balance");
        const { data } = await api.patch(`/blockchain/wallets/${walletId}/balance`, { balance }, {
            headers: projectHeaders(projectId),
        });
        return asWallet(unwrapDataEnvelope(data));
    },

    // Transactions
    async getTransactions(
        projectId: string,
        params?: { chain?: string; status?: "pending" | "confirmed" | "failed"; limit?: number; cursor?: string },
    ): Promise<Transaction[]> {
        const { data } = await api.get("/blockchain/transactions", {
            headers: projectHeaders(projectId),
            params,
        });
        return mapList(unwrapDataEnvelope(data), "transactions", asTransaction);
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
        assertNonEmptyString(payload.txHash, "txHash");
        const { data } = await api.post("/blockchain/transactions", payload, {
            headers: projectHeaders(projectId),
        });
        return asTransaction(unwrapDataEnvelope(data));
    },

    async getTransaction(projectId: string, transactionId: string): Promise<Transaction> {
        assertNonEmptyString(transactionId, "transactionId");
        const { data } = await api.get(`/blockchain/transactions/${transactionId}`, {
            headers: projectHeaders(projectId),
        });
        return asTransaction(unwrapDataEnvelope(data));
    },

    async updateTransactionStatus(
        projectId: string,
        transactionId: string,
        payload: { status: "pending" | "confirmed" | "failed"; blockNumber?: number },
    ): Promise<Transaction> {
        assertNonEmptyString(transactionId, "transactionId");
        const { data } = await api.patch(`/blockchain/transactions/${transactionId}/status`, payload, {
            headers: projectHeaders(projectId),
        });
        return asTransaction(unwrapDataEnvelope(data));
    },

    // NFTs
    async getNFTs(projectId: string, params?: { chain?: string; limit?: number; cursor?: string }): Promise<NFT[]> {
        const { data } = await api.get("/blockchain/nfts", {
            headers: projectHeaders(projectId),
            params,
        });
        return mapList(unwrapDataEnvelope(data), "nfts", asNft);
    },

    async getNFT(projectId: string, nftId: string): Promise<NFT> {
        assertNonEmptyString(nftId, "nftId");
        const { data } = await api.get(`/blockchain/nfts/${nftId}`, {
            headers: projectHeaders(projectId),
        });
        return asNft(unwrapDataEnvelope(data));
    },

    async getEvents(projectId: string, params?: { chain?: string; limit?: number; cursor?: string }): Promise<ContractEvent[]> {
        const { data } = await api.get("/blockchain/events", {
            headers: projectHeaders(projectId),
            params,
        });
        return mapList(unwrapDataEnvelope(data), "events", asContractEvent);
    },

    async getEvent(projectId: string, eventId: string): Promise<ContractEvent> {
        assertNonEmptyString(eventId, "eventId");
        const { data } = await api.get(`/blockchain/events/${eventId}`, {
            headers: projectHeaders(projectId),
        });
        return asContractEvent(unwrapDataEnvelope(data));
    },

    // Contracts
    async createContract(projectId: string, payload: {
        address: string;
        chain: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc";
        abi: Array<Record<string, unknown>>;
        label?: string;
    }): Promise<Contract> {
        assertNonEmptyString(payload.address, "address");
        assert(Array.isArray(payload.abi), "abi must be an array");
        const { data } = await api.post("/blockchain/contracts", payload, {
            headers: projectHeaders(projectId),
        });
        return asContract(unwrapDataEnvelope(data));
    },

    async getContracts(projectId: string, params?: { chain?: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc" }): Promise<Contract[]> {
        const { data } = await api.get("/blockchain/contracts", {
            headers: projectHeaders(projectId),
            params,
        });
        return mapList(unwrapDataEnvelope(data), "contracts", asContract);
    },

    async getContract(projectId: string, contractId: string): Promise<Contract> {
        assertNonEmptyString(contractId, "contractId");
        const { data } = await api.get(`/blockchain/contracts/${contractId}`, {
            headers: projectHeaders(projectId),
        });
        return asContract(unwrapDataEnvelope(data));
    },

    async deleteContract(projectId: string, contractId: string): Promise<{ success: boolean }> {
        assertNonEmptyString(contractId, "contractId");
        const { data } = await api.delete(`/blockchain/contracts/${contractId}`, {
            headers: projectHeaders(projectId),
        });
        return asSuccessResult(unwrapDataEnvelope(data));
    },

    // Hot wallets
    async generateHotWallet(projectId: string, payload: {
        chain: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc";
        label?: string;
    }): Promise<HotWallet> {
        const { data } = await api.post("/blockchain/hot-wallets/generate", payload, {
            headers: projectHeaders(projectId),
        });
        return asHotWallet(unwrapDataEnvelope(data));
    },

    async importHotWallet(projectId: string, payload: {
        chain: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc";
        label?: string;
        privateKey: string;
    }): Promise<HotWallet> {
        assertNonEmptyString(payload.privateKey, "privateKey");
        const { data } = await api.post("/blockchain/hot-wallets/import", payload, {
            headers: projectHeaders(projectId),
        });
        return asHotWallet(unwrapDataEnvelope(data));
    },

    async getHotWallets(projectId: string): Promise<HotWallet[]> {
        const { data } = await api.get("/blockchain/hot-wallets", {
            headers: projectHeaders(projectId),
        });
        return mapList(unwrapDataEnvelope(data), "wallets", asHotWallet);
    },

    async getHotWallet(projectId: string, walletId: string): Promise<HotWallet> {
        assertNonEmptyString(walletId, "walletId");
        const { data } = await api.get(`/blockchain/hot-wallets/${walletId}`, {
            headers: projectHeaders(projectId),
        });
        return asHotWallet(unwrapDataEnvelope(data));
    },

    async deleteHotWallet(projectId: string, walletId: string): Promise<{ success: boolean }> {
        assertNonEmptyString(walletId, "walletId");
        const { data } = await api.delete(`/blockchain/hot-wallets/${walletId}`, {
            headers: projectHeaders(projectId),
        });
        return asSuccessResult(unwrapDataEnvelope(data));
    },

    // Signer
    async sendSignerTransaction(projectId: string, payload: {
        hotWalletId: string;
        chain: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc";
        to: string;
        value?: string;
        data?: string;
    }, options?: { mfaCode?: string }): Promise<SignerTransactionResult> {
        assertNonEmptyString(payload.hotWalletId, "hotWalletId");
        assertNonEmptyString(payload.to, "to");
        const headers: Record<string, string> = projectHeaders(projectId);
        if (options?.mfaCode) headers["x-mfa-code"] = options.mfaCode;
        const { data } = await api.post("/blockchain/signer/send", payload, { headers });
        return asSignerTransactionResult(unwrapDataEnvelope(data));
    },

    async writeContract(projectId: string, payload: {
        hotWalletId: string;
        chain: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc";
        contractAddress: string;
        abi: Array<Record<string, unknown>>;
        functionName: string;
        args?: unknown[];
        value?: string;
    }, options?: { mfaCode?: string }): Promise<SignerTransactionResult> {
        assertNonEmptyString(payload.hotWalletId, "hotWalletId");
        assertNonEmptyString(payload.contractAddress, "contractAddress");
        assertNonEmptyString(payload.functionName, "functionName");
        const headers: Record<string, string> = projectHeaders(projectId);
        if (options?.mfaCode) headers["x-mfa-code"] = options.mfaCode;
        const { data } = await api.post("/blockchain/signer/write", payload, { headers });
        return asSignerTransactionResult(unwrapDataEnvelope(data));
    },

    async readContract(projectId: string, payload: {
        chain: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc";
        contractAddress: string;
        abi: Array<Record<string, unknown>>;
        functionName: string;
        args?: unknown[];
    }): Promise<unknown> {
        assertNonEmptyString(payload.contractAddress, "contractAddress");
        assertNonEmptyString(payload.functionName, "functionName");
        const { data } = await api.post("/blockchain/signer/read", payload, {
            headers: projectHeaders(projectId),
        });
        return unwrapDataEnvelope(data);
    },

    async estimateGas(projectId: string, payload: {
        hotWalletId: string;
        chain: "ethereum" | "base" | "polygon" | "arbitrum" | "bsc";
        to: string;
        value?: string;
        data?: string;
    }): Promise<GasEstimateResult> {
        assertNonEmptyString(payload.hotWalletId, "hotWalletId");
        assertNonEmptyString(payload.to, "to");
        const { data } = await api.post("/blockchain/signer/estimate-gas", payload, {
            headers: projectHeaders(projectId),
        });
        return asGasEstimateResult(unwrapDataEnvelope(data));
    },

    // Watchers
    async startWatcher(projectId: string, payload: { contractId: string; eventName?: string }): Promise<ContractWatcher> {
        assertNonEmptyString(payload.contractId, "contractId");
        const { data } = await api.post("/blockchain/watchers", payload, {
            headers: projectHeaders(projectId),
        });
        return asContractWatcher(unwrapDataEnvelope(data));
    },

    async getWatchers(projectId: string): Promise<ContractWatcher[]> {
        const { data } = await api.get("/blockchain/watchers", {
            headers: projectHeaders(projectId),
        });
        return mapList(unwrapDataEnvelope(data), "watchers", asContractWatcher);
    },

    async stopWatcher(projectId: string, watcherId: string): Promise<ContractWatcher> {
        assertNonEmptyString(watcherId, "watcherId");
        const { data } = await api.patch(`/blockchain/watchers/${watcherId}/stop`, {}, {
            headers: projectHeaders(projectId),
        });
        return asContractWatcher(unwrapDataEnvelope(data));
    },

    async getCapabilities(projectId: string): Promise<{
        mode: string;
        supportsOnChainExecution: boolean;
        supportsEventIngestion: boolean;
        supportsEventRead: boolean;
    }> {
        const { data } = await api.get("/blockchain/capabilities", {
            headers: projectHeaders(projectId),
        });
        const raw = unwrapDataEnvelope(data);
        assert(isRecord(raw), "Invalid blockchain capabilities response");
        return {
            mode: requiredString(raw.mode, "capabilities.mode"),
            supportsOnChainExecution: Boolean(raw.supportsOnChainExecution),
            supportsEventIngestion: Boolean(raw.supportsEventIngestion),
            supportsEventRead: Boolean(raw.supportsEventRead),
        };
    },

};

export default BlockchainService;
