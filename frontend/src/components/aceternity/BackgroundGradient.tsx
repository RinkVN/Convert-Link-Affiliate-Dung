import { cn } from "@/lib/utils";

export function BackgroundGradient({
  children,
  className,
  containerClassName,
  animate = true,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-white p-10",
        containerClassName
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden rounded-2xl",
          animate && "animate-aurora"
        )}
      >
        <div className="absolute -inset-[10px] opacity-50">
          <div
            className={cn(
              "absolute inset-0 h-full w-full",
              "bg-[radial-gradient(circle_at_50%_120%,rgba(238,77,45,0.3),rgba(255,255,255,0))]",
              animate && "animate-pulse"
            )}
          />
        </div>
      </div>
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
}
