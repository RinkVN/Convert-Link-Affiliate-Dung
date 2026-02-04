import { Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  subId: string;
  onSubIdChange: (v: string) => void;
};

export function AppHeader({ subId, onSubIdChange }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-stone-900"
        >
          <img src="/logo.jpg" alt="Mua sắm hoàn tiền" className="h-8 w-8" />
          <span>Mua sắm hoàn tiền</span>
        </a>

        <div className="relative flex items-center gap-2" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-700"
            title="Cài đặt"
          >
            <Settings className="h-4 w-4" />
          </button>
          {settingsOpen && (
            <div className="absolute right-4 top-full z-50 mt-2 w-72 rounded-lg border border-stone-200 bg-white p-4 shadow-lg">
              <Label className="text-sm font-medium text-stone-700">
                subId (tùy chọn, lưu local)
              </Label>
              <Input
                type="text"
                placeholder="Ví dụ: tiktok-ads-01"
                value={subId}
                onChange={(e) => onSubIdChange(e.target.value)}
                className="mt-2 h-9 border-stone-200 text-sm"
              />
              <p className="mt-2 text-xs text-stone-500">
                subId được lưu tự động vào trình duyệt khi bạn convert link.
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
