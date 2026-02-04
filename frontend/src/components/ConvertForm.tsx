import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  originalUrl: string;
  loading: boolean;
  error: string | null;
  canSubmit: boolean;
  onOriginalUrlChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function ConvertForm({
  originalUrl,
  loading,
  error,
  canSubmit,
  onOriginalUrlChange,
  onSubmit,
}: Props) {
  return (
    <Card className="border-stone-200/80 bg-white/90 shadow-xl shadow-stone-200/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-stone-900">
          <Link2 className="h-5 w-5 text-orange-500" />
          Dán link sản phẩm Shopee
        </CardTitle>
        <CardDescription className="text-stone-600">
          Dán link Shopee (shopee.vn, vn.shp.ee, s.shopee.vn) để tạo link
          affiliate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            
            <Input
              id="originalUrl"
              type="url"
              required
              placeholder="https://shopee.vn/..."
              value={originalUrl}
              onChange={(e) => onOriginalUrlChange(e.target.value)}
              className="border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus-visible:ring-orange-500"
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-500"
          >
            {loading ? "Đang convert..." : "Chuyển đổi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
