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
import type { ContractEvent } from "@/services/BlockchainService";
import { format } from "date-fns";

interface EventTableProps {
    events: ContractEvent[];
    loading?: boolean;
}

export default function EventTable({ events, loading }: EventTableProps) {
    if (loading) {
        return <div className="text-center py-10 text-muted-foreground text-sm">Loading contract events...</div>;
    }

    if (events.length === 0) {
        return <div className="text-center py-10 text-muted-foreground text-sm">No contract events found.</div>;
    }

    return (
        <div className="rounded-md border border-border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Contract</TableHead>
                        <TableHead>Chain</TableHead>
                        <TableHead>Tx Hash</TableHead>
                        <TableHead>Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {events.map((event) => (
                        <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.eventName}</TableCell>
                            <TableCell>
                                <code className="text-xs font-mono">{event.contractAddress.slice(0, 8)}...{event.contractAddress.slice(-6)}</code>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="capitalize">{event.chain}</Badge>
                            </TableCell>
                            <TableCell>
                                {event.txHash
                                    ? <code className="text-xs font-mono">{event.txHash.slice(0, 8)}...{event.txHash.slice(-6)}</code>
                                    : <span className="text-xs text-muted-foreground">--</span>}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                                {format(new Date(event.createdAt), "MMM d, yyyy HH:mm")}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
