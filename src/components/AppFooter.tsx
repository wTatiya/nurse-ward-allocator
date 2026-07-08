const ATTRIBUTION =
  'จัดทำโดย ฝ่ายการพยาบาล โรงพยาบาลสมเด็จพระบรมราชเทวี ณ ศรีราชา สภากาชาดไทย'

export function AppFooter() {
  return (
    <footer role="contentinfo" className="px-4 py-6">
      <p className="text-center text-xs text-slate-500">{ATTRIBUTION}</p>
    </footer>
  )
}
