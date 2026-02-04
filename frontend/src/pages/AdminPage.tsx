import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart3,
  MousePointer,
  Link2,
  Clock,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";

type AdminStats = {
  totalConversions: number;
  totalClicks: number;
  conversionsByUser: { identifier: string; count: number }[];
  clicksByUser: { identifier: string; count: number }[];
  topTimeOnSite: { identifier: string; totalSeconds: number; sessions: number }[];
  conversionsOverTime: { date: string; count: number }[];
};

const ADMIN_SECRET_KEY = "admin_secret";

export function AdminPage() {
  const [secret, setSecret] = useState("");
  const [inputSecret, setInputSecret] = useState("");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_SECRET_KEY);
    if (saved) setSecret(saved);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputSecret.trim();
    if (!value) return;
    sessionStorage.setItem(ADMIN_SECRET_KEY, value);
    setSecret(value);
    setInputSecret("");
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SECRET_KEY);
    setSecret("");
    setStats(null);
  };

  const fetchStats = async () => {
    if (!secret) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<AdminStats>("/api/admin/stats", {
        headers: { "x-admin-secret": secret },
      });
      setStats(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.error || err?.message || "Lỗi tải thống kê"
      );
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (secret) fetchStats();
  }, [secret]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s ? `${m}m ${s}s` : `${m}m`;
  };

  if (!secret) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Admin
            </CardTitle>
            <CardDescription>Nhập mã bí mật để xem thống kê</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="secret">Mã bí mật</Label>
                <Input
                  id="secret"
                  type="password"
                  value={inputSecret}
                  onChange={(e) => setInputSecret(e.target.value)}
                  placeholder="ADMIN_SECRET"
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full">
                Đăng nhập
              </Button>
            </form>
            <Link
              to="/"
              className="mt-4 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Về trang chủ
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-stone-500 hover:text-stone-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-semibold text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Thống kê Admin
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Thoát
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2">
            {error}
          </div>
        )}

        {loading && <p className="text-stone-500">Đang tải...</p>}

        {stats && !loading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Lượt chuyển đổi</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Link2 className="h-6 w-6 text-emerald-600" />
                    {stats.totalConversions}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Lượt click link</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <MousePointer className="h-6 w-6 text-orange-600" />
                    {stats.totalClicks}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ai chuyển đổi nhiều nhất</CardTitle>
                  <CardDescription>
                    Top 30: theo subId (nếu có) hoặc theo IP
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.conversionsByUser.length === 0 ? (
                    <p className="text-stone-500 text-sm">Chưa có dữ liệu</p>
                  ) : (
                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                      {stats.conversionsByUser.map((row) => (
                        <li
                          key={row.identifier}
                          className="flex justify-between items-center py-1.5 border-b border-stone-100 last:border-0 text-sm"
                        >
                          <span
                            className="font-mono truncate max-w-[220px]"
                            title={row.identifier}
                          >
                            {row.identifier}
                          </span>
                          <span className="font-medium text-emerald-600">
                            {row.count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ai click link nhiều nhất</CardTitle>
                  <CardDescription>
                    Top 30: theo subId (nếu có) hoặc theo IP
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.clicksByUser.length === 0 ? (
                    <p className="text-stone-500 text-sm">Chưa có dữ liệu</p>
                  ) : (
                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                      {stats.clicksByUser.map((row) => (
                        <li
                          key={row.identifier}
                          className="flex justify-between items-center py-1.5 border-b border-stone-100 last:border-0 text-sm"
                        >
                          <span
                            className="font-mono truncate max-w-[220px]"
                            title={row.identifier}
                          >
                            {row.identifier}
                          </span>
                          <span className="font-medium text-orange-600">
                            {row.count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Ai thời gian dùng web nhiều nhất
                </CardTitle>
                <CardDescription>
                  Top 30: theo subId (nếu có), không có subId ghi ip:anonymous
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.topTimeOnSite.length === 0 ? (
                  <p className="text-stone-500 text-sm">Chưa có dữ liệu</p>
                ) : (
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {stats.topTimeOnSite.map((row) => (
                      <li
                        key={row.identifier}
                        className="flex justify-between items-center py-1.5 border-b border-stone-100 last:border-0 text-sm"
                      >
                        <span
                          className="font-mono truncate max-w-[220px]"
                          title={row.identifier}
                        >
                          {row.identifier}
                        </span>
                        <span className="text-stone-600">
                          {formatDuration(row.totalSeconds)} ({row.sessions}{" "}
                          phiên)
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chuyển đổi theo ngày (30 ngày gần nhất)</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.conversionsOverTime.length === 0 ? (
                  <p className="text-stone-500 text-sm">Chưa có dữ liệu</p>
                ) : (
                  <ul className="space-y-1.5 max-h-80 overflow-y-auto">
                    {stats.conversionsOverTime.map((row) => (
                      <li
                        key={row.date}
                        className="flex justify-between items-center py-1 text-sm"
                      >
                        <span>{row.date}</span>
                        <span className="font-medium">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
