"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo/Logo";
import styles from "./login.module.css";

type Props = {
  initialMode: "sign-in" | "setup" | "recovery" | "request-recovery" | "reset";
  error?: string;
  success?: string;
  from?: string;
  hasCredentials: boolean;
  token?: string;
};

export function AdminLoginForm({ initialMode, error, success, from, hasCredentials, token = "" }: Props) {
  const [mode, setMode] = useState(initialMode);
  const isSetup = mode === "setup";
  const isRecovery = mode === "recovery";
  const isRecoveryRequest = mode === "request-recovery";
  const isReset = mode === "reset";

  const toggleAccountFlow = () => {
    setMode((current) => {
      if (current === "request-recovery" || current === "reset") return "sign-in";
      if (!hasCredentials) return current === "setup" ? "sign-in" : "setup";
      return current === "recovery" ? "sign-in" : "recovery";
    });
  };

  return (
    <main className={styles.main}>
      <form
        className={styles.form}
        action={isSetup ? "/api/admin/setup" : isRecovery ? "/api/admin/recover" : isRecoveryRequest ? "/api/admin/recovery-request" : isReset ? "/api/admin/reset" : "/api/admin/login"}
        method="POST"
      >
        <button type="button" className={styles.logoButton} onClick={toggleAccountFlow} aria-label={isSetup ? "Return to sign in" : isRecovery ? "Return to sign in" : hasCredentials ? "Recover admin password" : "Set up admin password"}>
          <Logo variant="compact" />
        </button>
        <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>admin</p>
        <h1 className="heading-01">{isSetup ? "Set up password" : isRecovery ? "Recover password" : isRecoveryRequest ? "Recover admin access" : isReset ? "Reset admin access" : "Sign in"}</h1>
        {isSetup && <p className={styles.helper}>Create the first admin credentials for this site.</p>}
        {isRecovery && <p className={styles.helper}>Verify your current password, then choose a replacement.</p>}
        {isRecoveryRequest && <p className={styles.helper}>Enter your recovery email and I&apos;ll send a one-time reset link.</p>}
        {isReset && <p className={styles.helper}>Choose a new username and password for the admin panel.</p>}
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
        {!isSetup && !isRecoveryRequest && !isReset && <input type="hidden" name="from" value={from ?? "/admin"} />}

        {isRecoveryRequest && <label className={styles.field}><span className="label-small" style={{ color: "var(--text-secondary)" }}>Recovery email</span><input type="email" name="email" required autoComplete="email" className={styles.input} /></label>}

        {isReset && <input type="hidden" name="token" value={token} />}

        {!isRecoveryRequest && <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>Username</span>
          <input type="text" name="username" required autoComplete="username" className={styles.input} />
        </label>}

        {isRecovery && (
          <label className={styles.field}>
            <span className="label-small" style={{ color: "var(--text-secondary)" }}>Current password</span>
            <input type="password" name="currentPassword" required autoComplete="current-password" className={styles.input} />
          </label>
        )}

        {!isRecoveryRequest && <label className={styles.field}>
          <span className="label-small" style={{ color: "var(--text-secondary)" }}>{isRecovery ? "New password" : "Password"}</span>
          <input type={isReset ? "password" : "password"} name={isRecovery ? "newPassword" : "password"} required autoComplete={isRecovery || isReset || isSetup ? "new-password" : "current-password"} className={styles.input} />
        </label>}

        {(isSetup || isRecovery || isReset) && (
          <label className={styles.field}>
            <span className="label-small" style={{ color: "var(--text-secondary)" }}>Confirm password</span>
            <input type="password" name="confirmation" required autoComplete="new-password" className={styles.input} />
          </label>
        )}

        <button type="submit" className={styles.submit}><span className="label-button">{isSetup ? "Create password" : isRecovery ? "Update password" : isRecoveryRequest ? "Email reset link" : isReset ? "Reset credentials" : "Sign in"}</span></button>
        <button type="button" className={styles.flowLink} onClick={toggleAccountFlow}>
          {isSetup ? "Back to sign in" : isRecovery ? "Back to sign in" : isRecoveryRequest || isReset ? "Back to sign in" : hasCredentials ? "Forgot or need to change your password?" : "First time here? Set up admin password"}
        </button>
        {!isSetup && !isRecovery && !isRecoveryRequest && !isReset && <button type="button" className={styles.flowLink} onClick={() => setMode("request-recovery")}>Forgot username or password?</button>}
      </form>
    </main>
  );
}
