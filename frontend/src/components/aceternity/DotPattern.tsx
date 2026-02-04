import { cn } from "@/lib/utils";

export function DotPattern({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "absolute inset-0 -z-10 h-full w-full",
        "bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] [background-size:20px_20px]",
        className
      )}
      {...props}
    />
  );
}
