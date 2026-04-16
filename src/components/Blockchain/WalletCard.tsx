"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Wallet } from "@/services/BlockchainService";

interface WalletCardProps {
    wallet: Wallet;
}

export default function WalletCard({ wallet }: WalletCardProps) {
    const balance = wallet.balanceCache || "--";

    return (
        <Card>
            <CardContent className="py-6">
                <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary">
                        {wallet.chain}
                    </Badge>
                    {wallet.label && <Badge variant="outline" className="text-xs">{wallet.label}</Badge>}
                </div>
                <div className="space-y-1">
                    <p className="text-2xl font-bold tracking-tight text-primary">
                        {balance} <span className="text-sm font-normal text-muted-foreground">{wallet.chain.toUpperCase()}</span>
                    </p>
                    <div className="flex items-center justify-between">
                        <code className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                            {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                        </code>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => navigator.clipboard.writeText(wallet.address)}>
                            Copy
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
