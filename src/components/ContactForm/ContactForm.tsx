"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/Button/Button";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import styles from "./ContactForm.module.css";

type SubmitState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent"; title: string; body: string }
  | { status: "error"; message: string };

export function ContactForm({ personal = true }: { personal?: boolean }) {
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const replyLine = personal ? "I reply within two working days." : "We reply within two working days.";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setState({ status: "sending" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          newsletter: data.get("newsletter") === "on",
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setState({
          status: "error",
          message: payload?.error ?? "Something went wrong — please try again.",
        });
        return;
      }

      const payload = await response.json();
      setState({
        status: "sent",
        title: payload.confirmationTitle || "Thanks — message received.",
        body: payload.confirmationBody || replyLine,
      });
    } catch {
      setState({
        status: "error",
        message: "Something went wrong — please try again.",
      });
    }
  }

  if (state.status === "sent") {
    return (
      <div className={styles.form}>
        <h2 className="heading-02">{state.title}</h2>
        <p className="body-default" style={{ color: "var(--text-secondary)" }}>
          {state.body}
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className="heading-02">Start a conversation</h2>
      <p className="body-small" style={{ color: "var(--text-secondary)" }}>A few details are enough to begin.</p>

      {state.status === "error" && (
        <p className={styles.error}>{state.message}</p>
      )}

      <label className={styles.field}>
        <span className="label-small" style={{ color: "var(--text-secondary)" }}>
          Name
        </span>
        <input
          type="text"
          name="name"
          required
          placeholder="Your name"
          className={styles.input}
        />
      </label>

      <label className={styles.field}>
        <span className="label-small" style={{ color: "var(--text-secondary)" }}>
          Work email
        </span>
        <input
          type="email"
          name="email"
          required
          placeholder="you@company.com"
          className={styles.input}
        />
        <span className="body-small" style={{ color: "var(--text-tertiary)" }}>
          {replyLine}
        </span>
      </label>

      <label className={styles.field}>
        <span className="label-small" style={{ color: "var(--text-secondary)" }}>
          What are you working through?
        </span>
        <textarea
          name="message"
          required
          placeholder="A short description of the challenge"
          className={styles.textarea}
        />
      </label>

      <Button type="submit" icon={<ArrowIcon size={16} />}>
        {state.status === "sending" ? "Sending…" : "Send enquiry"}
      </Button>
    </form>
  );
}
