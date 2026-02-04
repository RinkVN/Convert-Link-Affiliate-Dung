import { ShoppingCart, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type ProductInfo = {
  price?: number;
  discount?: number;
  productName?: string;
  image?: string;
  commissionRate?: number;
  estimatedCommission?: number;
};

function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

type Props = {
  affiliateUrl: string;
  clickTrackingUrl?: string;
  productInfo?: ProductInfo | null;
  onCopy: () => void;
};

export function ResultCard({
  affiliateUrl,
  clickTrackingUrl,
  productInfo,
  onCopy,
}: Props) {
  // Ưu tiên affiliateUrl trực tiếp (đặc biệt cho TikTok Shop)
  // clickTrackingUrl chỉ dùng khi affiliateUrl không có
  const openUrl = affiliateUrl || clickTrackingUrl;
  const hasProduct = productInfo?.productName || productInfo?.image;

  const hasPrice = typeof productInfo?.price === "number";
  const rawPrice = hasPrice ? productInfo!.price! : null;
  const hasDiscount = typeof productInfo?.discount === "number";

  let finalPrice: number | null = null;
  let originalPrice: number | null = null;
  let discountPercent: number | null = null;

  if (hasPrice) {
    if (hasDiscount && productInfo!.discount! > 0) {
      const d = productInfo!.discount!;
      // Nếu discount là % (0-100)
      if (d > 0 && d < 100) {
        originalPrice = rawPrice;
        finalPrice = Math.round(rawPrice! * (1 - d / 100));
        discountPercent = d;
      } else {
        // discount là giá sau giảm hoặc giảm thẳng
        const assumedSale = d < rawPrice! ? d : rawPrice!;
        originalPrice = assumedSale < rawPrice! ? rawPrice! : null;
        finalPrice = assumedSale;
        discountPercent =
          originalPrice && originalPrice > 0
            ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
            : null;
      }
    } else {
      finalPrice = rawPrice;
    }
  }

  return (
    <Card className="overflow-hidden border-emerald-200 bg-white shadow-lg">
      <CardHeader className="border-b border-stone-100 bg-stone-50/50 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          <h3 className="text-sm font-semibold text-stone-700">
            Kết quả tìm kiếm
          </h3>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Ảnh sản phẩm bên trái */}

          {productInfo?.image && (
            <div className="flex-shrink-0 sm:w-48">
              <div className="aspect-square w-32 mx-auto bg-stone-100 sm:w-full sm:h-full sm:min-h-[200px] ">
                <img
                  src={productInfo.image}
                  alt={productInfo.productName || "Sản phẩm"}
                  className="h-full w-full object-cover rounded-lg mt-4"
                />
              </div>
            </div>
          )}

          {/* Nội dung bên phải */}
          <div className="flex flex-1 min-w-0 flex-col justify-between p-4 sm:p-5">
            {hasProduct && (
              <h2 className="text-lg font-bold text-stone-900 line-clamp-2">
                {productInfo!.productName}
              </h2>
            )}

            {finalPrice != null && (
              <div className="mt-3 flex flex-wrap items-baseline gap-2 text-base font-semibold">
                <span className="text-xl font-bold text-orange-600">
                  {formatVnd(finalPrice)}
                </span>
                {originalPrice != null && originalPrice > finalPrice && (
                  <span className="text-sm font-normal text-stone-400 line-through">
                    {formatVnd(originalPrice)}
                  </span>
                )}
                {discountPercent != null && discountPercent > 0 && (
                  <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                    -{discountPercent.toLocaleString("vi-VN")}%
                  </span>
                )}
              </div>
            )}

            {/* Hiển thị thông tin hoa hồng */}
            {(productInfo?.commissionRate != null ||
              productInfo?.estimatedCommission != null) && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-emerald-800">
                      💰 Hoa hồng affiliate:
                    </span>
                    {productInfo.estimatedCommission != null && (
                      <span className="text-lg font-bold text-emerald-700">
                        {formatVnd(productInfo.estimatedCommission)}
                      </span>
                    )}
                  </div>
                  {productInfo.commissionRate != null && (
                    <div className="text-xs text-emerald-700">
                      Tỷ lệ hoa hồng:{" "}
                      <span className="font-semibold">
                        {productInfo.commissionRate.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!hasProduct && (
              <div className="w-full min-w-0 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-xs text-stone-600 truncate">
                {affiliateUrl}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <Button asChild className="bg-orange-500 hover:bg-orange-600">
                <a href={openUrl} target="_blank" rel="noreferrer">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Mua ngay trên sàn
                </a>
              </Button>
              <Button
                variant="outline"
                onClick={onCopy}
                className="border-stone-300 text-stone-700 hover:bg-stone-100"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Copy link
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
