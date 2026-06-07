import { Building2, CheckCircle2 } from 'lucide-react';

const PROOF_POINTS = [
  '500+ brokers trust PropAgent',
  'Live in Mumbai, Dubai & Toronto',
  'AI replies in under 30 seconds',
];

export function AuthBrandPanel() {
  return (
    <div className="hidden flex-col justify-between bg-sidebar p-12 text-white lg:flex lg:w-[40%]">
      <div>
        <div className="flex items-center gap-3">
          <Building2 className="h-10 w-10 text-primary" />
          <span className="text-2xl font-bold">PropAgent</span>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <p className="text-3xl font-bold leading-tight">
          Never miss a lead.
          <br />
          Never lose a deal.
        </p>
        <ul className="flex flex-col gap-4">
          {PROOF_POINTS.map((point) => (
            <li key={point} className="flex items-center gap-3 text-sm text-white/80">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-white/40">© {new Date().getFullYear()} PropAgent</p>
    </div>
  );
}
