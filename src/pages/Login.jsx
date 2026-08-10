import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import CustomSelect from "../components/CustomSelect.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import { X } from "lucide-react";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", amber: "#FFC93C", bg: "#F5F7FA", border: "#E4E7EC", danger: "#DC2626", textSoft: "#667085" };

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = [password.length >= 8, password.length >= 12, /[A-Z]/.test(password) && /[a-z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Very strong"];
  const colors = ["#DC2626", "#DC2626", "#966B00", "#966B00", "#1745B3", "#1745B3"];
  return (
    <div className="mb-3 -mt-2">
      <div className="flex gap-1 mb-1">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-1 flex-1 rounded" style={{ background: i <= score ? colors[score] : C.border }} />)}</div>
      <span style={{ color: colors[score] }} className="text-xs font-medium">{labels[score]}{password.length < 8 ? " — at least 8 characters" : ""}</span>
    </div>
  );
}

function ForgotPasswordFlow({ onClose }) {
  const [step, setStep] = useState("identify");
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [delivered, setDelivered] = useState(null);

  React.useEffect(() => {
    if (step !== "otp" || seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, seconds]);

  const submitIdentify = async () => {
    setError("");
    try {
      const result = await api.forgotPasswordRequest(identifier);
      setUsername(result.username);
      setDelivered(result.delivered);
      setSeconds(60);
      setStep("otp");
    } catch (err) {
      setError(err.message);
    }
  };
  const verifyAndReset = async () => {
    setError("");
    if (newPassword !== confirmPassword) return setError("Passwords don't match.");
    if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
    try {
      await api.forgotPasswordVerify(username, code, newPassword);
      setStep("done");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.5)" }}>
      <div style={{ background: "#fff" }} className="w-full max-w-sm rounded-[28px] p-7">
        <div className="flex items-center justify-between mb-4">
          <div style={{ color: C.ink }} className="text-lg font-bold">Reset Password</div>
          <button onClick={onClose} style={{ color: C.textSoft }}><X size={18} /></button>
        </div>
        {error && <div style={{ background: "#FEE2E2", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-3">{error}</div>}

        {step === "identify" && (
          <>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Username, email, or phone</label>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
            <button onClick={submitIdentify} style={{ background: C.cyan }} className="w-full text-white rounded-lg py-2.5 text-sm font-semibold">Continue</button>
          </>
        )}

        {step === "otp" && (
          <>
            <div style={{ color: C.textSoft }} className="text-sm mb-3">{delivered ? "A code was sent to your registered contact." : "Delivery isn't configured on this server yet — check the server console/logs for your code (or ask your admin)."}</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>6-digit code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} maxLength={6} style={{ borderColor: C.border, letterSpacing: "0.2em", textAlign: "center", fontFamily: "monospace" }} className="w-full border rounded-lg px-3 py-2 mb-2 text-sm" />
            <div className="flex items-center justify-between mb-4">
              <span style={{ color: seconds <= 10 ? C.danger : C.textSoft }} className="text-xs font-mono">{seconds > 0 ? `Expires in ${seconds}s` : "Code expired"}</span>
              {seconds <= 0 && <button onClick={submitIdentify} style={{ color: C.cyan }} className="text-xs font-semibold">Resend code</button>}
            </div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>New password</label>
            <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mb-3" />
            <PasswordStrength password={newPassword} />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Confirm new password</label>
            <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mb-4" />
            <button onClick={verifyAndReset} disabled={seconds <= 0} style={{ background: C.cyan }} className="w-full text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50">Set New Password</button>
          </>
        )}

        {step === "done" && (
          <>
            <div style={{ background: "#E6F4EA", color: "#166534" }} className="rounded-lg px-4 py-3 text-sm mb-4">Password reset — you can log in with your new password now.</div>
            <button onClick={onClose} style={{ background: C.cyan }} className="w-full text-white rounded-lg py-2.5 text-sm font-semibold">Back to Login</button>
          </>
        )}
      </div>
    </div>
  );
}

function GuestBookingForm() {
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", vehiclePlate: "", locationId: "", serviceIds: [], scheduledTime: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    Promise.all([api.getPublicBranches(), api.getPublicServices()]).then(([b, s]) => {
      setBranches(b); setServices(s);
      setForm((f) => ({ ...f, locationId: b[0]?.id || "" }));
    });
  }, []);

  const toggleService = (id) => setForm((f) => ({ ...f, serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id] }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.serviceIds.length) { setError("Choose at least one service."); return; }
    setBusy(true);
    try {
      await api.guestBookingRequest(form);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-4">
        <div style={{ color: C.ink }} className="text-base font-bold mb-2">Request sent!</div>
        <div style={{ color: C.textSoft }} className="text-sm">We'll confirm your booking shortly. Create a full account any time to track it and see your history.</div>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <label className="text-xs font-semibold mb-1 block" style={{ color: C.textSoft }}>Full name</label>
      <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
      <label className="text-xs font-semibold mb-1 block" style={{ color: C.textSoft }}>Phone</label>
      <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
      <label className="text-xs font-semibold mb-1 block" style={{ color: C.textSoft }}>Vehicle plate (optional)</label>
      <input value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
      <label className="text-xs font-semibold mb-1 block" style={{ color: C.textSoft }}>Branch</label>
      <div className="mb-3">
        <CustomSelect value={form.locationId} onChange={(v) => setForm({ ...form, locationId: v })} options={branches.map((b) => ({ value: b.id, label: b.name }))} />
      </div>
      <label className="text-xs font-semibold mb-1 block" style={{ color: C.textSoft }}>Services</label>
      <div style={{ borderColor: C.border }} className="border rounded-lg p-2 mb-3 max-h-32 overflow-y-auto flex flex-col gap-1">
        {services.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} />
            {s.name} — TZS {Number(s.price).toLocaleString()}
          </label>
        ))}
      </div>
      <label className="text-xs font-semibold mb-1 block" style={{ color: C.textSoft }}>Preferred time (optional)</label>
      <input value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} placeholder="e.g. 2:00 PM" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
      {error && <div style={{ background: "#FEE2E2", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-3">{error}</div>}
      <button disabled={busy} style={{ background: C.cyan }} className="w-full text-white rounded-lg py-2.5 text-sm font-semibold">{busy ? "Sending…" : "Send Booking Request"}</button>
      <div style={{ color: C.textSoft }} className="text-xs text-center mt-3">No account needed — create one any time to track this request.</div>
    </form>
  );
}

export default function Login({ onLogin }) {
  const [portal, setPortal] = useState("owner");
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [signupForm, setSignupForm] = useState({ name: "", phone: "", email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [brand, setBrand] = useState(null);

  useEffect(() => { api.getPublicSettings().then(setBrand).catch(() => {}); }, []);

  const roleGroupFor = { owner: ["owner"], employee: ["manager", "staff"], client: ["client"] };
  const PORTAL_TABS = [
    { id: "owner", label: "Intranet" },
    { id: "employee", label: "Staff" },
    { id: "client", label: "Client" },
  ];

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token, user } = await api.login(username, password, roleGroupFor[portal]);
      onLogin(token, user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitSignup = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token, user } = await api.signup(signupForm);
      onLogin(token, user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: brand?.login_background_color || C.ink }}>
      <div style={{ background: "#fff" }} className="w-full max-w-sm rounded-[28px] p-7">
        <div className="flex items-center gap-2 mb-2 justify-center">
          {brand?.logo_url ? (
            <img src={brand.logo_url} alt="" className="w-9 h-9 rounded-lg object-contain" />
          ) : (
            <div style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.amber})` }} className="w-9 h-9 rounded-lg" />
          )}
          <span style={{ color: C.ink }} className="text-xl font-bold">{brand?.business_name || "Wosha"}</span>
        </div>
        {brand?.login_message && (
          <div style={{ color: C.textSoft }} className="text-sm text-center mb-6">{brand.login_message}</div>
        )}
        {!brand?.login_message && <div className="mb-6" />}

        <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase tracking-wide mb-2">Log In as</div>
        <div className="flex rounded-lg overflow-hidden mb-5" style={{ border: `1px solid ${C.border}` }}>
          {PORTAL_TABS.map((t) => (
            <button key={t.id} onClick={() => { setPortal(t.id); setError(""); }} style={{ background: portal === t.id ? C.cyan : "transparent", color: portal === t.id ? "#fff" : C.textSoft }} className="flex-1 py-2 text-xs font-semibold">{t.label}</button>
          ))}
        </div>

        {portal === "client" && (
          <div className="flex rounded-lg overflow-hidden mb-5" style={{ border: `1px solid ${C.border}` }}>
            <button onClick={() => { setMode("login"); setError(""); }} style={{ background: mode === "login" ? C.amber : "transparent", color: mode === "login" ? C.ink : C.textSoft }} className="flex-1 py-2 text-xs font-semibold">Log In</button>
            <button onClick={() => { setMode("signup"); setError(""); }} style={{ background: mode === "signup" ? C.amber : "transparent", color: mode === "signup" ? C.ink : C.textSoft }} className="flex-1 py-2 text-xs font-semibold">Create Account</button>
            <button onClick={() => { setMode("guest"); setError(""); }} style={{ background: mode === "guest" ? C.amber : "transparent", color: mode === "guest" ? C.ink : C.textSoft }} className="flex-1 py-2 text-xs font-semibold">Continue as Guest</button>
          </div>
        )}

        {error && <div style={{ background: "#FEE2E2", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-4">{error}</div>}

        {portal === "client" && mode === "guest" ? (
          <GuestBookingForm />
        ) : mode === "login" || portal !== "client" ? (
          <form onSubmit={submit}>
            <label className="text-xs font-semibold mb-1 block" style={{ color: C.textSoft }}>Username</label>
            <input required value={username} onChange={(e) => setUsername(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold mb-1 block" style={{ color: C.textSoft }}>Password</label>
            <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} className="mb-4" />
            <button disabled={busy} style={{ background: C.cyan }} className="w-full text-white rounded-lg py-2.5 text-sm font-semibold">{busy ? "Logging in…" : "Log In"}</button>
            <button type="button" onClick={() => setForgotOpen(true)} style={{ color: "#1745B3" }} className="text-xs font-semibold mt-3">Forgot password?</button>
          </form>
        ) : (
          <form onSubmit={submitSignup}>
            {[["name", "Full name"], ["phone", "Phone"], ["email", "Email (optional)"], ["username", "Choose a username"]].map(([f, label]) => (
              <div key={f}>
                <label className="text-xs font-semibold mb-1 block" style={{ color: C.textSoft }}>{label}</label>
                <input required={f !== "email"} value={signupForm[f]} onChange={(e) => setSignupForm({ ...signupForm, [f]: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
              </div>
            ))}
            <label className="text-xs font-semibold mb-1 block" style={{ color: C.textSoft }}>Choose a password</label>
            <PasswordInput required value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} className="mb-3" />
            <PasswordStrength password={signupForm.password} />
            <button disabled={busy} style={{ background: C.cyan }} className="w-full text-white rounded-lg py-2.5 text-sm font-semibold">{busy ? "Creating…" : "Create Account"}</button>
          </form>
        )}
      </div>
      {forgotOpen && <ForgotPasswordFlow onClose={() => setForgotOpen(false)} />}
    </div>
  );
}
