"use client"

import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@chatbotx.io/ui/components/ui/card"
import { Input } from "@chatbotx.io/ui/components/ui/input"
import { Label } from "@chatbotx.io/ui/components/ui/label"
import {
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
  importStockroomCatalogAction,
  pingStockroomAction,
  syncStockroomStockAction,
} from "../actions/stockroom-sync.action"

interface EcommerceSettingsViewProps {
  defaultBaseUrl?: string
  workspaceId: string
}

export function EcommerceSettingsView({
  workspaceId,
  defaultBaseUrl = "http://localhost:3123",
}: EcommerceSettingsViewProps) {
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [category, setCategory] = useState("")
  const [overbookingAllowance, setOverbookingAllowance] = useState("0")

  // Status states
  const [isTesting, setIsTesting] = useState(false)
  const [keyInfo, setKeyInfo] = useState<{
    name: string
    prefix: string
  } | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncSummary, setSyncSummary] = useState<{
    totalFetched: number
    updatedVariants: number
    notFoundSkus: string[]
  } | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      toast.error("กรุณาระบุ API Key ของ Stockroom (ขึ้นต้นด้วย sk_)")
      return
    }

    try {
      setIsTesting(true)
      const res = await pingStockroomAction(workspaceId, {
        apiKey: apiKey.trim(),
      })
      if (res?.data?.ok && res.data.key) {
        setKeyInfo(res.data.key)
        toast.success(`เชื่อมต่อ Stockroom สำเร็จ! (Key: ${res.data.key.name})`)
      } else {
        setKeyInfo(null)
        toast.error(res?.data?.error || "API Key ไม่ถูกต้อง หรือถูกเพิกถอนแล้ว")
      }
    } catch (err: unknown) {
      setKeyInfo(null)
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ")
    } finally {
      setIsTesting(false)
    }
  }

  const handleSyncStock = async () => {
    if (!apiKey.trim()) {
      toast.error("กรุณาระบุ API Key ก่อนซิงก์สต็อก")
      return
    }

    try {
      setIsSyncing(true)
      const res = await syncStockroomStockAction(workspaceId, {
        apiKey: apiKey.trim(),
        category: category.trim() || undefined,
        overbookingAllowance: Number.parseInt(overbookingAllowance, 10) || 0,
      })

      if (res?.data?.success) {
        setSyncSummary(res.data)
        toast.success(
          `ซิงก์สต็อกสำเร็จ! อัปเดต ${res.data.updatedVariants} SKU จากทั้งหมด ${res.data.totalFetched} SKU`,
        )
      } else {
        toast.error(res?.data?.error || "ไม่สามารถซิงก์สต็อกได้")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการซิงก์")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleImportCatalog = async () => {
    if (!apiKey.trim()) {
      toast.error("กรุณาระบุ API Key ก่อนนำเข้าสินค้า")
      return
    }

    try {
      setIsImporting(true)
      const res = await importStockroomCatalogAction(workspaceId, {
        apiKey: apiKey.trim(),
        category: category.trim() || undefined,
      })

      if (res?.data?.success) {
        toast.success(
          `นำเข้าสินค้าสำเร็จ! เพิ่ม ${res.data.productsImported} สินค้า (${res.data.variantsImported} SKUs)`,
        )
      } else {
        toast.error(res?.data?.error || "ไม่สามารถนำเข้าแคตตาล็อกได้")
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการนำเข้าสินค้า",
      )
    } finally {
      setIsImporting(false)
    }
  }

  const webhookUrl = `${defaultBaseUrl}/api/stock/sync?workspaceId=${workspaceId}`

  return (
    <div className="max-w-4xl space-y-6">
      {/* 1. Header */}
      <div>
        <h2 className="font-bold text-xl tracking-tight">
          ตั้งค่าสต็อกและการเชื่อมต่อ (Stockroom & ERP)
        </h2>
        <p className="mt-0.5 text-muted-foreground text-xs">
          เชื่อมโยงระบบสต็อกภายนอก (Stockroom / LoveGood)
          เพื่ออัปเดตจำนวนสินค้าพร้อมขายและยอดของรอ QC แบบเรียลไทม์
        </p>
      </div>

      {/* 2. Stockroom API Configuration Card */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <CardTitle className="font-semibold text-base">
                Stockroom Integration API (LoveGood)
              </CardTitle>
            </div>
            {keyInfo && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 text-xs dark:border-emerald-800 dark:bg-emerald-950/60">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                เชื่อมต่อแล้ว ({keyInfo.name})
              </span>
            )}
          </div>
          <CardDescription className="text-xs">
            ระบุ API Key จากระบบ Stockroom (ไปที่ Settings → API Key
            ในระบบสต็อกภายนอก)
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Base Endpoint</Label>
            <div className="flex items-center gap-2">
              <Input
                className="bg-muted font-mono text-muted-foreground text-xs"
                readOnly
                value="https://stockinventory.exodazth.workers.dev/api/v1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Stockroom API Key (ขึ้นต้นด้วย sk_)</Label>
            <div className="relative">
              <Input
                className="pr-10 font-mono text-xs"
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                type={showKey ? "text" : "password"}
                value={apiKey}
              />
              <button
                className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground"
                onClick={() => setShowKey(!showKey)}
                type="button"
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">
                กรองเฉพาะหมวดหมู่ (Category Filter - ไม่บังคับ)
              </Label>
              <Input
                className="text-xs"
                onChange={(e) => setCategory(e.target.value)}
                placeholder="เช่น Bags, Shoes, Belts"
                value={category}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                โควตา Overbooking ส่วนเสริม (Cap Allowance)
              </Label>
              <Input
                className="text-xs"
                onChange={(e) => setOverbookingAllowance(e.target.value)}
                placeholder="0"
                type="number"
                value={overbookingAllowance}
              />
              <p className="text-[10px] text-muted-foreground">
                อนุญาตให้จองเกินสต็อก Ready + QC ได้กี่ชิ้น (Backorder buffer)
              </p>
            </div>
          </div>

          {/* Sync Result Summary */}
          {syncSummary && (
            <div className="space-y-1 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs dark:bg-emerald-950/30">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                ผลการซิงก์สต็อกล่าสุด
              </div>
              <p className="text-emerald-700 dark:text-emerald-400">
                ดึงข้อมูลทั้งหมด {syncSummary.totalFetched} SKU | อัปเดตในระบบ{" "}
                {syncSummary.updatedVariants} รายการ
              </p>
              {syncSummary.notFoundSkus.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  (มี {syncSummary.notFoundSkus.length} SKU ในสต็อกที่ยังไม่มีใน
                  ChatbotX — แนะนำให้กด นำเข้าสินค้า)
                </p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 pt-4">
          <Button
            className="text-xs"
            disabled={isTesting || !apiKey.trim()}
            onClick={handleTestConnection}
            size="sm"
            variant="outline"
          >
            <ShieldCheck className="mr-1.5 h-4 w-4 text-primary" />
            {isTesting ? "กำลังตรวจสอบ..." : "ทดสอบการเชื่อมต่อ (Ping)"}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              className="text-xs"
              disabled={isImporting || !apiKey.trim()}
              onClick={handleImportCatalog}
              size="sm"
              variant="outline"
            >
              <Download className="mr-1.5 h-4 w-4" />
              {isImporting ? "กำลังนำเข้า..." : "นำเข้าสินค้าทั้งหมด (Import)"}
            </Button>

            <Button
              className="bg-primary text-xs shadow"
              disabled={isSyncing || !apiKey.trim()}
              onClick={handleSyncStock}
              size="sm"
            >
              <RefreshCw
                className={`mr-1.5 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
              />
              {isSyncing ? "กำลังซิงก์สต็อก..." : "ซิงก์สต็อกทันที (Sync Now)"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* 3. Automatic Cron / Webhook URL Card */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="font-semibold text-base">
              Webhook & Cron Endpoint สำหรับตั้งเวลาซิงก์อัตโนมัติ
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            ใช้ URL นี้ตั้งในระบบ Cron (เช่น Cloudflare Worker, GitHub Actions, หรือ
            EasyCron) เพื่อซิงก์ทุกๆ 5–15 นาที
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              className="bg-muted font-mono text-muted-foreground text-xs"
              readOnly
              value={webhookUrl}
            />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl)
                toast.success("คัดลอก URL เรียบร้อยแล้ว")
              }}
              size="sm"
              variant="outline"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
