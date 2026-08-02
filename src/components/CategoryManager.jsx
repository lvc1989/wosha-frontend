import React, { useState, useEffect } from "react";
import { api } from "../api.js";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626" };

export default function CategoryManager({ type, title }) {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const load = () => api.getCategories(type).then(setCategories);
  useEffect(() => { load(); }, [type]);

  const add = async (e) => {
    e.preventDefault();
    setError("");
    if (!newName.trim()) return;
    try {
      await api.addCategory(type, newName);
      setNewName("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const remove = async (id) => { await api.removeCategory(id); load(); };

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-6 max-w-lg mt-6">
      <div style={{ color: C.ink }} className="text-sm font-bold mb-4">{title}</div>
      {categories.map((c) => (
        <div key={c.id} className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <span style={{ color: C.ink }} className="text-sm">{c.name}</span>
          <button onClick={() => remove(c.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
        </div>
      ))}
      {categories.length === 0 && <div style={{ color: C.textSoft }} className="text-xs py-2">No categories yet.</div>}
      {error && <div style={{ color: C.danger }} className="text-xs mt-2">{error}</div>}
      <form onSubmit={add} className="flex gap-2 mt-3">
        <input placeholder="New category name" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
        <button style={{ background: C.cyan }} className="text-white text-sm font-semibold px-3 rounded-lg">Add</button>
      </form>
    </div>
  );
}
