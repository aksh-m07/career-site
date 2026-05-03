export function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  const dash = (score / 100) * c
  const cx = size / 2
  const cy = size / 2
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,.07)" strokeWidth="3"/>
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke="var(--accent)" strokeWidth="3"
          strokeDasharray={`${dash} ${c}`}
          strokeDashoffset={c / 4}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray .8s cubic-bezier(.2,.7,.2,1)" }}
        />
      </svg>
      <div className="score-num" style={{ fontSize: size > 48 ? 15 : 13 }}>{score}</div>
    </div>
  )
}
