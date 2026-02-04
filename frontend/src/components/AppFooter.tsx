export function AppFooter() {
  return (
    <footer className="relative z-10 border-t border-stone-200 bg-white/50 py-8">
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-stone-500">
        <p>Mua sắm hoàn tiền — Shopee & Lazada & TikTok Shop</p>
        <div className="mt-2 flex justify-center gap-4">
          <a href="/privacy" className="hover:text-stone-700 hover:underline">
            Chính sách bảo mật
          </a>
          <a href="/terms" className="hover:text-stone-700 hover:underline">
            Điều khoản sử dụng
          </a>
          <a href="/contact" className="hover:text-stone-700 hover:underline">
            Liên hệ
          </a>
        </div>
      </div>
    </footer>
  );
}
