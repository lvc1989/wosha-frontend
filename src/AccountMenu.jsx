import React, { useState, useRef, useEffect } from "react";
import { api } from "./api.js";
import FileDropzone from "./components/FileDropzone.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626" };

export default function AccountMenu({ user, onLogout, onUserUpdate }) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = (user?.name || "?").charAt(0).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button onClick={() => setOpen((v) => !v)} style={{ background: C.cyan }} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
        {user?.profilePic ? <img src={user.profilePic} alt="" className="w-full h-full object-cover" /> : initial}
      </button>

      {open && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="absolute right-0 top-11 w-56 rounded-xl shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div style={{ color: C.ink }} className="text-sm font-semibold truncate">{user?.name}</div>
            <div style={{ color: C.textSoft }} className="text-xs truncate">{user?.title || user?.role}</div>
          </div>
          <button onClick={() => { setProfileOpen(true); setOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-black/5" style={{ color: C.ink }}>Profile</button>
          <button onClick={() => { setPwOpen(true); setOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-black/5" style={{ color: C.ink }}>Change Password</button>
          <button onClick={onLogout} className="w-full text-left px-4 py-2.5 text-sm hover:bg-black/5" style={{ color: C.danger, borderTop: `1px solid ${C.border}` }}>Log out</button>
        </div>
      )}

      {profileOpen && <ProfileModal user={user} onClose={() => setProfileOpen(false)} onUserUpdate={onUserUpdate} />}
      {pwOpen && <ChangePasswordModal onClose={() => setPwOpen(false)} />}
    </div>
  );
}

function ProfileModal({ user, onClose, onUserUpdate }) {
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", email: user?.email || "", profilePic: user?.profilePic || "" });
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  const save = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const updated = await api.updateProfile(form);
      onUserUpdate(updated);
      setSaved("Saved.");
      setTimeout(() => setSaved(""), 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
      <form onSubmit={save} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
        <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Profile</div>
        <div className="flex items-center gap-3 mb-4">
          <div style={{ background: C.cyan }} className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden shrink-0">
            {form.profilePic ? <img src={form.profilePic} alt="" className="w-full h-full object-cover" /> : (form.name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <FileDropzone accept="image/*" label="Change photo" onUploaded={(f) => setForm({ ...form, profilePic: f.url })} />
          </div>
        </div>
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Full name</label>
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Phone</label>
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Email</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
        {error && <div style={{ background: "#FEE2E2", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-3">{error}</div>}
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Close</button>
          <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Save</button>
        </div>
        {saved && <div style={{ color: "#166534" }} className="text-xs text-center mt-2">{saved}</div>}
      </form>
    </div>
  );
}

function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.changePassword(currentPassword, newPassword);
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
      <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
        <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Change Password</div>
        {done ? (
          <div style={{ color: "#166534" }} className="text-sm mb-4">Password updated.</div>
        ) : (
          <>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Current password</label>
            <input required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>New password</label>
            <input required type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
            {error && <div style={{ background: "#FEE2E2", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-3">{error}</div>}
          </>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Close</button>
          {!done && <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Update</button>}
        </div>
      </form>
    </div>
  );
}
