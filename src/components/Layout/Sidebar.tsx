import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  TruckIcon, 
  FileText, 
  Users, 
  Building2,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { 
      path: '/dashboard', 
      icon: Home, 
      label: 'Dashboard', 
      roles: ['solicitante', 'despachante', 'administrador'] 
    },
    { 
      path: '/materials', 
      icon: Package, 
      label: 'Materiais', 
      roles: ['despachante', 'administrador'] 
    },
    { 
      path: '/requests', 
      icon: ShoppingCart, 
      label: 'Solicitações', 
      roles: ['solicitante', 'despachante', 'administrador'] 
    },
    { 
      path: '/stock-entries', 
      icon: TruckIcon, 
      label: 'Entrada de Estoque', 
      roles: ['despachante', 'administrador'] 
    },
    { 
      path: '/reports', 
      icon: FileText, 
      label: 'Relatórios', 
      roles: ['despachante', 'administrador'] 
    },
    { 
      path: '/suppliers', 
      icon: Building2, 
      label: 'Fornecedores', 
      roles: ['despachante', 'administrador'] 
    },
    { 
      path: '/users', 
      icon: Users, 
      label: 'Usuários', 
      roles: ['administrador'] 
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="bg-slate-800 text-white w-64 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">Sistema de Estoque</h1>
        <p className="text-slate-300 text-sm mt-1">Secretaria de Educação</p>
      </div>

      <div className="flex-1 p-4">
        <div className="mb-6">
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-slate-300 text-xs capitalize">{user?.role}</p>
            {user?.school && (
              <p className="text-slate-300 text-xs mt-1">{user.school}</p>
            )}
          </div>
        </div>

        <nav className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors w-full"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;