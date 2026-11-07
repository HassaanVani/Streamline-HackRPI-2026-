import { useId } from "react";

/** Original code-drawn artwork; decorative clouds are not meteorological data. */
export function CloudBank({ className = "" }: { className?: string }) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      className={`cloud-bank ${className}`}
      viewBox="0 0 1200 300"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fffef8" />
          <stop offset="1" stopColor="#e1edf6" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M-70 300V220C-60 150 16 136 66 166C58 98 136 66 181 119C197 36 319 25 352 110C394 58 467 82 476 147C523 103 600 119 614 176C655 121 730 118 761 170C763 87 857 56 910 114C936 22 1063 34 1076 130C1133 91 1201 129 1209 189C1262 137 1320 177 1320 244V300Z"
      />
      <path
        fill="#fffdf8"
        opacity=".65"
        d="M0 300v-50c40-80 132-65 166-25 24-66 105-78 155-22 37-61 120-59 152 1 44-44 107-26 123 25 50-58 115-57 157-14 34-61 116-51 140 10 42-51 115-44 143 14 76-37 131-15 164 23v38Z"
      />
    </svg>
  );
}

export function PaperPlane({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`paper-plane ${className}`}
      viewBox="0 0 600 390"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="plane-top"
          x1="422"
          y1="60"
          x2="157"
          y2="294"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fffef6" />
          <stop offset="1" stopColor="#d7e4ee" />
        </linearGradient>
        <linearGradient
          id="plane-fold"
          x1="390"
          y1="70"
          x2="237"
          y2="279"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#c8d9e8" />
          <stop offset="1" stopColor="#7997b4" />
        </linearGradient>
        <filter
          id="plane-shadow"
          x="0"
          y="0"
          width="600"
          height="390"
          filterUnits="userSpaceOnUse"
        >
          <feDropShadow
            dx="0"
            dy="25"
            stdDeviation="17"
            floodColor="#467596"
            floodOpacity=".2"
          />
        </filter>
      </defs>
      <g filter="url(#plane-shadow)">
        <path
          d="M58 167 532 41 226 321 206 223 58 167Z"
          fill="url(#plane-top)"
        />
        <path
          d="m206 223 326-182-292 226-14 54-20-98Z"
          fill="url(#plane-fold)"
        />
        <path d="m206 223 326-182-244 190-82-8Z" fill="#fdfcf6" />
        <path d="m226 321 14-54 48-36-62 90Z" fill="#416281" />
        <path
          d="m58 167 148 56L532 41 58 167Z"
          stroke="#fff"
          strokeOpacity=".75"
        />
        <path d="m117 181 25 10L391 96 117 181Z" fill="#ed794e" />
        <path d="m240 267 48-36 244-190" stroke="#90abc3" strokeOpacity=".7" />
      </g>
    </svg>
  );
}

export default function SkyScene() {
  return (
    <div className="sky-art" aria-hidden="true">
      <div className="sun-halo" />
      <div className="sky-orbit orbit-one" />
      <div className="sky-orbit orbit-two" />
      <svg className="flight-doodle" viewBox="0 0 700 450">
        <path
          d="M-10 360C120 251 225 412 307 337S210 184 151 254 319 398 457 212"
          fill="none"
          stroke="#537d9c"
          strokeWidth="1.4"
          strokeDasharray="5 8"
          opacity=".55"
        />
      </svg>
      <CloudBank className="cloud-distant" />
      <PaperPlane />
      <CloudBank className="cloud-near" />
      <span className="art-note note-one">
        A LITTLE WIND.
        <br />A DIFFERENT WAY.
      </span>
      <span className="art-coordinate">40°38′ N → 51°28′ N</span>
      <span className="sky-spark spark-one">✦</span>
      <span className="sky-spark spark-two">+</span>
    </div>
  );
}
