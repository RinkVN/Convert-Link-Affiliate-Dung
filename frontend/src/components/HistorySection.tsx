import { History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { HistoryItem } from "@/types";

type Props = {
  items: HistoryItem[];
};

export function HistorySection({ items }: Props) {
  return (
    <section className="mt-16">
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-semibold text-stone-900">
        <History className="h-6 w-6 text-orange-500" />
        Lịch sử 10 link gần nhất
      </h2>
      <Card className="border-stone-200 bg-white/90 shadow-lg">
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="p-8 text-center text-stone-500">Chưa có dữ liệu.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {items.slice(0, 10).map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 p-4 transition-colors hover:bg-stone-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-xs font-medium text-stone-500">
                        Gốc:
                      </span>
                      <a
                        href={item.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sm text-orange-600 hover:underline"
                      >
                        {item.originalUrl}
                      </a>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-xs font-medium text-stone-500">
                        Aff:
                      </span>
                      <a
                        href={item.affiliateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sm text-emerald-600 hover:underline"
                      >
                        {item.affiliateUrl}
                      </a>
                    </div>
                    <div className="flex gap-4 text-xs text-stone-500">
                      {item.subId && <span>subId: {item.subId}</span>}
                      {item.createdAt && (
                        <span>
                          {new Date(item.createdAt).toLocaleString("vi-VN", {
                            hour12: false,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
