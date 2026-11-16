"use client";

import * as React from "react";
import { LiveContext, LivePreview, LiveProvider } from "react-live";

const scope = { React, useState: React.useState, useEffect: React.useEffect, useRef: React.useRef, useMemo: React.useMemo, useCallback: React.useCallback };

class PreviewErrorBoundary extends React.Component<{ channel: string; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) {
    parent.postMessage({ source: "conscept-react-preview", channel: this.props.channel, type: "error", message: error.message }, "*");
  }
  render() { return this.state.failed ? null : this.props.children; }
}

function prepare(source: string) {
  let code = source.replace(/^\s*import[^;]+;\s*$/gm, "").replace(/export\s+default\s+function\s+/g, "function ").replace(/export\s+default\s+/g, "");
  if (!/\brender\s*\(/.test(code)) {
    const name = code.match(/function\s+([A-Z][A-Za-z0-9_]*)\s*\(/)?.[1] ?? code.match(/(?:const|let)\s+([A-Z][A-Za-z0-9_]*)\s*(?::[^=]+)?=/)?.[1];
    if (name) code += `\nrender(<${name} />);`;
  }
  return code;
}

function Result({ channel }: { channel: string }) {
  const { error } = React.useContext(LiveContext);
  React.useEffect(() => {
    if (error) parent.postMessage({ source: "conscept-react-preview", channel, type: "error", message: String(error) }, "*");
  }, [channel, error]);
  return <LivePreview />;
}

export default function LiveComponentPreview() {
  const [code, setCode] = React.useState("");
  const [channel, setChannel] = React.useState("");
  const contentRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const receive = (event: MessageEvent) => {
      const data = event.data;
      if (event.source !== parent || data?.source !== "conscept-react-parent" || typeof data.channel !== "string" || typeof data.code !== "string") return;
      setChannel(data.channel);
      setCode(data.code);
      const root = document.documentElement;
      if (data.tokens && typeof data.tokens === "object") for (const [name, value] of Object.entries(data.tokens)) {
        if (/^--[\w-]+$/.test(name) && typeof value === "string" && value.length < 4096) root.style.setProperty(name, value);
      }
      if (typeof data.color === "string" && CSS.supports("color", data.color)) document.body.style.color = data.color;
      if (typeof data.font === "string" && CSS.supports("font", data.font)) document.body.style.font = data.font;
    };
    window.addEventListener("message", receive);
    parent.postMessage({ source: "conscept-react-preview", type: "ready" }, "*");
    return () => window.removeEventListener("message", receive);
  }, []);
  React.useEffect(() => {
    const node = contentRef.current;
    if (!node || !channel) return;
    const measure = () => parent.postMessage({ source: "conscept-react-preview", channel, type: "height", height: Math.max(1, Math.ceil(node.getBoundingClientRect().height), Math.ceil(node.scrollHeight)) }, "*");
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    const changes = new MutationObserver(measure);
    changes.observe(node, { subtree: true, childList: true, attributes: true, characterData: true });
    measure();
    return () => { observer.disconnect(); changes.disconnect(); };
  }, [channel, code]);
  return <><style>{`html,body{margin:0!important;padding:0!important;min-height:0!important;height:auto!important;background:transparent!important} #live-component-root{display:flow-root;width:100%}`}</style><div id="live-component-root" ref={contentRef}>{code && <PreviewErrorBoundary key={code} channel={channel}><LiveProvider code={prepare(code)} scope={scope} noInline language="tsx" enableTypeScript><Result channel={channel} /></LiveProvider></PreviewErrorBoundary>}</div></>;
}
