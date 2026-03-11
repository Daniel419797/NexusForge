"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Wallet } from "@/services/BlockchainService";

interface WalletCardProps {
    wallet: Wallet;
}

export default function WalletCard({ wallet }: WalletCardProps) {
    return (
        <Card>
            <CardContent className="py-6">
                <div className="flex items-center justify-between mb-4">
                    <Badge variant={wallet.isPrimary ? "default" : "secondary"}>
                        {wallet.network}
                    </Badge>
                    {wallet.isPrimary && <Badge variant="outline" className="text-xs">Primary</Badge>}
                </div>
                <div className="space-y-1">
                    <p className="text-2xl font-bold tracking-tight text-primary">
                        {wallet.balance} <span className="text-sm font-normal text-muted-foreground">ETH</span>
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
