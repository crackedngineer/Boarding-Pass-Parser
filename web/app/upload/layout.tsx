import { Sidebar } from '@/components/sidebar'

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 bg-dot-grid opacity-20 pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[260px] rounded-full bg-amber-500/4 blur-[90px] pointer-events-none z-0" />
      <Sidebar />
      <main className="relative z-10 min-h-screen md:pl-56 pt-14 md:pt-0">
        {children}
      </main>
    </>
  )
}
