import { cn } from "@/lib/utils";

export function InfiniteMovingCards({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: { quote: string; name: string; title: string }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex max-w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className
      )}
    >
      <div
        className={cn(
          "flex shrink-0 animate-scroll justify-around gap-4",
          pauseOnHover && "hover:[animation-play-state:paused]",
          direction === "left" ? "" : "[animation-direction:reverse]",
          speed === "fast" && "[--animation-duration:20s]",
          speed === "normal" && "[--animation-duration:40s]",
          speed === "slow" && "[--animation-duration:80s]"
        )}
      >
        {[...items, ...items].map((item, idx) => (
          <div
            key={idx}
            className="relative flex w-[350px] max-w-full shrink-0 flex-col gap-2 rounded-2xl border border-white/10 bg-gradient-to-b from-white/20 to-white/5 px-8 py-6 backdrop-blur-sm"
          >
            <blockquote>
              <span className="text-sm leading-[1.6] text-white/90">
                {item.quote}
              </span>
            </blockquote>
            <div className="mt-2 flex flex-row items-center gap-2">
              <span className="text-sm font-medium text-white">
                {item.name}
              </span>
              <span className="text-xs text-white/50">—</span>
              <span className="text-xs text-white/50">{item.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
