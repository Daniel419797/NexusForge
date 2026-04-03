"use client";

import { useEffect, useState, useCallback } from "react";
import { useProjectStore } from "@/store/projectStore";
import BlockchainService, { type Wallet, type Transaction, type NFT } from "@/services/BlockchainService";
import WalletCard from "@/components/Blockchain/WalletCard";
import TxTable from "@/components/Blockchain/TxTable";
import NFTGallery from "@/components/Blockchain/NFTGallery";
import ElectricRippleButton from "@/components/Dashboard/ElectricRippleButton";
import ScrollReveal from "@/components/Dashboard/ScrollReveal";

export default function BlockchainPage() {
    const { activeProject } = useProjectStore();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"transactions" | "nfts">("transactions");

    const fetchData = useCallback(async () => {
        if (!activeProject) return;
        try {
            const [w, t, n] = await Promise.all([
                BlockchainService.getWallets(activeProject.id),
                BlockchainService.getTransactions(activeProject.id),
                BlockchainService.getNFTs(activeProject.id),
            ]);
            setWallets(w);
            setTransactions(t);
            setNfts(n);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, [activeProject]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreateWallet = async () => {
        if (!activeProject) return;
        try { await BlockchainService.createWallet(activeProject.id, { network: "ethereum" }); fetchData(); }
        catch { /* ignore */ }
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
                        <p className="text-sm text-white/50 mt-2">Manage wallets, view transactions, and browse NFT assets.</p>
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

            {/* Tab switcher */}
            <ScrollReveal direction="up" delay={0.1}>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
                    {(["transactions", "nfts"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                                activeTab === tab
                                    ? "bg-white/[0.08] text-white"
                                    : "text-white/50 hover:text-white/70"
                            }`}
                        >
                            {tab === "transactions" ? "Transactions" : "NFT Gallery"}
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
        </div>
    );
}
