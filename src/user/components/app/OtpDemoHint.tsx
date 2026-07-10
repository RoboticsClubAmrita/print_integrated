/** Demo affordance: surfaces the active mock OTP code since there's no real email/SMS. */
export function OtpDemoHint({ code }: { code: string }) {
  return (
    <div className="mx-auto mt-1 inline-flex items-center gap-2 rounded-[14px] border border-dashed border-line px-3.5 py-2 text-[12.5px] font-semibold text-muted">
      <span className="size-1.5 rounded-full bg-success shrink-0" />
      Demo code: <span className="font-mono font-extrabold text-ink tracking-[2px]">{code}</span>
    </div>
  )
}
