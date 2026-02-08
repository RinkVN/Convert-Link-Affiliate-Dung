import { useEffect, useRef, useState } from "react";
import {
  Search,
  Filter,
  X,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

type Coupon = {
  id: string;
  name: string;
  merchant: string;
  image?: string;
  aff_link?: string;
  link?: string;
  prod_link?: string;
  content?: string;
  discount_value?: number;
  discount_percentage?: number;
  end_date?: string;
  coupons?: {
    coupon_code?: string;
    coupon_desc?: string;
  }[];
};

type Props = {
  title?: string;
};

const SORT_OPTIONS = [
  { value: "", label: "Mặc định" },
  { value: "hot", label: "Mã hot" },
  { value: "discount_value", label: "Giảm giá cao" },
  { value: "discount_percentage", label: "Giảm % cao" },
  { value: "end_date_asc", label: "Sắp hết hạn" },
  { value: "end_date_desc", label: "Còn hạn dài" },
  { value: "newest", label: "Mới nhất" },
];

const COUPON_TYPE_OPTIONS = [
  { value: "", label: "Tất cả loại" },
  { value: "value", label: "Giảm tiền" },
  { value: "percent", label: "Giảm %" },
  { value: "hot", label: "Mã hot" },
];

const DISCOUNT_VALUE_OPTIONS = [
  { value: "", label: "Tất cả giá trị" },
  { value: "0-20000", label: "0 - 20K" },
  { value: "20000-50000", label: "20K - 50K" },
  { value: "50000-100000", label: "50K - 100K" },
  { value: "100000-999999999", label: "100K+" },
];

const DISCOUNT_PERCENT_OPTIONS = [
  { value: "", label: "Tất cả %" },
  { value: "0-10", label: "0 - 10%" },
  { value: "10-20", label: "10% - 20%" },
  { value: "20-100", label: "20%+" },
];

function CouponCard({ coupon: c }: { coupon: Coupon }) {
  const mainCode = c.coupons?.[0]?.coupon_code;
  const mainDesc = c.coupons?.[0]?.coupon_desc;
  const href = c.aff_link;

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden transition-colors hover:border-primary/30",
        "border-border/80",
      )}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-3">
        {c.image && (
          <img
            src={c.image}
            alt={c.name}
            className="h-12 w-12 shrink-0 rounded-md border border-border object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <CardTitle className="line-clamp-2 text-base font-semibold">
            {c.name}
          </CardTitle>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{c.merchant}</span>
            {mainCode && (
              <Badge variant="secondary" className="text-[11px] font-medium">
                {mainCode}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm">
        {(mainDesc || c.content) && (
          <p className="line-clamp-3 text-muted-foreground">
            {mainDesc || c.content}
          </p>
        )}
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Xem chi tiết & áp dụng mã →
          </a>
        )}
      </CardContent>
    </Card>
  );
}

function CouponCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/80">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <Skeleton className="h-12 w-12 shrink-0 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </CardContent>
    </Card>
  );
}

