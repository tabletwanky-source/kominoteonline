import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { SEOHead } from '../components/seo/SEOHead';
import { User, Mail, Phone, Save, LogOut } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { navigate } = useNavigation();
  const { user, isAuthenticated, updateProfile, logout } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('login');
      return;
    }
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
    }
  }, [user, isAuthenticated, navigate]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      setLoading(true);
      await updateProfile({ full_name: fullName, phone });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Nou pa t kapab mete ajou profil ou.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead title="Profil Mwen" description="Jere enfòmasyon profil ou sou Kominote Online." canonical="/profile" noindex />
      <div className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Profil Mwen</h1>
            <p className="text-sm text-slate-500 mt-1">Jere enfòmasyon pèsonèl ou yo.</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={user.full_name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-700/30"
              />
              <div>
                <p className="font-bold text-slate-900">{user.full_name}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5 pt-6">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium">
                  Profil ou mete ajou avèk siksè!
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Non Konplè</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Imèl</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Telefòn</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nimewo telefòn"
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Yon ti moman...' : 'Sove Chanjman'}
              </button>
            </form>

            <div className="pt-6 border-t border-slate-100 mt-6">
              <button
                onClick={() => {
                  logout();
                  navigate('home');
                }}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Dekonekte
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
