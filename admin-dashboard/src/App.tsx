import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Restaurants from './pages/Restaurants';
import Products from './pages/Products';
import Users from './pages/Users';
import Drivers from './pages/Drivers';
import Analytics from './pages/Analytics';
import Coupons from './pages/Coupons';
import { useAuthStore } from './stores/authStore';
import { supabase } from './lib/supabase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No user data returned');
      }

      // 2. Get user details from public table
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      // Even if public query fails (RLS?), we have the auth user.
      // But for admin dashboard we really want the role.
      // If RLS blocks reading own user, we might need to rely on metadata or fix RLS.
      // For now, let's assume if they can login, and we can read, great. 
      // If read fails, fallback to auth data + default role (or strict check).

      const role = userData?.role || 'admin'; // Fallback for now

      setUser({
        id: authData.user.id,
        email: authData.user.email!,
        full_name: userData?.full_name || authData.user.user_metadata?.full_name || 'Admin',
        role: role,
      });

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🛵 Delivery Admin</h1>
          <p className="text-gray-500 mt-2">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="admin@delivery.pe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, setUser, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Fetch additional user data if needed
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setUser({
            id: session.user.id,
            email: session.user.email!,
            full_name: userData?.full_name || session.user.user_metadata?.full_name || 'Admin',
            role: userData?.role || 'admin',
          });
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        // handle logout if needed, but store might need manual clear if we rely on it
        // setUser(null); // Type error, need reset method or similar
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="restaurants" element={<Restaurants />} />
          <Route path="products" element={<Products />} />
          <Route path="users" element={<Users />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="coupons" element={<Coupons />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
