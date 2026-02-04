import { cn } from "@/lib/utils";

export function GridPattern({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "absolute inset-0 -z-10 h-full w-full",
        "bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)]",
        "bg-[size:24px_24px]",
        className
      )}
      {...props}
    />
  );
}
