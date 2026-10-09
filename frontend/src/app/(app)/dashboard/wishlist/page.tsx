import type { Metadata } from "next";
import WishlistView from "@/components/app/WishlistView";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return <WishlistView />;
}
