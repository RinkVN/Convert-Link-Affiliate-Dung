import shopeeLogo from "@/images/logo/shopee.png";
import lazadaLogo from "@/images/logo/lazada.png";
import tiktokshopLogo from "@/images/logo/tiktokshop.png";
import bnhLogo from "@/images/logo/bnh.jpg";

const FLOATING_LOGOS = [
  { src: shopeeLogo, alt: "Shopee", className: "top-[20%] left-2 md:left-100 w-12 h-12 md:w-14 md:h-14", delay: "0s", duration: "4s" },
  { src: lazadaLogo, alt: "Lazada", className: "top-[25%] right-2 md:right-100 w-11 h-11 md:w-13 md:h-13", delay: "0.5s", duration: "5s" },
  { src: tiktokshopLogo, alt: "TikTok Shop", className: "top-[65%] left-2 md:left-90 w-10 h-10 md:w-12 md:h-12", delay: "1s", duration: "4.5s" },
  { src: bnhLogo, alt: "BNH", className: "top-[70%] right-2 md:right-100 w-11 h-11 md:w-13 md:h-13", delay: "0.3s", duration: "5.5s" },
];

export function FloatingLogos() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1]">
      {FLOATING_LOGOS.map((logo) => (
        <div
          key={logo.alt}
          className={`absolute opacity-75 rounded-xl overflow-hidden shadow-lg ${logo.className}`}
          style={{
            animation: "float ease-in-out infinite",
            animationDelay: logo.delay,
            animationDuration: logo.duration,
          }}
        >
          <img src={logo.src} alt={logo.alt} className="w-full h-full object-contain" />
        </div>
      ))}
    </div>
  );
}
