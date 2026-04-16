"use client";

import { useEffect, useState, useCallback } from "react";
import { useProjectStore } from "@/store/projectStore";
import BlockchainService, {
    type Wallet,
    type Transaction,
    type NFT,
    type ContractEvent,
    type Contract,
    type HotWallet,
    type ContractWatcher,
} from "@/services/BlockchainService";
import WalletCard from "@/components/Blockchain/WalletCard";
import TxTable from "@/components/Blockchain/TxTable";
import NFTGallery from "@/components/Blockchain/NFTGallery";
import EventTable from "@/components/Blockchain/EventTable";
import ElectricRippleButton from "@/components/Dashboard/ElectricRippleButton";
import ScrollReveal from "@/components/Dashboard/ScrollReveal";

function randomHexAddress(): string {
    const alphabet = "0123456789abcdef";
    let value = "0x";
    for (let i = 0; i < 40; i += 1) {
        value += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return value;
}

export default function BlockchainPage() {
    const { activeProject } = useProjectStore();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [events, setEvents] = useState<ContractEvent[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [hotWallets, setHotWallets] = useState<HotWallet[]>([]);
    const [watchers, setWatchers] = useState<ContractWatcher[]>([]);
    const [capabilitiesMode, setCapabilitiesMode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"transactions" | "nfts" | "events">("transactions");
    const [opsMessage, setOpsMessage] = useState<string | null>(null);

    const [hotWalletLabel, setHotWalletLabel] = useState("Treasury");
    const [hotWalletChain, setHotWalletChain] = useState<"ethereum" | "base" | "polygon" | "arbitrum" | "bsc">("ethereum");

    const [contractAddress, setContractAddress] = useState("");
    const [contractLabel, setContractLabel] = useState("Core Contract");
    const [contractChain, setContractChain] = useState<"ethereum" | "base" | "polygon" | "arbitrum" | "bsc">("ethereum");
    const [contractAbi, setContractAbi] = useState("[]");

    const [watchContractId, setWatchContractId] = useState("");
    const [watchEventName, setWatchEventName] = useState("*");

    const [signerHotWalletId, setSignerHotWalletId] = useState("");
    const [signerTo, setSignerTo] = useState("");
    const [signerValue, setSignerValue] = useState("0");
    const [signerData, setSignerData] = useState("");

    const fetchData = useCallback(async () => {
        if (!activeProject) return;
        try {
            const [w, t, n, e, capabilities, c, h, watchersList] = await Promise.all([
                BlockchainService.getWallets(activeProject.id),
                BlockchainService.getTransactions(activeProject.id),
                BlockchainService.getNFTs(activeProject.id),
                BlockchainService.getEvents(activeProject.id),
                BlockchainService.getCapabilities(activeProject.id),
                BlockchainService.getContracts(activeProject.id),
                BlockchainService.getHotWallets(activeProject.id),
                BlockchainService.getWatchers(activeProject.id),
            ]);
            setWallets(w);
            setTransactions(t);
            setNfts(n);
            setEvents(e);
            setCapabilitiesMode(capabilities.mode);
            setContracts(c);
            setHotWallets(h);
            setWatchers(watchersList);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, [activeProject]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreateWallet = async () => {
        if (!activeProject) return;
        try {
            await BlockchainService.createWallet(activeProject.id, {
                address: randomHexAddress(),
                chain: "ethereum",
                label: "Auto Wallet",
            });
            fetchData();
        }
        catch { /* ignore */ }
    };

    const parseAbiInput = (): Array<Record<string, unknown>> | null => {
        try {
            const parsed = JSON.parse(contractAbi) as unknown;
            if (!Array.isArray(parsed)) return null;
            return parsed as Array<Record<string, unknown>>;
        } catch {
            return null;
        }
    };

    const handleGenerateHotWallet = async () => {
        if (!activeProject) return;
        try {
            await BlockchainService.generateHotWallet(activeProject.id, {
                chain: hotWalletChain,
                label: hotWalletLabel || undefined,
            });
            setOpsMessage("Hot wallet generated successfully.");
            await fetchData();
        } catch {
            setOpsMessage("Failed to generate hot wallet.");
        }
    };

    const handleRegisterContract = async () => {
        if (!activeProject) return;
        const abi = parseAbiInput();
        if (!abi) {
            setOpsMessage("Contract ABI must be valid JSON array.");
            return;
        }

        try {
            await BlockchainService.createContract(activeProject.id, {
                address: contractAddress.trim(),
                chain: contractChain,
                abi,
                label: contractLabel || undefined,
            });
            setOpsMessage("Contract registered successfully.");
            setWatchContractId("");
            await fetchData();
        } catch {
            setOpsMessage("Failed to register contract.");
        }
    };

    const handleStartWatcher = async () => {
        if (!activeProject) return;
        if (!watchContractId) {
            setOpsMessage("Select a contract before starting watcher.");
            return;
        }

        try {
            await BlockchainService.startWatcher(activeProject.id, {
                contractId: watchContractId,
                eventName: watchEventName || "*",
            });
            setOpsMessage("Watcher started successfully.");
            await fetchData();
        } catch {
            setOpsMessage("Failed to start watcher.");
        }
    };

    const handleSignerSend = async () => {
        if (!activeProject) return;
        if (!signerHotWalletId || !signerTo) {
            setOpsMessage("Select a hot wallet and destination address.");
            return;
        }
        try {
            await BlockchainService.sendSignerTransaction(activeProject.id, {
                hotWalletId: signerHotWalletId,
                chain: hotWalletChain,
                to: signerTo.trim(),
                value: signerValue || undefined,
                data: signerData || undefined,
            });
            setOpsMessage("Signer transaction submitted.");
            await fetchData();
        } catch {
            setOpsMessage("Failed to submit signer transaction.");
        }
    };

    if (!activeProject) {
        return <div className="p-8 text-center text-white/50">Please select a project first.</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <ScrollReveal direction="up">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-display tracking-tight text-white">Web3 Dashboard</h1>
                        <p className="text-sm text-white/50 mt-2">Manage wallets, view transactions, browse NFT assets, and inspect indexed contract events.</p>
                        {capabilitiesMode && (
                            <p className="text-xs text-white/40 mt-1">Mode: {capabilitiesMode}</p>
                        )}
                    </div>
                    <ElectricRippleButton
                        accent="emerald"
                        className="px-5 py-2.5 text-sm rounded-xl font-medium text-white border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                        onClick={handleCreateWallet}
                    >
                        + Create Wallet
                    </ElectricRippleButton>
                </div>
            </ScrollReveal>

            {/* Wallets grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wallets.length === 0 && !loading && (
                    <ScrollReveal className="col-span-full">
                        <p className="text-white/50 text-sm text-center py-6">No wallets generated yet.</p>
                    </ScrollReveal>
                )}
                {wallets.map((w, i) => (
                    <ScrollReveal key={w.id} direction="up" delay={i * 0.06}>
                        <WalletCard wallet={w} />
                    </ScrollReveal>
                ))}
            </div>

            {/* Advanced controls for backend on-chain capabilities */}
            <ScrollReveal direction="up" delay={0.12}>
                <section className="space-y-4 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Advanced On-chain Controls</h2>
                        <p className="text-xs text-white/45 mt-1">Contracts, hot wallets, watchers, and signer flows backed by blockchain module endpoints.</p>
                        {opsMessage && <p className="text-xs text-emerald-300 mt-2">{opsMessage}</p>}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2 rounded-lg border border-white/[0.08] p-3">
                            <p className="text-sm font-medium text-white">Hot Wallets ({hotWallets.length})</p>
                            <input
                                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm"
                                placeholder="Label"
                                value={hotWalletLabel}
                                onChange={(e) => setHotWalletLabel(e.target.value)}
                            />
                            <select
                                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm"
                                value={hotWalletChain}
                                onChange={(e) => setHotWalletChain(e.target.value as "ethereum" | "base" | "polygon" | "arbitrum" | "bsc")}
                            >
                                <option value="ethereum">ethereum</option>
                                <option value="base">base</option>
                                <option value="polygon">polygon</option>
                                <option value="arbitrum">arbitrum</option>
                                <option value="bsc">bsc</option>
                            </select>
                            <button
                                className="px-3 py-2 rounded-md text-sm text-white bg-emerald-600/70 hover:bg-emerald-500/70"
                                onClick={handleGenerateHotWallet}
                            >
                                Generate Hot Wallet
                            </button>
                        </div>

                        <div className="space-y-2 rounded-lg border border-white/[0.08] p-3">
                            <p className="text-sm font-medium text-white">Register Contract ({contracts.length})</p>
                            <input
                                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm"
                                placeholder="Contract address (0x...)"
                                value={contractAddress}
                                onChange={(e) => setContractAddress(e.target.value)}
                            />
                            <input
                                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm"
                                placeholder="Label"
                                value={contractLabel}
                                onChange={(e) => setContractLabel(e.target.value)}
                            />
                            <select
                                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm"
                                value={contractChain}
                                onChange={(e) => setContractChain(e.target.value as "ethereum" | "base" | "polygon" | "arbitrum" | "bsc")}
                            >
                                <option value="ethereum">ethereum</option>
                                <option value="base">base</option>
                                <option value="polygon">polygon</option>
                                <option value="arbitrum">arbitrum</option>
                                <option value="bsc">bsc</option>
                            </select>
                            <textarea
                                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm min-h-[72px]"
                                placeholder="ABI JSON array"
                                value={contractAbi}
                                onChange={(e) => setContractAbi(e.target.value)}
                            />
                            <button
                                className="px-3 py-2 rounded-md text-sm text-white bg-blue-600/70 hover:bg-blue-500/70"
                                onClick={handleRegisterContract}
                            >
                                Register Contract
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2 rounded-lg border border-white/[0.08] p-3">
                            <p className="text-sm font-medium text-white">Watchers ({watchers.length})</p>
                            <select
                                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm"
                                value={watchContractId}
                                onChange={(e) => setWatchContractId(e.target.value)}
                            >
                                <option value="">Select contract</option>
                                {contracts.map((contract) => (
                                    <option key={contract.id} value={contract.id}>
                                        {contract.label || contract.address}
                                    </option>
                                ))}
                            </select>
                            <input
                                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm"
                                placeholder="Event name or *"
                                value={watchEventName}
                                onChange={(e) => setWatchEventName(e.target.value)}
                            />
                            <button
                                className="px-3 py-2 rounded-md text-sm text-white bg-violet-600/70 hover:bg-violet-500/70"
                                onClick={handleStartWatcher}
                            >
                                Start Watcher
                            </button>
                            {watchers.length > 0 && (
                                <div className="space-y-2">
                                    {watchers.slice(0, 4).map((watcher) => (
                                        <div key={watcher.id} className="flex items-center justify-between text-xs text-white/80 bg-black/20 px-2 py-1 rounded">
                                            <span>{watcher.eventName} ({watcher.id.slice(0, 8)}...)</span>
                                            <button
                                                className="text-amber-300 hover:text-amber-200"
                                                onClick={async () => {
                                                    try {
                                                        await BlockchainService.stopWatcher(activeProject.id, watcher.id);
                                                        setOpsMessage("Watcher stopped.");
                                                        await fetchData();
                                                    } catch {
                                                        setOpsMessage("Failed to stop watcher.");
                                                    }
                                                }}
                                            >
                                                Stop
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 rounded-lg border border-white/[0.08] p-3">
                            <p className="text-sm font-medium text-white">Signer Send</p>
                            <select
                                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm"
                                value={signerHotWalletId}
                                onChange={(e) => setSignerHotWalletId(e.target.value)}
                            >
                                <option value="">Select hot wallet</option>
                                {hotWallets.map((wallet) => (
                                    <option key={wallet.id} value={wallet.id}>
                                        {(wallet.label || wallet.address).slice(0, 32)}
                                    </option>
                                ))}
                            </select>
                            <input
                                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm"
                                placeholder="To address (0x...)"
                                value={signerTo}
                                onChange={(e) => setSignerTo(e.target.value)}
                            />
                            <input
                                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm"
                                placeholder="Value in wei"
                                value={signerValue}
                                onChange={(e) => setSignerValue(e.target.value)}
                            />
                            <input
                                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm"
                                placeholder="Calldata hex (optional)"
                                value={signerData}
                                onChange={(e) => setSignerData(e.target.value)}
                            />
                            <button
                                className="px-3 py-2 rounded-md text-sm text-white bg-orange-600/70 hover:bg-orange-500/70"
                                onClick={handleSignerSend}
                            >
                                Send Transaction
                            </button>
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            {/* Tab switcher */}
            <ScrollReveal direction="up" delay={0.1}>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
                    {(["transactions", "nfts", "events"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                                activeTab === tab
                                    ? "bg-white/[0.08] text-white"
                                    : "text-white/50 hover:text-white/70"
                            }`}
                        >
                            {tab === "transactions"
                                ? "Transactions"
                                : tab === "nfts"
                                    ? "NFT Gallery"
                                    : "Events"}
                        </button>
                    ))}
                </div>
            </ScrollReveal>

            {/* Tab content */}
            {activeTab === "transactions" && (
                <ScrollReveal direction="up" delay={0.05}>
                    <div>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
                            <p className="text-xs text-white/40 mt-1">On-chain activity across all project wallets.</p>
                        </div>
                        <TxTable transactions={transactions} loading={loading} />
                    </div>
                </ScrollReveal>
            )}

            {activeTab === "nfts" && (
                <ScrollReveal direction="up" delay={0.05}>
                    <div>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-white">Project NFTs</h2>
                            <p className="text-xs text-white/40 mt-1">Digital assets minted or owned by this project.</p>
                        </div>
                        <NFTGallery nfts={nfts} loading={loading} />
                    </div>
                </ScrollReveal>
            )}

            {activeTab === "events" && (
                <ScrollReveal direction="up" delay={0.05}>
                    <div>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-white">Contract Events</h2>
                            <p className="text-xs text-white/40 mt-1">Indexed chain events ingested via webhook and available for read-only product UI.</p>
                        </div>
                        <EventTable events={events} loading={loading} />
                    </div>
                </ScrollReveal>
            )}
        </div>
    );
}
