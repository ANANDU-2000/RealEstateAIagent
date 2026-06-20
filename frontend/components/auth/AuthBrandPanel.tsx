import { Building2, CheckCircle2 } from 'lucide-react';
import { APP_NAME } from '@/lib/brand';

const PROOF_POINTS = [
  'Brokers across India, UAE, and Canada',
  'Live in Mumbai, Dubai & Toronto',
  'AI replies in under 30 seconds',
];

export function AuthBrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0D1117] px-12 py-12 text-white after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_30%_50%,rgba(37,99,235,0.08)_0%,transparent_60%)] lg:flex lg:w-[42%]">
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-[22px] font-bold tracking-tight">{APP_NAME}</span>
        </div>
      </div>

      <div className="relative z-10 mt-auto mb-8 flex flex-col gap-8">
        <p className="text-[36px] font-bold leading-[1.15] tracking-tight text-white">
          Close every deal.
          <br />
          Before it goes cold.
        </p>
        <ul className="flex flex-col gap-3">
          {PROOF_POINTS.map((point) => (
            <li key={point} className="flex items-center gap-3 text-[13px] text-white/65">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 text-[11px] text-white/25">
        © {new Date().getFullYear()} {APP_NAME}
      </p>
    </div>
  );
}
