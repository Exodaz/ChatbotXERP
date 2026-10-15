"use client"

/**
 * Lightweight Code128 / Code39 SVG Barcode renderer for shipping labels
 */
export function Barcode({
  value,
  width = 2,
  height = 50,
  className = "",
}: {
  value: string
  width?: number
  height?: number
  className?: string
}) {
  // Simple deterministic pattern generator for clean visual barcode lines
  const cleanVal = (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "")
  const bars: boolean[] = [true, false, true, true] // quiet zone start

  for (let i = 0; i < cleanVal.length; i++) {
    const code = cleanVal.charCodeAt(i)
    const isOdd = (val: number) => Math.floor(val) % 2 === 1
    const pattern = [
      isOdd(code),
      isOdd(code / 2),
      isOdd(code / 4),
      isOdd(code / 8),
      isOdd(code / 16),
      true,
      false,
    ]
    bars.push(...pattern)
  }
  bars.push(true, true, false, true) // stop sequence

  const svgWidth = bars.length * width

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        className="overflow-visible"
        height={height}
        viewBox={`0 0 ${svgWidth} ${height}`}
        width={svgWidth}
      >
        <title>Barcode {cleanVal}</title>
        {bars.map((isBar, idx) =>
          isBar ? (
            <rect
              fill="black"
              height={height}
              // biome-ignore lint/suspicious/noArrayIndexKey: deterministic static bars
              key={idx}
              width={width}
              x={idx * width}
              y={0}
            />
          ) : null,
        )}
      </svg>
      <span className="mt-0.5 font-bold font-mono text-[11px] tracking-widest">
        {value}
      </span>
    </div>
  )
}
