import { useState, useEffect } from "react";
import { Shield, CheckCircle2, XCircle, Loader2, LogOut } from "lucide-react";
import { Toaster, toast } from "sonner";
import { api } from "./api";
import { supabase } from "./supabase";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
      toast.success(newStatus ? "Company verified!" : "Company unverified!");
    } catch (err: any) {
      toast.dismiss();
      toast.error("Failed to update verification");
    }
  };

  if (loadingSession) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Toaster />
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full mx-4">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield size={32} className="text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-center text-gray-900 mb-2">Admin Login</h1>
          <p className="text-center text-gray-500 text-sm mb-6">Enter your admin credentials</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {authLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const companies = users.filter((u) => u.role === "company");
  const workers = users.filter((u) => u.role === "worker");

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden">
      <Toaster />
      
      {/* Header */}
      <div className="shrink-0 bg-gray-900 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Shield className="text-blue-400" size={28} />
          <h1 className="text-white font-black text-2xl tracking-tight">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-300 text-sm">{session.user.email}</span>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 size={32} className="animate-spin text-blue-500 mb-2" />
          <p className="text-gray-500 text-sm">Loading database...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-6xl mx-auto space-y-10">
            
            {/* Companies Section */}
            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
                <span className="bg-blue-100 text-blue-700 w-8 h-8 flex items-center justify-center rounded-lg text-sm">{companies.length}</span>
                Companies
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.map(company => (
                  <div key={company.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                    
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-200">
                        {company.avatar ? (
                          <img src={company.avatar} alt="logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-gray-400">{company.name?.charAt(0) || "C"}</span>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg truncate">{company.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{company.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <p className="text-xs text-gray-400 font-mono" title={company.id}>ID: {company.id.split('-')[0]}...</p>
                      {/* Action */}
                      <button
                        onClick={() => handleToggleVerify(company.id, company.verified)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                          company.verified 
                            ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                
                {companies.length === 0 && (
                  <div className="col-span-full text-center text-gray-400 py-10">No companies found in database.</div>
                )}
              </div>
            </section>

            {/* Workers Section */}
            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
                <span className="bg-teal-100 text-teal-700 w-8 h-8 flex items-center justify-center rounded-lg text-sm">{workers.length}</span>
                Workers
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workers.map(worker => (
                  <div key={worker.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 bg-teal-50 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center border border-teal-100">
                      {worker.avatar ? (
                        <img src={worker.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-teal-500">{worker.name?.charAt(0) || "W"}</span>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg truncate">{worker.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{worker.email}</p>
                      <p className="text-xs text-gray-400 font-mono mt-1" title={worker.id}>ID: {worker.id.split('-')[0]}...</p>
                    </div>
                  </div>
                ))}

                {workers.length === 0 && (
                  <div className="col-span-full text-center text-gray-400 py-10">No workers found in database.</div>
                )}
              </div>
            </section>

          </div>
        </div>
      )}
    </div>
  );
}
