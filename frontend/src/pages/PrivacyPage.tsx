import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

export const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-stone-50/80 text-stone-900 antialiased">
      <AppHeader subId="" onSubIdChange={() => {}} />

      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-stone-900">
          Chính sách bảo mật
        </h1>
        <p className="mt-3 text-sm text-stone-600">
          Chúng tôi tôn trọng quyền riêng tư của bạn và chỉ thu thập những dữ
          liệu cần thiết để vận hành hệ thống tạo link affiliate và thống kê
          lượt click.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-stone-600">
          <li>
            Thông tin lưu lại có thể gồm: link gốc, affiliate link, subId.
          </li>
          <li>
            Một số dữ liệu kỹ thuật như địa chỉ IP, trình duyệt được dùng để
            phân tích thống kê và chống gian lận.
          </li>
          <li>
            Chúng tôi không bán, cho thuê hay chia sẻ dữ liệu cá nhân cho bên
            thứ ba ngoài đối tác kỹ thuật phục vụ vận hành hệ thống.
          </li>
        </ul>
        <p className="mt-4 text-sm text-stone-600">
          Nếu bạn có câu hỏi về quyền riêng tư, vui lòng liên hệ qua trang{" "}
          <a href="/contact" className="text-emerald-600 hover:underline">
            Liên hệ
          </a>
          .
        </p>
      </main>

      <AppFooter />
    </div>
  );
};
