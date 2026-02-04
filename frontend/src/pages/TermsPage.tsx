import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

export const TermsPage = () => {
  return (
    <div className="min-h-screen bg-stone-50/80 text-stone-900 antialiased">
      <AppHeader subId="" onSubIdChange={() => {}} />

      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-stone-900">
          Điều khoản sử dụng
        </h1>
        <p className="mt-3 text-sm text-stone-600">
          Khi sử dụng công cụ tạo link affiliate này, bạn đồng ý tuân thủ các
          điều khoản sau.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-stone-600">
          <li>Không sử dụng hệ thống cho các mục đích vi phạm pháp luật.</li>
          <li>
            Bạn tự chịu trách nhiệm với nội dung, traffic và chiến dịch quảng
            cáo của mình.
          </li>
          <li>
            Chúng tôi có thể cập nhật điều khoản bất kỳ lúc nào để phù hợp với
            chính sách của đối tác và quy định hiện hành.
          </li>
        </ul>
        <p className="mt-4 text-sm text-stone-600">
          Việc tiếp tục sử dụng dịch vụ sau khi điều khoản được cập nhật đồng
          nghĩa với việc bạn chấp nhận các thay đổi đó.
        </p>
      </main>

      <AppFooter />
    </div>
  );
};
