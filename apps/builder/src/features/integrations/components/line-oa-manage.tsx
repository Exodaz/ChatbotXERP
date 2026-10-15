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
import { Switch } from "@chatbotx.io/ui/components/ui/switch"
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { verifyLineCredentialsAction } from "../actions/line-connect.action"

interface LineOaManageProps {
  defaultBaseUrl?: string
  workspaceId: string
}

export function LineOaManage({
  workspaceId,
  defaultBaseUrl = "http://localhost:3123",
}: LineOaManageProps) {
  const [channelId, setChannelId] = useState("")
  const [channelSecret, setChannelSecret] = useState("")
  const [channelAccessToken, setChannelAccessToken] = useState("")
  const [showSecret, setShowSecret] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [autoLiveCF, setAutoLiveCF] = useState(true)

  const [connectedBot, setConnectedBot] = useState<{
    displayName: string
    basicId: string
    pictureUrl?: string
  } | null>(null)

  const handleVerify = async () => {
    if (!channelAccessToken.trim()) {
      toast.error("กรุณาระบุ Channel Access Token")
      return
    }

    try {
      setIsVerifying(true)
      const res = await verifyLineCredentialsAction(workspaceId, {
        channelAccessToken: channelAccessToken.trim(),
      })

      if (res?.data?.success && res.data.botInfo) {
        setConnectedBot(res.data.botInfo)
        toast.success(
          `เชื่อมต่อ LINE OA สำเร็จ: ${res.data.botInfo.displayName} (@${res.data.botInfo.basicId})`,
        )
      } else {
        setConnectedBot(null)
        toast.error(
          res?.data?.error || "ไม่สามารถเชื่อมต่อ LINE OA ได้ กรุณาตรวจสอบ Token",
        )
      }
    } catch (err: unknown) {
      setConnectedBot(null)
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ")
    } finally {
      setIsVerifying(false)
    }
  }

  const webhookUrl = `${defaultBaseUrl}/api/webhooks/line?workspaceId=${workspaceId}`

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-xl tracking-tight">
            เชื่อมต่อ LINE Official Account (LINE OA)
          </h2>
          <span className="rounded bg-[#06C755] px-2 py-0.5 font-bold text-[10px] text-white">
            LINE Messaging API
          </span>
        </div>
        <p className="mt-0.5 text-muted-foreground text-xs">
          รับแชต, เปิดรับออเดอร์ CF อัตโนมัติใน LINE OA, และส่งใบสรุปยอดแบบ Flex Message
          พร้อมปุ่มชำระเงิน
        </p>
      </div>

      {/* 1. Credentials Setup Card */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#06C755]" />
              <CardTitle className="font-semibold text-base">
                ข้อมูลการเชื่อมต่อ (LINE Developers Credentials)
              </CardTitle>
            </div>
            {connectedBot && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-800 dark:bg-emerald-950/60">
                {connectedBot.pictureUrl && (
                  // biome-ignore lint/performance/noImgElement: dynamic external avatar
                  <img
                    alt={connectedBot.displayName}
                    className="h-5 w-5 rounded-full object-cover"
                    height={20}
                    src={connectedBot.pictureUrl}
                    width={20}
                  />
                )}
                <span className="font-semibold text-emerald-700 text-xs dark:text-emerald-300">
                  {connectedBot.displayName} (@{connectedBot.basicId})
                </span>
                <CheckCircle2 className="ml-1 h-4 w-4 text-emerald-500" />
              </div>
            )}
          </div>
          <CardDescription className="text-xs">
            นำค่า Channel ID, Channel Secret และ Channel Access Token จาก LINE
            Developers Console มากรอกที่นี่
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Channel ID</Label>
              <Input
                className="font-mono text-xs"
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="เช่น 2006123456"
                value={channelId}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Channel Secret</Label>
              <div className="relative">
                <Input
                  className="pr-10 font-mono text-xs"
                  onChange={(e) => setChannelSecret(e.target.value)}
                  placeholder="32 ตัวอักษร เช่น a1b2c3d4..."
                  type={showSecret ? "text" : "password"}
                  value={channelSecret}
                />
                <button
                  className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowSecret(!showSecret)}
                  type="button"
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Channel Access Token (Long-lived)</Label>
            <div className="relative">
              <Input
                className="pr-10 font-mono text-xs"
                onChange={(e) => setChannelAccessToken(e.target.value)}
                placeholder="Token ยาวจากแท็บ Messaging API ใน LINE Developers"
                type={showToken ? "text" : "password"}
                value={channelAccessToken}
              />
              <button
                className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground"
                onClick={() => setShowToken(!showToken)}
                type="button"
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Omnichannel Live CF Toggle */}
          <div className="mt-2 flex items-center justify-between rounded-lg border bg-muted/30 p-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <Sparkles className="h-4 w-4 text-[#06C755]" />
                เปิดรับออเดอร์ CF ผ่านแชต LINE OA อัตโนมัติ (Omnichannel Live CF)
              </div>
              <p className="text-[11px] text-muted-foreground">
                เมื่อลูกค้าพิมพ์ "CF รหัสสินค้า [จำนวน]"
                ระบบจะจองสต็อกและตอบกลับด้วยใบสรุปยอด Flex Message ทันที
              </p>
            </div>
            <Switch checked={autoLiveCF} onCheckedChange={setAutoLiveCF} />
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t bg-muted/20 pt-4">
          <a
            className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
            href="https://developers.line.biz/console/"
            rel="noreferrer"
            target="_blank"
          >
            เปิด LINE Developers Console
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <Button
            className="bg-[#06C755] text-white text-xs shadow hover:bg-[#05b34c]"
            disabled={isVerifying || !channelAccessToken.trim()}
            onClick={handleVerify}
          >
            <ShieldCheck className="mr-1.5 h-4 w-4" />
            {isVerifying
              ? "กำลังตรวจสอบ..."
              : "ทดสอบและเชื่อมต่อ (Verify & Connect)"}
          </Button>
        </CardFooter>
      </Card>

      {/* 2. Webhook Setup Instructions Card */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-semibold text-base">
            <Zap className="h-5 w-5 text-amber-500" />
            การตั้งค่า Webhook ใน LINE Developers
          </CardTitle>
          <CardDescription className="text-xs">
            นำ URL ด้านล่างไปกรอกที่ <b>Messaging API → Webhook settings</b> ใน LINE
            Developers Console
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              className="bg-muted font-mono text-muted-foreground text-xs"
              readOnly
              value={webhookUrl}
            />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl)
                toast.success("คัดลอก Webhook URL เรียบร้อยแล้ว")
              }}
              size="sm"
              variant="outline"
            >
              <Copy className="mr-1.5 h-4 w-4" />
              คัดลอก URL
            </Button>
          </div>

          <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3 text-muted-foreground text-xs">
            <p className="font-semibold text-foreground">
              ขั้นตอนการเปิดใช้งาน Webhook บน LINE:
            </p>
            <ol className="list-inside list-decimal space-y-1 pl-1">
              <li>
                ไปที่แท็บ <b>Messaging API</b> ใน LINE Developers Console
              </li>
              <li>
                วาง Webhook URL ด้านบนในช่อง <b>Webhook URL</b> แล้วกด{" "}
                <b>Update</b>
              </li>
              <li>
                เปิดสวิตช์ <b>Use webhook</b> ให้เป็นสีเขียว (ON)
              </li>
              <li>
                ในหน้า <b>LINE Official Account Manager</b> ไปที่{" "}
                <i>การตั้งค่าการตอบกลับ (Response settings)</i> แล้วเลือก{" "}
                <b>ตอบกลับด้วย Webhook (Webhook ON)</b> และปิดข้อความตอบกลับอัตโนมัติ
                (Auto-response messages OFF)
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* 3. Flex Message Live Preview Card */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-semibold text-base">
            <Smartphone className="h-5 w-5 text-primary" />
            ตัวอย่างใบสรุปยอด Flex Message ที่ลูกค้าได้รับใน LINE
          </CardTitle>
          <CardDescription className="text-xs">
            เมื่อลูกค้าพิมพ์ CF เช่น <code>CF A01 1</code> ในแชต LINE OA
            บอทจะตอบกลับด้วยการ์ดใบสรุปยอดนี้ทันที
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center rounded-lg bg-neutral-100 py-4 dark:bg-neutral-900">
          {/* Flex Bubble Mockup */}
          <div className="w-[300px] overflow-hidden rounded-2xl border bg-white text-black text-xs shadow-md">
            <div className="border-b bg-neutral-50 p-4">
              <span className="block font-bold text-[11px] text-emerald-600">
                🎉 จองสินค้าสำเร็จ (CF CONFIRMED)
              </span>
              <span className="font-black text-sm">
                ใบสั่งซื้อ #ORD-20261015-XYZ1
              </span>
            </div>
            <div className="space-y-2.5 p-4">
              <span className="block text-[10px] text-gray-500">
                รายการสินค้าในตะกร้าของคุณ:
              </span>
              <div className="flex items-center justify-between text-xs">
                <span>กระเป๋าหนัง Classic x1</span>
                <span className="font-bold">฿1,290</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>รองเท้าแตะสีดำ x1</span>
                <span className="font-bold">฿590</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2 font-bold text-sm">
                <span>ยอดรวมทั้งสิ้น</span>
                <span className="font-black text-base text-emerald-600">
                  ฿1,880
                </span>
              </div>
              <div className="rounded border border-amber-200 bg-amber-50 p-2 text-[10px] text-amber-800">
                ⏱️ ระบบล็อกสต็อกไว้ 24 ชั่วโมง กรุณาชำระเงินก่อนหลุดจองนะคะ
              </div>
            </div>
            <div className="border-t bg-neutral-50 p-3">
              <button
                className="block w-full rounded-lg bg-[#06C755] py-2 text-center font-bold text-white text-xs shadow hover:bg-[#05b34c]"
                type="button"
              >
                💳 กดชำระเงินและแจ้งที่อยู่
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
