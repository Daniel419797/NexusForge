"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NFT } from "@/services/BlockchainService";

interface NFTGalleryProps {
    nfts: NFT[];
    loading?: boolean;
}

export default function NFTGallery({ nfts, loading }: NFTGalleryProps) {
    if (loading) {
        return <div className="text-center py-10 text-muted-foreground text-sm">Loading NFTs...</div>;
    }

    if (nfts.length === 0) {
        return <div className="text-center py-10 text-muted-foreground text-sm">No NFTs found in this project.</div>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {nfts.map((nft) => (
                <Card key={nft.id} className="overflow-hidden">
                    <div className="aspect-square bg-muted flex items-center justify-center relative">
                        {nft.metadata?.image ? (
                            <img src={nft.metadata.image} alt={nft.metadata?.name || "NFT"} className="object-cover w-full h-full" />
                        ) : (
                            <span className="text-4xl text-muted-foreground/30">🎨</span>
                        )}
                        <Badge className="absolute top-2 right-2 text-[10px]" variant="secondary">
                            #{nft.tokenId}
                        </Badge>
                    </div>
                    <CardContent className="p-3">
                        <h4 className="font-semibold text-sm truncate">{nft.metadata?.name || "Unknown NFT"}</h4>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                            {nft.contractAddress.slice(0, 6)}...{nft.contractAddress.slice(-4)}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
