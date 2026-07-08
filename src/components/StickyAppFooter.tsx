const ATTRIBUTION =
  'จัดทำโดย ฝ่ายการพยาบาล โรงพยาบาลสมเด็จพระบรมราชเทวี ณ ศรีราชา สภากาชาดไทย'

export function StickyAppFooter() {
  return (
    <footer
      role="contentinfo"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-teal-100 bg-teal-50/95 px-4 py-2.5 backdrop-blur-sm"
    >
      <p className="mx-auto max-w-6xl text-center text-xs leading-relaxed text-slate-600 sm:text-left">
        {ATTRIBUTION}
      </p>
    </footer>
  )
}
