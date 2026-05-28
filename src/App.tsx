import { useState, useEffect, useMemo } from "react";
import { Shield, CheckCircle2, XCircle, Loader2, LogOut, Edit2, Trash2, Moon, Sun, Users, Building2, Briefcase } from "lucide-react";
import { Toaster, toast } from "sonner";
import { api } from "./api";
import { supabase } from "./supabase";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Dark Mode State
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadUsers();
    }
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerify = async (id: string, currentStatus: boolean) => {
    try {
      toast.loading("Updating verification...");
      const newStatus = !currentStatus;
      await api.verifyUser(id, newStatus);
      setUsers(users.map(u => u.id === id ? { ...u, verified: newStatus } : u));
      toast.dismiss();
      toast.success(newStatus ? "Verified!" : "Unverified!");
    } catch (err: any) {
      toast.dismiss();
      toast.error("Failed to update verification");
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    try {
      setIsSaving(true);
      await api.updateUser(editingUser.id, { name: editName, email: editEmail });
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, name: editName, email: editEmail } : u));
      toast.success("User updated!");
      setEditingUser(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to completely delete this user? This cannot be undone!")) return;
    try {
      toast.loading("Deleting user...");
      await api.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      toast.dismiss();
      toast.success("User deleted forever.");
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Failed to delete");
    }
  };

  if (loadingSession) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Toaster />
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center transform rotate-12 transition-transform hover:rotate-0">
              <Shield size={32} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-center text-gray-900 dark:text-white mb-2 tracking-tight">Admin Portal</h1>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">Authorized personnel only</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 dark:text-white transition-colors"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 dark:text-white transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-blue-500/30"
            >
              {authLoading ? "Authenticating..." : "Login to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const companies = users.filter((u) => u.role === "company");
  const workers = users.filter((u) => u.role === "worker");
  const verifiedCount = users.filter(u => u.verified).length;

  // Chart Data
  const roleData = [
    { name: 'Companies', value: companies.length, color: '#3b82f6' }, // blue-500
    { name: 'Workers', value: workers.length, color: '#14b8a6' }, // teal-500
  ];

  const verifyData = [
    { name: 'Verified', value: verifiedCount, color: '#22c55e' }, // green-500
    { name: 'Unverified', value: companies.length - verifiedCount, color: '#f59e0b' }, // amber-500
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Toaster theme={isDark ? 'dark' : 'light'} />
      
      {/* Premium Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-gray-900 dark:text-white font-black text-xl tracking-tight leading-none">NeedIO Admin</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Superuser Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div className="flex items-center gap-3 pl-6 border-l border-gray-200 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-300 text-sm font-medium hidden md:block">{session.user.email}</span>
            <button onClick={handleLogout} className="p-2.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Syncing database...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* STATS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Total Users</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{users.length}</h3>
              </div>
              
              <div 
                onClick={() => document.getElementById('companies-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-purple-200 dark:hover:border-purple-800/50"
              >
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mb-4">
                  <Building2 className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Companies</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{companies.length}</h3>
              </div>

              <div 
                onClick={() => document.getElementById('workers-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-teal-200 dark:hover:border-teal-800/50"
              >
                <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center mb-4">
                  <Briefcase className="text-teal-600 dark:text-teal-400" size={24} />
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Workers</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{workers.length}</h3>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle2 className="text-green-600 dark:text-green-400" size={24} />
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Verified</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{verifiedCount}</h3>
              </div>
            </div>

            {/* CHARTS ROW */}
            {users.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6">User Demographics</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={roleData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {roleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6">Company Verification Status</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={verifyData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {verifyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
            
            {/* COMPANIES LIST */}
            <section id="companies-section">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 w-8 h-8 flex items-center justify-center rounded-xl text-sm">{companies.length}</span>
                  Companies
                </h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {companies.map(company => (
                  <div key={company.id} className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-700">
                        {company.avatar ? (
                          <img src={company.avatar} alt="logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-black text-gray-400 dark:text-gray-500">{company.name?.charAt(0) || "C"}</span>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate pr-4">{company.name}</h3>
                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(company)} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(company.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{company.email}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-1 opacity-50" title={company.id}>ID: {company.id}</p>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</span>
                      <button
                        onClick={() => handleToggleVerify(company.id, company.verified)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                          company.verified 
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {company.verified ? (
                          <><CheckCircle2 size={16} /> Verified</>
                        ) : (
                          <><XCircle size={16} /> Verify</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* WORKERS LIST */}
            <section id="workers-section" className="pb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                  <span className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 w-8 h-8 flex items-center justify-center rounded-xl text-sm">{workers.length}</span>
                  Workers
                </h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {workers.map(worker => (
                  <div key={worker.id} className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/20 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center border border-teal-100 dark:border-teal-900/50">
                        {worker.avatar ? (
                          <img src={worker.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-black text-teal-500 dark:text-teal-400">{worker.name?.charAt(0) || "W"}</span>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate pr-4">{worker.name}</h3>
                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(worker)} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(worker.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{worker.email}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-1 opacity-50" title={worker.id}>ID: {worker.id}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md p-6 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">Edit User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button 
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveEdit}
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
