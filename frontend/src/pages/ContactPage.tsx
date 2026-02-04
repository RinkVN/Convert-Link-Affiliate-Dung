import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

export const ContactPage = () => {
  return (
    <div className="min-h-screen bg-stone-50/80 text-stone-900 antialiased">
      <AppHeader subId="" onSubIdChange={() => {}} />

      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-stone-900">Liên hệ</h1>
        <p className="mt-3 text-sm text-stone-600">
          Nếu bạn có câu hỏi, góp ý hoặc cần hỗ trợ về việc sử dụng công cụ tạo
          link affiliate, hãy liên hệ với chúng tôi.
        </p>
        <div className="mt-4 space-y-2 text-sm text-stone-600">
          <p>
            Email:{" "}
            <a
              href="mailto:contact@shopbnh.vn"
              className="text-emerald-600 hover:underline"
            >
              contact@shopbnh.vn
            </a>
          </p>
          <p>
            Website:{" "}
            <a
              href="https://shopbnh.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              shopbnh.vn
            </a>
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
};
