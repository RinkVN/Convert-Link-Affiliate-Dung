import React, { useEffect, useMemo, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { DotPattern } from "@/components/aceternity/DotPattern";
import { GridPattern } from "@/components/aceternity/GridPattern";
import { AppHeader } from "@/components/AppHeader";
import { HeroSection } from "@/components/HeroSection";
import { ConvertForm } from "@/components/ConvertForm";
import { ResultCard } from "@/components/ResultCard";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { AppFooter } from "@/components/AppFooter";
import { ShopPromoBanner } from "@/components/ShopPromoBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { HistoryItem, TopProduct } from "@/types";
import {
  loadLocalSubId,
  saveLocalSubId,
  saveLocalHistory,
} from "@/lib/storage";
import { useSessionTracking } from "@/hooks/useSessionTracking";

const App: React.FC = () => {
  const [originalUrl, setOriginalUrl] = useState("");
  const [subId, setSubId] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [clickTrackingUrl, setClickTrackingUrl] = useState<
    string | undefined
  >();
  const [productInfo, setProductInfo] = useState<{
    commissionRate?: number;
    estimatedCommission?: number;
    price?: number;
    discount?: number;
    productName?: string;
    image?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showShopPromo, setShowShopPromo] = useState(true);

  useSessionTracking();

  useEffect(() => {
    setSubId(loadLocalSubId());

    api
      .get<{ data: HistoryItem[] }>("/api/convert/recent?limit=10")
      .then((resp) => {
        if (Array.isArray(resp.data?.data)) {
          setHistory(resp.data.data);
        }
      })
      .catch(() => {});

    api
      .get<{ data: TopProduct[] }>("/api/top-products")
      .then((resp) => {
        if (Array.isArray(resp.data?.data) && resp.data.data.length > 0) {
          setTopProducts(resp.data.data.slice(0, 8));
        }
      })
      .catch(() => {})
      .finally(() => setProductsLoading(false));
  }, []);

  const canSubmit = useMemo(
    () => !!originalUrl && !loading,
    [originalUrl, loading]
  );

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setAffiliateUrl("");
    setClickTrackingUrl(undefined);
    setProductInfo(null);

    try {
      if (subId) saveLocalSubId(subId);

      const payload: { originalUrl: string; subId?: string } = {
        originalUrl: originalUrl.trim(),
      };
      if (subId.trim()) payload.subId = subId.trim();

      const resp = await api.post<{
        id: string;
        affiliateUrl: string;
        clickTrackingUrl?: string;
        productInfo?: {
          commissionRate?: number;
          estimatedCommission?: number;
          price?: number;
          discount?: number;
          productName?: string;
          image?: string;
        };
      }>("/api/convert", payload);

      setAffiliateUrl(resp.data.affiliateUrl);
      setClickTrackingUrl(resp.data.clickTrackingUrl);
      setProductInfo(resp.data.productInfo ?? null);

      const newItem: HistoryItem = {
        id: resp.data.id,
        originalUrl: originalUrl.trim(),
        affiliateUrl: resp.data.affiliateUrl,
        subId: subId.trim(),
        createdAt: new Date().toISOString(),
      };

      setHistory((prev) => {
        const updated = [newItem, ...prev];
        saveLocalHistory(updated);
        return updated.slice(0, 10);
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Có lỗi xảy ra khi convert link. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!affiliateUrl) return;
    try {
      await navigator.clipboard.writeText(affiliateUrl);
      setToast({
        type: "success",
        message: "Đã copy affiliate link vào clipboard!",
      });
      setTimeout(() => {
        setToast(null);
      }, 3000);
    } catch {
      setToast({
        type: "error",
        message: "Không thể copy tự động, vui lòng copy thủ công.",
      });
      setTimeout(() => {
        setToast(null);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/80 text-stone-900 antialiased">
      <DotPattern className="opacity-60" />
      <GridPattern className="opacity-40" />

      <AppHeader subId={subId} onSubIdChange={setSubId} />

      <HeroSection />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24">
        {/* Công cụ tạo link - tính năng chính */}
        <section className="relative -mt-8 space-y-6">
          <ConvertForm
            originalUrl={originalUrl}
            loading={loading}
            error={error}
            canSubmit={canSubmit}
            onOriginalUrlChange={setOriginalUrl}
            onSubmit={handleConvert}
          />
          {affiliateUrl && (
            <ResultCard
              affiliateUrl={affiliateUrl}
              clickTrackingUrl={clickTrackingUrl}
              productInfo={productInfo ?? undefined}
              onCopy={handleCopy}
            />
          )}
        </section>

        {/* Sản phẩm nổi bật - phụ */}
        <FeaturedProducts products={topProducts} loading={productsLoading} />
      </main>

      <AppFooter />
      <Analytics />

      {toast && (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <Card
            className={`max-w-sm shadow-lg border ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <CardContent className="flex items-center justify-between gap-3 py-3">
              <p
                className={`text-sm ${
                  toast.type === "success" ? "text-emerald-800" : "text-red-700"
                }`}
              >
                {toast.message}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-stone-400 hover:text-stone-700"
                onClick={() => setToast(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <ShopPromoBanner
        visible={showShopPromo}
        hasToast={!!toast}
        onClose={() => setShowShopPromo(false)}
      />
    </div>
  );
};

export default App;
