import { Wallet } from "lucide-react";
import { AuroraBackground } from "@/components/aceternity/AuroraBackground";
import { ContainerTextFlip } from "@/components/aceternity/container-text-flip";

export function HeroSection() {
  return (
    <AuroraBackground className="!py-16 md:!py-24">
      <div className="relative flex w-full flex-col items-center justify-center">
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300 
          bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 shadow-sm"
          >
            <Wallet className="h-4 w-4" />
            Hoàn tiền khi mua sắm
          </div>
          <div className="flex items-center justify-center">
            <h1 className="mr-2 bg-gradient-to-b from-stone-900 via-stone-800 to-stone-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-6xl">
              Mua sắm
            </h1>
            <ContainerTextFlip
              words={["Hoàn Tiền", "giá tốt", "an toàn", "dễ dàng"]}
              className="text-4xl md:text-6xl text-[#CC232A]"
            />
          </div>
          <p className="mt-4 max-w-2xl text-lg text-stone-600">
            Mua sắm Shopee qua link của chúng tôi để nhận hoàn tiền hấp dẫn.{" "}
            <br /> Đơn giản, an toàn, tiết kiệm mỗi ngày.
          </p>
        </div>
      </div>
    </AuroraBackground>
  );
}
