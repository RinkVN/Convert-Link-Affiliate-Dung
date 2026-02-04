import { ShoppingBag, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { TopProduct } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  products: TopProduct[];
  loading: boolean;
};

export function FeaturedProducts({ products, loading }: Props) {
  return (
    <section className="mt-20">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-stone-900">
          <ShoppingBag className="h-6 w-6 text-orange-500" />
          Sản phẩm nổi bật
        </h2>
        <span className="text-sm text-emerald-600 font-medium">
          ✨ Mua qua link để nhận hoàn tiền
        </span>
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card
              key={i}
              className="animate-pulse border-stone-200 bg-white/80"
            >
              <CardContent className="p-4">
                <div className="aspect-square rounded-lg bg-stone-200" />
                <div className="mt-3 h-4 rounded bg-stone-200" />
                <div className="mt-2 h-3 w-2/3 rounded bg-stone-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, idx) => (
            <Card
              key={idx}
              className={cn(
                "group overflow-hidden border-stone-200 bg-white shadow-md transition-all",
                "hover:border-orange-300 hover:shadow-xl hover:shadow-orange-100/50"
              )}
            >
              <a
                href={product.aff_link || product.link}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <div className="relative">
                  <div className="aspect-square overflow-hidden bg-stone-100">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name || "Product"}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-stone-400">
                        <ShoppingBag className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white">
                    Hoàn tiền
                  </span>
                </div>
                <CardContent className="p-4">
                  <p className="line-clamp-2 text-sm font-medium text-stone-900">
                    {product.name || "Sản phẩm"}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-semibold text-orange-600">
                      {formatPrice(product.discount ?? product.price)}
                    </span>
                    {product.price && product.discount && (
                      <span className="text-xs text-stone-500 line-through">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </a>
              <div className="px-4 pb-4">
                <Button
                  asChild
                  size="sm"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  <a
                    href={product.aff_link || product.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mua ngay
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-stone-200 bg-white/80 p-8 text-center text-stone-500">
          Đang cập nhật sản phẩm. Vui lòng quay lại sau.
        </p>
      )}
    </section>
  );
}
