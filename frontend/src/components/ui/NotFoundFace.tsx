export default function NotFoundFace() {
  return (
    <div className="nf-face-container">
      <svg className="nf-face-svg" viewBox="0 0 320 380" role="img" aria-label="Lost face">
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={25}
        >
          <g className="nf-face__eyes" transform="translate(0,112.5)">
            <g transform="translate(15,0)">
              <polyline className="nf-face__eye-lid" points="37,0 0,120 75,120" />
              <polyline className="nf-face__pupil" points="55,120 55,155" strokeDasharray="35 35" />
            </g>
            <g transform="translate(230,0)">
              <polyline className="nf-face__eye-lid" points="37,0 0,120 75,120" />
              <polyline className="nf-face__pupil" points="55,120 55,155" strokeDasharray="35 35" />
            </g>
          </g>
          <rect className="nf-face__nose" x="132.5" y="112.5" width={55} height={155} rx={4} ry={4} />
          <g transform="translate(65,334)" strokeDasharray="102 102">
            <path className="nf-face__mouth-left" d="M 0 30 C 0 30 40 0 95 0" />
            <path className="nf-face__mouth-right" d="M 95 0 C 150 0 190 30 190 30" />
          </g>
        </g>
      </svg>
    </div>
  );
}
