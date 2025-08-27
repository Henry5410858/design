import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHome, 
  FiGrid, 
  FiFileText, 
  FiImage, 
  FiCalendar, 
  FiSettings, 
  FiUser, 
  FiBell, 
  FiSearch, 
  FiMenu, 
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiZap,
  FiLogOut,
  FiEdit3
} from 'react-icons/fi';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { setUser } = useUser();

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(false);
        setMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close profile menu when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && profileMenuOpen) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [profileMenuOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [pathname, mobileMenuOpen]);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: FiHome,
      description: 'Vista general del proyecto'
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: FiGrid,
      description: 'Galería de plantillas'
    },
    {
      name: 'Flyers',
      href: '/flyers',
      icon: FiImage,
      description: 'Diseños de volantes'
    },
    {
      name: 'Propuestas',
      href: '/proposal',
      icon: FiFileText,
      description: 'Gestión de propuestas'
    },
    {
      name: 'Calendario',
      href: '/calendar',
      icon: FiCalendar,
      description: 'Planificación de proyectos'
    },
    {
      name: 'Configuración',
      href: '/settings',
      icon: FiSettings,
      description: 'Ajustes del sistema'
    }
  ];

  const toggleSidebar = () => {
    if (!isMobile) {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };
  
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Update user context
    setUser(null);
    
    // Close the profile menu
    setProfileMenuOpen(false);
    
    // Redirect to login page
    router.push('/login');
  };

  const handleProfileClick = () => {
    // Navigate to profile page
    router.push('/change-userinfo');
    setProfileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div 
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
              onClick={toggleMobileMenu}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 shadow-soft transition-all duration-300 ease-out ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        } lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        initial={{ x: -288 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 lg:px-6 border-b border-gray-200">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center shadow-lg">
              <FiZap className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <motion.h1
                className="text-xl font-bold text-gray-900 font-display hidden sm:block"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                LupaProp
              </motion.h1>
            )}
          </motion.div>
          
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            {sidebarCollapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
          </button>
          
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 lg:px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 lg:px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-primary/20 text-brand-primary'
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0 hidden sm:block">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 truncate">{item.description}</div>
                    </div>
                  )}
                  
                  {isActive && !sidebarCollapsed && (
                    <motion.div
                      className="w-2 h-2 bg-brand-primary rounded-full hidden sm:block"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 lg:p-4 border-t border-gray-200">
          <motion.div
            className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center">
              <FiUser className="w-5 h-5 text-white" />
            </div>
            
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 hidden sm:block">
                <div className="text-sm font-medium text-gray-900">Usuario Demo</div>
                <div className="text-xs text-gray-500">Plan Premium</div>
                
                {/* Plan Progress */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Uso del plan</span>
                    <span>75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <motion.div
                      className="bg-gradient-to-r from-brand-primary to-brand-secondary h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      transition={{ delay: 0.5, duration: 1 }}
                    />
                  </div>
                </div>
                
                <button className="mt-3 w-full px-3 py-2 bg-brand-primary text-white text-xs font-medium rounded-xl hover:bg-brand-primary-dark transition-colors duration-200">
                  Actualizar Plan
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-out ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        {/* Top Navigation */}
        <motion.header
          className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-soft"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Left Section */}
            <div className="flex items-center gap-3 lg:gap-4">
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                <FiMenu className="w-6 h-6" />
              </button>
              
              <h1 className="text-lg lg:text-xl font-semibold text-gray-900 font-display">
                Dashboard
              </h1>
            </div>

            {/* Center Section - Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400 group-focus-within:text-brand-primary transition-colors duration-200" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar en el dashboard..."
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 rounded-lg">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Notifications */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors duration-200">
                <FiBell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-red-400 to-red-600 rounded-full animate-pulse"></span>
              </button>

              {/* User Profile with Popup Menu */}
              <div className="relative">
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center gap-2 lg:gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-900">Usuario Demo</div>
                    <div className="text-xs text-gray-500">usuario@demo.com</div>
                    <div className="text-xs text-brand-primary font-medium">Plan Premium</div>
                  </div>
                </button>

                {/* Profile Popup Menu */}
                <AnimatePresence>
                  {profileMenuOpen && (
                    <>
                      {/* Backdrop */}
                      <motion.div
                        className="fixed inset-0 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setProfileMenuOpen(false)}
                      />
                      
                      {/* Menu */}
                      <motion.div
                        className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-elevated border border-gray-200 z-50 overflow-hidden"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center">
                              <FiUser className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">Usuario Demo</div>
                              <div className="text-sm text-gray-500">usuario@demo.com</div>
                              <div className="text-xs text-brand-primary font-medium">Plan Premium</div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <button
                            onClick={handleProfileClick}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          >
                            <FiEdit3 className="w-4 h-4 text-gray-500" />
                            <span>Editar Perfil</span>
                          </button>
                          
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors duration-200"
                          >
                            <FiLogOut className="w-4 h-4" />
                            <span>Cerrar Sesión</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
