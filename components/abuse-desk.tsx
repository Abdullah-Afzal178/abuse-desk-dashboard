"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, Clipboard, Copy, ExternalLink, Mail, Search, ShieldAlert } from "lucide-react";

type AbuseResult = {
  ip: string;
  abuse: {
    route?: string;
    country?: string;
    name?: string;
    organization?: string;
    kind?: string;
    address?: string;
    emails?: string[];
    phone_numbers?: string[];
  };
};

const INCIDENTS = ["Spam", "Phishing", "Brute-force attempt", "DDoS / scanning", "Malware", "Other"];

export function AbuseDesk() {
  const [ip, setIp] = useState("");
  const [result, setResult] = useState<AbuseResult | null>(null);
  const [incident, setIncident] = useState(INCIDENTS[0]);
  const [observedAt, setObservedAt] = useState("");
  const [evidence, setEvidence] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const report = useMemo(() => {
    if (!result) return "";
    return [
      `Subject: Abuse report for ${result.ip} — ${incident}`,
      "",
      "Hello Abuse Desk,",
      "",
      `I am reporting suspected ${incident.toLowerCase()} activity associated with ${result.ip}.`,
      observedAt ? `Observed at: ${new Date(observedAt).toISOString()}` : "Observed at: [add date and time]",
      `Network range: ${result.abuse.route || "Not provided"}`,
      "",
      "Evidence:",
      evidence.trim() || "[Add log lines, URLs, timestamps, and other relevant evidence. Remove passwords or sensitive personal data.]",
      "",
      "Please investigate this activity and let me know if you need further details.",
      "",
      "Regards,",
      "[Your name / organization]",
    ].join("\n");
  }, [evidence, incident, observedAt, result]);

  async function lookup(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(`/api/abuse?ip=${encodeURIComponent(ip.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Lookup failed.");
      setResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const email = result?.abuse.emails?.[0];
  const mailto = email ? `mailto:${email}?subject=${encodeURIComponent(`Abuse report for ${result.ip} — ${incident}`)}&body=${encodeURIComponent(report.replace(/^Subject:.*\n\n/, ""))}` : "";

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#"><span><ShieldAlert size={19} /></span> Abuse Desk</a>
        <a className="powered" href="https://ipgeolocation.io" target="_blank" rel="noreferrer">Powered by ipgeolocation.io <ExternalLink size={13} /></a>
      </header>

      <section className="hero">
        <div className="eyebrow"><span /> IP ABUSE CONTACT LOOKUP</div>
        <h1>Route abuse reports<br />to the <em>right desk.</em></h1>
        <p>Paste a public IP to find its responsible abuse contact, then prepare a clear report in one place.</p>
        <form className="lookup" onSubmit={lookup}>
          <Search size={20} />
          <input aria-label="IP address" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="Enter an IPv4 or IPv6 address" autoFocus spellCheck={false} />
          <button disabled={loading || !ip.trim()}>{loading ? "Looking up…" : "Find contact"}</button>
        </form>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="privacy"><ShieldAlert size={14} /> Your API key stays on the server. No reports are sent automatically.</div>
      </section>

      {!result && (
        <section className="empty">
          <div className="empty-icon"><Clipboard size={25} /></div>
          <h2>From suspicious IP to ready-to-send report</h2>
          <p>Find the registered abuse team, add incident evidence, and copy or open the finished email.</p>
          <div className="steps"><span><b>01</b> Look up an IP</span><span><b>02</b> Add evidence</span><span><b>03</b> Send responsibly</span></div>
        </section>
      )}

      {result && (
        <section className="workspace">
          <div className="panel contact-panel">
            <div className="panel-heading"><div><span className="label">CONTACT FOUND</span><h2>{result.abuse.organization || result.abuse.name || "Abuse contact"}</h2></div><span className="country">{result.abuse.country || "—"}</span></div>
            <dl>
              <div><dt>IP address</dt><dd>{result.ip}<button onClick={() => copy(result.ip)} aria-label="Copy IP"><Copy size={15} /></button></dd></div>
              <div><dt>Network range</dt><dd>{result.abuse.route || "Not provided"}</dd></div>
              <div><dt>Contact role</dt><dd>{result.abuse.name || "Not provided"}</dd></div>
              <div><dt>Email</dt><dd>{email ? <a href={`mailto:${email}`}>{email}</a> : "Not provided"}</dd></div>
              <div><dt>Phone</dt><dd>{result.abuse.phone_numbers?.join(", ") || "Not provided"}</dd></div>
              <div><dt>Registered address</dt><dd className="address">{result.abuse.address || "Not provided"}</dd></div>
            </dl>
          </div>

          <div className="panel report-panel">
            <span className="label">REPORT BUILDER</span>
            <h2>Document the incident</h2>
            <div className="form-grid">
              <label>Incident type<select value={incident} onChange={(e) => setIncident(e.target.value)}>{INCIDENTS.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Observed at<input type="datetime-local" value={observedAt} onChange={(e) => setObservedAt(e.target.value)} /></label>
            </div>
            <label>Evidence and context<textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Paste relevant log lines, URLs, ports, timestamps, or a concise description…" /></label>
            <div className="actions">
              <button className="copy-report" onClick={() => copy(report)}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "Copied" : "Copy report"}</button>
              {email ? <a className="email-report" href={mailto}><Mail size={17} /> Open in email</a> : <span className="no-email">No email address available</span>}
            </div>
          </div>
        </section>
      )}

      <footer>Use this information responsibly. Verify evidence before contacting a network operator.</footer>
    </main>
  );
}
