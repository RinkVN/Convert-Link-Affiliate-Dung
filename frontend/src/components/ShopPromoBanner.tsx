import React from "react";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import saleImage from "@/images/sale.jpeg";

interface ShopPromoBannerProps {
  visible: boolean;
  hasToast: boolean;
  onClose: () => void;
}

export const ShopPromoBanner: React.FC<ShopPromoBannerProps> = ({
  visible,
  hasToast,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <div
      className={`fixed inset-x-0 z-40 px-4 transition-all duration-300 ${
        hasToast ? "bottom-20" : "bottom-4"
      }`}
    >
      <Card className="mx-auto flex max-w-3xl items-center justify-between gap-4 border-none bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-500 px-5 py-3 text-white shadow-2xl">
        <div className="flex flex-1 items-center gap-3">
          <img
            src={saleImage}
            alt="Big sale tại ShopBNH.vn"
            className="hidden h-14 w-14 rounded-md object-cover shadow-md md:block"
          />
          <div className="flex flex-1 flex-col gap-1 text-sm md:flex-row md:items-center md:gap-3">
            <span className="font-semibold uppercase tracking-wide">
              Khám phá ShopBNH.vn
            </span>
            <span className="opacity-90">
              Mua sắm với hàng ngàn ưu đãi thú vị, cập nhật mỗi ngày dành riêng
              cho bạn.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://shopbnh.vn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="sm"
              className="bg-white text-stone-900 hover:bg-stone-100"
            >
              Khám phá ngay
            </Button>
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/80 hover:bg-white/10 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
