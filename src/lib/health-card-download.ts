export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatWalletPatientCode(rawId: string): string {
  const alnum = rawId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (alnum.length >= 6) return alnum.slice(0, 6);
  const seed = (alnum + "MEDBRIDG").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return (seed + "XXXXXX").slice(0, 6);
}

export function computeTrustScore(input: {
  conditions: string[];
  allergies: string[];
  hasDateOfBirth: boolean;
}): number {
  const realConditions = input.conditions.filter((c) => c.toLowerCase() !== "no conditions on file");
  const base = 48;
  const fromClinical = Math.min(35, realConditions.length * 5 + input.allergies.length * 4);
  const profileBonus = input.hasDateOfBirth ? 7 : 0;
  return Math.min(100, base + fromClinical + profileBonus);
}

export type HealthCardWalletPayload = {
  displayName: string;
  email: string;
  patientId: string;
  trustScore: number;
  status: "verified" | "pending";
  issuedLabel: string;
  bloodType: string;
  ageLabel: string;
  conditionsLine: string;
};

export function buildHealthCardHtml(p: HealthCardWalletPayload): string {
  const name = escapeHtml(p.displayName);
  const email = escapeHtml(p.email);
  const digitalId = escapeHtml(`MB - P - ${formatWalletPatientCode(p.patientId)}`);
  const footer = escapeHtml(`MedBridge • Issued ${p.issuedLabel} • medbridge.app`);
  const meta = escapeHtml(`${p.bloodType} · ${p.ageLabel} · ${p.conditionsLine}`);
  const trust = Math.max(0, Math.min(100, p.trustScore));
  const statusLabel = p.status === "verified" ? "Verified" : "Pending";
  const statusColor = p.status === "verified" ? "#c26a2a" : "#d4a017";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MedBridge Health Card — ${name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=EB+Garamond:ital,wght@0,600;1,600&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: linear-gradient(165deg, #2c2420 0%, #1a1614 50%, #0f0d0c 100%);
      font-family: Manrope, system-ui, sans-serif;
      color: #faf7f2;
    }
    .card {
      position: relative;
      width: 100%;
      max-width: 640px;
      aspect-ratio: 1.6 / 1;
      border-radius: 28px;
      overflow: hidden;
      background: linear-gradient(135deg, #c26a2a 0%, #8b4518 42%, #5c3318 100%);
      box-shadow:
        0 25px 50px -12px rgba(0,0,0,0.45),
        0 0 0 1px rgba(255,255,255,0.12) inset;
    }
    .blob1 {
      position: absolute;
      top: -96px;
      right: -96px;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: rgba(252, 236, 220, 0.12);
      filter: blur(48px);
    }
    .blob2 {
      position: absolute;
      bottom: -80px;
      left: -80px;
      width: 240px;
      height: 240px;
      border-radius: 50%;
      background: rgba(255, 200, 160, 0.1);
      filter: blur(40px);
    }
    .inner {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 32px 36px 40px;
    }
    @media (min-width: 640px) {
      .inner { padding: 40px 44px 44px; }
    }
    .row-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .chip {
      width: 48px;
      height: 40px;
      border-radius: 8px;
      background: linear-gradient(145deg, #f4d03f 0%, #d4a017 100%);
      border: 1px solid rgba(255,255,255,0.35);
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      padding: 6px;
      margin-bottom: 12px;
    }
    .chip line {
      display: block;
      height: 1px;
      background: rgba(0,0,0,0.18);
      border-radius: 1px;
    }
    .pill {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      background: rgba(255,255,255,0.18);
      border: 1px solid rgba(255,255,255,0.2);
    }
    .brand h2 {
      margin: 0;
      font-family: "EB Garamond", Georgia, serif;
      font-size: 1.35rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    .brand p {
      margin: 4px 0 0;
      font-size: 10px;
      opacity: 0.75;
    }
    .brand { text-align: right; }
    .identity h1 {
      margin: 0 0 6px;
      font-size: clamp(1.75rem, 4vw, 2.35rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.1;
    }
    .identity .email {
      margin: 0 0 22px;
      font-size: 0.9rem;
      opacity: 0.85;
    }
    .rule {
      height: 1px;
      background: rgba(255,255,255,0.22);
      margin-bottom: 20px;
    }
    .did-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      opacity: 0.65;
      margin-bottom: 6px;
    }
    .did-value {
      font-family: ui-monospace, "Cascadia Code", monospace;
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: 0.08em;
    }
    .meta {
      margin-top: 14px;
      font-size: 11px;
      opacity: 0.78;
      line-height: 1.45;
      max-width: 90%;
    }
    .row-bottom {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
    }
    .bar-wrap {
      width: 180px;
      max-width: 48vw;
    }
    .bar {
      height: 8px;
      border-radius: 999px;
      background: rgba(255,255,255,0.2);
      overflow: hidden;
      margin-bottom: 8px;
    }
    .bar-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(255,255,255,0.55), rgba(252,236,220,0.95));
      width: ${trust}%;
    }
    .trust-label {
      font-size: 12px;
      opacity: 0.88;
    }
    .status {
      text-align: right;
    }
    .dots {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      margin-bottom: 6px;
    }
    .dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: ${statusColor};
      opacity: 0.95;
    }
    .status-text {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: ${statusColor};
      letter-spacing: 0.06em;
    }
    .issued {
      font-size: 10px;
      opacity: 0.62;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-top: 6px;
    }
    .micro {
      position: absolute;
      bottom: 14px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 9px;
      opacity: 0.42;
      font-weight: 400;
      letter-spacing: 0.04em;
      padding: 0 24px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="blob1"></div>
    <div class="blob2"></div>
    <div class="inner">
      <div class="row-top">
        <div>
          <div class="chip" aria-hidden="true">
            <line></line><line></line><line></line>
          </div>
          <span class="pill">Patient</span>
        </div>
        <div class="brand">
          <h2>MedBridge</h2>
          <p>AI Healthcare Platform</p>
        </div>
      </div>
      <div class="identity">
        <h1>${name}</h1>
        <p class="email">${email}</p>
        <div class="rule"></div>
        <div class="did-label">Digital ID</div>
        <div class="did-value">${digitalId}</div>
        <p class="meta">${escapeHtml(meta)}</p>
      </div>
      <div class="row-bottom">
        <div class="bar-wrap">
          <div class="bar"><div class="bar-fill"></div></div>
          <p class="trust-label">Profile completeness · ${trust}</p>
        </div>
        <div class="status">
          <div class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
          <div class="status-text">${statusLabel}</div>
          <p class="issued">Issued: ${escapeHtml(p.issuedLabel)}</p>
        </div>
      </div>
      <p class="micro">${footer}</p>
    </div>
  </div>
</body>
</html>`;
}
