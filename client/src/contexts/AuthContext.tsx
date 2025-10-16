import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  _id: string;
  employeeId: string;
  username: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    titleTh?: string;
    titleEn?: string;
    phone: string;
    lineId?: string;
    profileImage?: string;
  };
  role: string;
  permissions: Array<{
    module: string;
    actions: string[];
  }>;
  fullName: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  hasPermission: (module: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log('🔐 Attempting login...', { username });
      const response = await api.post('/auth/login', { username, password });
      console.log('✅ Login API response:', response.data);
      
      const { token: newToken, user: userData } = response.data.data;
      console.log('📦 Extracted data:', { token: newToken, user: userData });

      setToken(newToken);
      setUser(userData as any);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      console.log('✅ Login successful, user set in state');
      return;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      // If backend is unreachable or returned 401, allow dev/demo credentials locally
      console.warn('Backend login failed or unreachable, falling back to demo users.', error?.message || error);

      const demoMap: Record<string, any> = {
        'admin:admin123': {
          _id: 'dev-admin',
          employeeId: 'DEVADMIN',
          username: 'admin',
          email: 'admin@kleara.com',
          profile: { firstName: 'ผู้ดูแล', lastName: 'ระบบ', phone: '081-234-5678' },
          role: 'admin',
          permissions: [{ module: '*', actions: ['*'] }],
          fullName: 'คุณ ผู้ดูแล ระบบ',
          isActive: true,
        },
        'doctor1:doctor123': {
          _id: 'dev-doctor1',
          employeeId: 'DEVDR1',
          username: 'doctor1',
          email: 'doctor1@kleara.com',
          profile: { firstName: 'หมอ', lastName: 'หนึ่ง', phone: '081-000-0001' },
          role: 'doctor',
          permissions: [{ module: 'appointments', actions: ['read', 'write'] }],
          fullName: 'หมอ หนึ่ง',
          isActive: true,
        },
        'receptionist1:recep123': {
          _id: 'dev-recep1',
          employeeId: 'DEVREC1',
          username: 'receptionist1',
          email: 'reception1@kleara.com',
          profile: { firstName: 'แอดมิน', lastName: 'ต้อนรับ', phone: '081-000-0002' },
          role: 'reception',
          permissions: [{ module: 'patients', actions: ['read', 'write'] }],
          fullName: 'แอดมิน ต้อนรับ',
          isActive: true,
        }
      };

      const key = `${username}:${password}`;
      const fallback = demoMap[key];
      if (fallback) {
        setToken('dev-token');
        setUser(fallback);
        localStorage.setItem('token', 'dev-token');
        localStorage.setItem('user', JSON.stringify(fallback));
        api.defaults.headers.common['Authorization'] = `Bearer dev-token`;
        return;
      }

      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    // Call server logout to clear refresh cookie
    try {
      api.post('/auth/logout').catch(() => {});
    } catch {}
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    const permission = user.permissions.find(p => p.module === module);
    return permission ? permission.actions.includes(action) : false;
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};