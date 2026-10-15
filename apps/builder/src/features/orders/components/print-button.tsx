"use client"

import { Button } from "@chatbotx.io/ui/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <Button
      className="bg-primary text-primary-foreground shadow"
      onClick={() => window.print()}
      type="button"
    >
      <Printer className="mr-2 h-4 w-4" />
      สั่งพิมพ์ทันที (Print)
    </Button>
  )
}
