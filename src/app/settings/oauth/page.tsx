import styles from "./oauth.module.css";

export default function OAuthConfigPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  const missingClientId = clientId.trim().length === 0;
  const missingClientSecret = clientSecret.trim().length === 0;
  const hasConfig = !missingClientId && !missingClientSecret;

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Google OAuth Configuration</h1>
        <div className={styles.statusRow}>
          <div className={styles.statusLabel}>Status</div>
          <div
            className={styles.statusDot}
            style={{ background: hasConfig ? "#16a34a" : "#ef4444" }}
            title={hasConfig ? "Configured" : "Missing required env vars"}
          />
        </div>
      </div>

      <div className={styles.form}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Client ID</label>
          <input
            className={styles.input}
            value={clientId}
            readOnly
            placeholder="Set NEXT_PUBLIC_GOOGLE_CLIENT_ID"
          />
          {missingClientId && (
            <div className={styles.error}>
              Missing `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in your environment.
            </div>
          )}
        </div>

        <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
          <label className={styles.label}>Client Secret</label>
          <div className={styles.input}>
            {missingClientSecret
              ? "Missing GOOGLE_CLIENT_SECRET in server environment."
              : "Server environment variable detected (hidden)."}
          </div>
          {missingClientSecret && (
            <div className={styles.error}>
              Add `GOOGLE_CLIENT_SECRET` to your `.env.local` (or deployment secret store).
            </div>
          )}
        </div>
      </div>

      {!hasConfig && (
        <div
          className={styles.alert}
          style={{ background: "#fff1f2", borderColor: "#ef4444" }}
        >
          Google OAuth is not fully configured. Set required environment variables and restart
          the app.
        </div>
      )}

      {hasConfig && (
        <div
          className={styles.alert}
          style={{ background: "#ecfdf5", borderColor: "#10b981" }}
        >
          Google OAuth environment variables are configured safely.
        </div>
      )}
    </div>
  );
}
