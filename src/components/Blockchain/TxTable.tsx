"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/services/BlockchainService";
import { format } from "date-fns";

interface TxTableProps {
    transactions: Transaction[];
    loading?: boolean;
}

export default function TxTable({ transactions, loading }: TxTableProps) {
    if (loading) {
        return <div className="text-center py-10 text-muted-foreground text-sm">Loading transactions...</div>;
    }

    if (transactions.length === 0) {
        return <div className="text-center py-10 text-muted-foreground text-sm">No transactions found.</div>;
    }

    return (
        <div className="rounded-md border border-border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Chain</TableHead>
                        <TableHead>Tx Hash</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                            <TableCell className="font-medium capitalize">{tx.chain}</TableCell>
                            <TableCell>
                                <code className="text-xs font-mono">{tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}</code>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                                {format(new Date(tx.timestamp), "MMM d, yyyy HH:mm")}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={tx.status === "confirmed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"}
                                    className="capitalize"
                                >
                                    {tx.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {tx.value ?? "--"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