export function CouponsList({ title = "Mã khuyến mại nổi bật" }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [filters, setFilters] = useState({
    coupon_type: "",
    discount_value: "",
    discount_percent: "",
    sort: "",
  });

  const pageSize = 20;
  const pinnedCount = 5;
  const [pinnedCoupons, setPinnedCoupons] = useState<Coupon[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const isInitialMount = useRef(true);

  const hasActiveFilters =
    searchQuery ||
    filters.coupon_type ||
    filters.discount_value ||
    filters.discount_percent ||
    filters.sort;
  const showPinned = !searchQuery && !hasActiveFilters;

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  useEffect(() => {
    let cancelled = false;

    async function fetchPinned() {
      if (!showPinned) return null;
      const resp = await api.get<{ data: Coupon[] }>("/api/coupons/pinned", {
        params: { domain: "shopee.vn", limit: pinnedCount },
      });
      return Array.isArray(resp.data?.data) ? resp.data.data : [];
    }

    async function fetchCoupons() {
      setLoading(true);
      setError(null);
      try {
        if (searchQuery) {
          const params: Record<string, string | number | undefined> = {
            q: searchQuery,
            domain: "shopee.vn",
            is_next_day_coupon: "false",
            limit: pageSize,
            page,
          };
          const resp = await api.get<{
            data: Coupon[];
            meta?: { total?: number };
          }>("/api/search", { params });

          if (!cancelled && Array.isArray(resp.data?.data)) {
            setCoupons(resp.data.data);
            setPinnedCoupons([]);
            setTotal(resp.data.meta?.total ?? resp.data.data.length ?? 0);
          }
        } else {
          const listParams: Record<string, string | number | boolean> = {
            is_next_day_coupon: false,
            domain: "shopee.vn",
            limit: pageSize,
            page,
            skip_first: showPinned ? pinnedCount : 0,
          };
          if (filters.coupon_type) listParams.coupon_type = filters.coupon_type;
          if (filters.sort) listParams.sort = filters.sort;
          if (filters.discount_value) {
            const [min, max] = filters.discount_value.split("-").map(Number);
            if (!Number.isNaN(min)) listParams.discount_value_min = min;
            if (!Number.isNaN(max)) listParams.discount_value_max = max;
          }
          if (filters.discount_percent) {
            const [min, max] = filters.discount_percent.split("-").map(Number);
            if (!Number.isNaN(min)) listParams.discount_percentage_min = min;
            if (!Number.isNaN(max)) listParams.discount_percentage_max = max;
          }

          const [pinnedResult, listResp] = await Promise.all([
            fetchPinned(),
            api.get<{ data: Coupon[]; meta?: { total?: number } }>(
              "/api/coupons",
              { params: listParams },
            ),
          ]);

          if (!cancelled && Array.isArray(listResp.data?.data)) {
            setCoupons(listResp.data.data);
            setPinnedCoupons(
              showPinned && Array.isArray(pinnedResult) ? pinnedResult : [],
            );
            setTotal(
              listResp.data.meta?.total ?? listResp.data.data.length ?? 0,
            );
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.error ||
              err?.message ||
              "Không thể tải danh sách mã khuyến mại.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCoupons();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, filters, searchQuery, showPinned]);

  const handleSearch = () => {
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setFilters({
      coupon_type: "",
      discount_value: "",
      discount_percent: "",
      sort: "",
    });
    setPage(1);
  };

  const totalPages = showPinned
    ? Math.max(1, Math.ceil(Math.max(0, total - pinnedCount) / pageSize))
    : Math.max(1, Math.ceil(total / pageSize));

  const getPageNumbers = () => {
    const delta = 2;
    const range: (number | "ellipsis")[] = [];
    const rangeWithDots: (number | "ellipsis")[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - delta && i <= page + delta)
      ) {
        range.push(i);
      } else if (l !== undefined && i === l + 1) {
        range.push("ellipsis");
      }
      if (typeof range[range.length - 1] === "number") {
        l = range[range.length - 1] as number;
      }
    }

    range.forEach((i) => {
      if (i === "ellipsis") {
        rangeWithDots.push("ellipsis");
      } else {
        rangeWithDots.push(i);
      }
    });
    return rangeWithDots;
  };

  if (loading && coupons.length === 0) {
    return (
      <section className="mt-10 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full max-w-md" />
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-32" />
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <CouponCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-10">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center justify-between py-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                setLoading(true);
              }}
            >
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="mt-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {total > 0 && (
          <p className="text-sm">
            Hiển thị{" "}
            {showPinned
              ? pinnedCoupons.length + coupons.length
              : coupons.length}{" "}
            /
            <span className="text-sm text-[#ff0200]">
              {" "}
              {total.toLocaleString("vi-VN")}{" "}
            </span>
            mã
          </p>
        )}
      </div>

      {/* Filter bar */}
      <Card className="border-border/80">
        <CardContent className="p-4">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm theo tên, mã, mô tả... (vd: giảm 20k, freeship)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} size="default">
              <Search className="size-4 sm:mr-2" />
              <span className="hidden sm:inline">Tìm kiếm</span>
            </Button>
          </div>
          {searchQuery && (
            <p className="text-xs text-muted-foreground">
              Đang tìm: &quot;{searchQuery}&quot;
            </p>
          )}

          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="size-4 text-muted-foreground" />
              Bộ lọc
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs text-primary hover:text-primary"
              >
                <X className="mr-1 size-3.5" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Loại coupon
              </label>
              <Select
                value={filters.coupon_type || "all"}
                onValueChange={(v) =>
                  handleFilterChange("coupon_type", v === "all" ? "" : v)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  {COUPON_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value || "all"} value={o.value || "all"}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Giá trị giảm
              </label>
              <Select
                value={filters.discount_value || "all"}
                onValueChange={(v) =>
                  handleFilterChange("discount_value", v === "all" ? "" : v)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn khoảng" />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_VALUE_OPTIONS.map((o) => (
                    <SelectItem key={o.value || "all"} value={o.value || "all"}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                % giảm
              </label>
              <Select
                value={filters.discount_percent || "all"}
                onValueChange={(v) =>
                  handleFilterChange("discount_percent", v === "all" ? "" : v)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn khoảng" />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_PERCENT_OPTIONS.map((o) => (
                    <SelectItem key={o.value || "all"} value={o.value || "all"}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Sắp xếp
              </label>
              <Select
                value={filters.sort || "default"}
                onValueChange={(v) =>
                  handleFilterChange("sort", v === "default" ? "" : v)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem
                      key={o.value || "default"}
                      value={o.value || "default"}
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pinned: 5 coupons đầu tiên khi chưa search/filter */}
      {showPinned && pinnedCoupons.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Nổi bật</p>
          <div className="grid gap-4 md:grid-cols-2">
            {pinnedCoupons.map((c) => (
              <CouponCard key={c.id} coupon={c} />
            ))}
          </div>
        </div>
      )}

      {/* Coupon grid */}
      <div className="space-y-3">
        {showPinned && (pinnedCoupons.length > 0 || coupons.length > 0) && (
          <p className="text-sm font-medium text-muted-foreground">Tất cả mã</p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <CouponCardSkeleton key={i} />
              ))
            : coupons.map((c) => <CouponCard key={c.id} coupon={c} />)}
        </div>
      </div>

      {/* Empty state */}
      {!loading &&
        !coupons.length &&
        !(showPinned && pinnedCoupons.length > 0) && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Không có mã khuyến mại phù hợp.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={clearFilters}
              >
                Xóa bộ lọc
              </Button>
            </CardContent>
          </Card>
        )}

      {/* Pagination */}
      {totalPages > 1 && coupons.length > 0 && (
        <div className="flex justify-center pt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <button
                  type="button"
                  onClick={() => page > 1 && setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className={cn(
                    "inline-flex items-center justify-center gap-1 rounded-md border border-input bg-background px-2.5 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                    page <= 1 && "opacity-50",
                  )}
                  aria-label="Trang trước"
                >
                  <ChevronLeftIcon className="size-4" />
                  <span className="hidden sm:inline">Trang trước</span>
                </button>
              </PaginationItem>
              {getPageNumbers().map((pageNum, i) =>
                pageNum === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <span className="flex size-9 items-center justify-center px-2">
                      …
                    </span>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(pageNum as number);
                      }}
                      isActive={page === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <button
                  type="button"
                  onClick={() => page < totalPages && setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  className={cn(
                    "inline-flex items-center justify-center gap-1 rounded-md border border-input bg-background px-2.5 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                    page >= totalPages && "opacity-50",
                  )}
                  aria-label="Trang sau"
                >
                  <span className="hidden sm:inline">Trang sau</span>
                  <ChevronRightIcon className="size-4" />
                </button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </section>
  );
}
