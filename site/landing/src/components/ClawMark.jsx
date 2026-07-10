/**
 * clawREFORM mark — stylised C-shaped claw icon.
 * Uses currentColor so it inherits the parent's text colour,
 * making dark / light theming automatic.
 */
export default function ClawMark({ className = '', style = {} }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* Gradient for subtle metallic depth */}
      <defs>
        <linearGradient id="claw-grad" x1="80" y1="80" x2="440" y2="440" gradientUnits="userSpaceOnUse">
          <stop offset="0%" className="claw-grad-start" />
          <stop offset="100%" className="claw-grad-end" />
        </linearGradient>
      </defs>
      {/* C-shaped claw mark — outer arc R=200, inner arc r=130, 80° gap facing right */}
      <path
        d="M433 127 A200 200 0 1 1 433 385 L380 340 A130 130 0 1 0 380 172Z"
        fill="url(#claw-grad)"
      />
    </svg>
  )
}
