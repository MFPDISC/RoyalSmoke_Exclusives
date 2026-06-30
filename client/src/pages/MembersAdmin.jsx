import React, { useState, useEffect } from 'react';
import { Crown, LogOut, Search, Download } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '/api';

export default function MembersAdmin() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/members/admin/login`, { password });
      sessionStorage.setItem('rs_admin_pass', password);
      setAuthed(true);
      setAuthError('');
    } catch {
      setAuthError('Incorrect password');
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('rs_admin_pass');
    if (saved) {
      setPassword(saved);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    const pass = sessionStorage.getItem('rs_admin_pass') || password;
    axios
      .get(`${API}/members/admin/list`, { headers: { 'x-admin-password': pass } })
      .then((r) => setMembers(r.data))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [authed]);

  const logout = () => {
    sessionStorage.removeItem('rs_admin_pass');
    setAuthed(false);
    setPassword('');
    setMembers([]);
  };

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Delivery Address', 'ID Number', 'Joined'];
    const rows = members.map((m) => [
      m.id, m.name, m.phone, m.email,
      `"${(m.delivery_address || '').replace(/"/g, '""')}"`,
      m.id_number,
      m.member_joined_at || m.created_at,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `royalsmoke-members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-6">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <Crown size={40} className="text-gold-400 mx-auto mb-3" />
            <h1 className="text-3xl font-serif text-white">Members Admin</h1>
            <p className="text-gray-500 text-sm mt-1">RoyalSmoke Exclusives</p>
          </div>
          <form onSubmit={handleLogin} className="bg-dark-800 border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6">
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
                className="w-full bg-dark-900 border border-white/5 rounded-xl p-4 text-white focus:border-gold-500 outline-none"
                placeholder="••••••••"
                required
                autoFocus
              />
            </div>
            {authError && (
              <p className="text-red-400 text-sm text-center">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-gold-500 text-black font-black py-4 rounded-xl hover:bg-gold-400 transition-all"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Crown size={32} className="text-gold-400" />
            <div>
              <h1 className="text-3xl font-serif text-white">Members</h1>
              <p className="text-gray-500 text-sm">{members.length} total members</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white hover:border-white/30 transition-all"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white hover:border-white/30 transition-all"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-800 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white focus:border-gold-500 outline-none transition-all"
            placeholder="Search by name, phone, or email..."
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading members...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            {search ? 'No results found.' : 'No members yet.'}
          </div>
        ) : (
          <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 text-gray-500 text-xs font-bold uppercase tracking-widest">#</th>
                    <th className="text-left p-4 text-gray-500 text-xs font-bold uppercase tracking-widest">Name</th>
                    <th className="text-left p-4 text-gray-500 text-xs font-bold uppercase tracking-widest">Phone</th>
                    <th className="text-left p-4 text-gray-500 text-xs font-bold uppercase tracking-widest">Email</th>
                    <th className="text-left p-4 text-gray-500 text-xs font-bold uppercase tracking-widest">Delivery Address</th>
                    <th className="text-left p-4 text-gray-500 text-xs font-bold uppercase tracking-widest">ID Number</th>
                    <th className="text-left p-4 text-gray-500 text-xs font-bold uppercase tracking-widest">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => (
                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="p-4 text-gray-600">{i + 1}</td>
                      <td className="p-4 text-white font-semibold">{m.name}</td>
                      <td className="p-4 text-gray-300">{m.phone}</td>
                      <td className="p-4 text-gray-300">{m.email}</td>
                      <td className="p-4 text-gray-400 max-w-xs truncate">{m.delivery_address}</td>
                      <td className="p-4 text-gray-400 font-mono">{m.id_number}</td>
                      <td className="p-4 text-gray-500 whitespace-nowrap">
                        {m.member_joined_at ? new Date(m.member_joined_at).toLocaleDateString('en-ZA') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
