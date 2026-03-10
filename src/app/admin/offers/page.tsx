import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Plus, Send, XCircle, Clock, CheckCircle } from "lucide-react";
import OfferActions from "@/components/admin/OfferActions";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  GBP: "\u00a3",
  EUR: "\u20ac",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: Clock },
  accepted: { bg: "bg-green-50 border-green-200", text: "text-green-700", icon: CheckCircle },
  cancelled: { bg: "bg-slate-50 border-slate-200", text: "text-slate-500", icon: XCircle },
  expired: { bg: "bg-red-50 border-red-200", text: "text-red-500", icon: XCircle },
};

export default async function OffersPage() {
  const adminClient = createAdminClient();

  const { data: offers } = await adminClient
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false });

  const all = offers || [];
  const pending = all.filter((o) => o.status === "pending");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Custom Offers</h1>
          <p className="text-slate-500 mt-1">
            {pending.length} pending offer{pending.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/offers/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Offer
        </Link>
      </div>

      {all.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Offer
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Client
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Amount
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Sent
                </th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {all.map((offer) => {
                const symbol = CURRENCY_SYMBOLS[offer.currency] || "$";
                const displayAmount = `${symbol}${(offer.amount / 100).toFixed(2)}`;
                const style = STATUS_STYLES[offer.status] || STATUS_STYLES.pending;
                const StatusIcon = style.icon;

                return (
                  <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-navy">
                        {offer.title}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <span className="text-sm text-slate-600">
                          {offer.client_name || offer.client_email}
                        </span>
                        {offer.client_name && (
                          <span className="block text-xs text-slate-400">{offer.client_email}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-navy">
                        {displayAmount}
                      </span>
                      {offer.timeline_days && (
                        <span className="block text-xs text-slate-400">{offer.timeline_days} days</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${style.bg} ${style.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-slate-500">
                        {new Date(offer.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {offer.status === "pending" && (
                        <OfferActions offerId={offer.id} />
                      )}
                      {offer.status === "accepted" && offer.project_id && (
                        <Link
                          href={`/admin/projects/${offer.project_id}`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Project
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-navy mb-2">
            No offers yet
          </h2>
          <p className="text-slate-500 mb-4">
            Create a custom offer and send it to a client with a payment link.
          </p>
          <Link
            href="/admin/offers/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Offer
          </Link>
        </div>
      )}
    </div>
  );
}
