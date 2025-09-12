import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CNFLIXLogo } from "@/components/cnflix-logo"

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <CNFLIXLogo size="md" />
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/rules">使用说明</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
