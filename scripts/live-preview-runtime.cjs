const React = require("react");
const { createRoot } = require("react-dom/client");
const { LiveProvider, LivePreview, LiveContext } = require("react-live");
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const scope = { React, useState, useEffect, useRef, useMemo, useCallback };
function prepare(source) {
  let code = source.replace(/^\s*import[^;]+;\s*$/gm, "").replace(/export\s+default\s+function\s+/g, "function ").replace(/export\s+default\s+/g, "");
  if (!/\brender\s*\(/.test(code)) {
    const name = code.match(/function\s+([A-Z][A-Za-z0-9_]*)\s*\(/)?.[1] ?? code.match(/(?:const|let)\s+([A-Z][A-Za-z0-9_]*)\s*(?::[^=]+)?=/)?.[1];
    if (name) code += `\nrender(<${name} />);`;
  }
  return code;
}
class Boundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { this.props.report("error", { message: error.message }); }
  render() { return this.state.failed ? null : this.props.children; }
}
function Result({ report }) {
  const { error, element } = React.useContext(LiveContext);
  useEffect(() => { if (error) report("error", { message: String(error) }); else if (element) report("rendered"); }, [error, element, report]);
  return React.createElement(LivePreview, { "data-live-result": "" });
}
function App() {
  const [input, setInput] = useState(null);
  const node = useRef(null);
  const report = useCallback((type, data = {}) => { if (input) parent.postMessage({ source: "conscept-react-preview", channel: input.channel, type, ...data }, "*"); }, [input?.channel]);
  useEffect(() => {
    const receive = (event) => {
      const data = event.data;
      if (event.source !== parent || data?.source !== "conscept-react-parent" || typeof data.channel !== "string" || typeof data.code !== "string") return;
      if (data.tokens && typeof data.tokens === "object") for (const [name, value] of Object.entries(data.tokens)) if (/^--[\w-]+$/.test(name) && typeof value === "string" && value.length < 4096) document.documentElement.style.setProperty(name, value);
      if (typeof data.color === "string" && CSS.supports("color", data.color)) document.body.style.color = data.color;
      if (typeof data.font === "string" && CSS.supports("font", data.font)) document.body.style.font = data.font;
      setInput((current) => current?.code === data.code && current?.channel === data.channel ? current : { code: data.code, channel: data.channel });
    };
    window.addEventListener("message", receive);
    parent.postMessage({ source: "conscept-react-preview", type: "ready" }, "*");
    return () => window.removeEventListener("message", receive);
  }, []);
  useEffect(() => {
    if (!node.current || !input) return;
    const element = node.current;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const bounds = element.getBoundingClientRect();
      let bottom = bounds.bottom;
      for (const child of element.children) bottom = Math.max(bottom, child.getBoundingClientRect().bottom);
      // Round up fractional layout measurements without growing viewport-sized content.
      report("height", { height: Math.max(1, Math.ceil(bounds.height), Math.ceil(element.scrollHeight), Math.ceil(bottom - bounds.top)) });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule); observer.observe(element);
    const mutations = new MutationObserver(schedule); mutations.observe(element, { subtree: true, childList: true, attributes: true, characterData: true });
    element.addEventListener("load", schedule, true);
    window.addEventListener("resize", schedule);
    document.fonts?.ready.then(schedule).catch(() => {});
    schedule();
    return () => { observer.disconnect(); mutations.disconnect(); element.removeEventListener("load", schedule, true); window.removeEventListener("resize", schedule); if (frame) cancelAnimationFrame(frame); };
  }, [input, report]);
  return React.createElement("div", { ref: node, "data-live-wrapper": "", style: { display: "flow-root", width: "100%" } }, input && React.createElement(Boundary, { key: input.code, report }, React.createElement(LiveProvider, { code: prepare(input.code), scope, noInline: true, language: "tsx", enableTypeScript: true }, React.createElement(Result, { report }))));
}
createRoot(document.getElementById("preview-root")).render(React.createElement(App));
