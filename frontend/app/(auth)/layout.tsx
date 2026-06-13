import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:flex">
      <AuthBrandPanel />
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-primary to-purple p-6 lg:bg-surface lg:p-12">
        <div className="w-full max-w-[480px] rounded-[20px] bg-surface p-7 shadow-lg lg:max-w-none lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
          {children}
        </div>
      </div>
    </div>
  );
}
