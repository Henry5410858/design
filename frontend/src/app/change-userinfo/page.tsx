'use client';
import { useState } from 'react';

// Force dynamic rendering for this page
export const dynamic = 'auto';
import AppLayout from '../../components/layout/AppLayout';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCamera, FiSave, FiEdit3, FiShield, FiKey, FiBell, FiGlobe, FiStar, FiCheck } from 'react-icons/fi';
import { withContextPreservation, createContextAwarePromise } from '../../utils/contextManager';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  location: string;
  bio: string;
  avatar: string;
  role: 'Free' | 'Premium' | 'Ultra-Premium';
  preferences: {
    notifications: boolean;
    marketing: boolean;
    language: string;
    timezone: string;
  };
}

export default function ChangeUserInfoPage() {
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@empresa.com',
    phone: '+34 600 123 456',
    company: 'Empresa S.L.',
    position: 'Diseñador Senior',
    location: 'Madrid, España',
    bio: 'Diseñador creativo con más de 5 años de experiencia en branding y diseño digital.',
    avatar: '/api/users/1/avatar',
    role: 'Free',
    preferences: {
      notifications: true,
      marketing: false,
      language: 'es',
      timezone: 'Europe/Madrid'
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof UserProfile] as Record<string, unknown>),
          [child]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = withContextPreservation(async () => {
    setIsSaving(true);
    try {
      // Simulate API call with context-aware promise
      await createContextAwarePromise<void>(
        (resolve) => {
          setTimeout(() => {
            resolve();
          }, 1000);
        },
        {
          onError: (error) => {
            console.error('API call failed:', error);
            setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
          },
          onSuccess: () => {
            setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
            setIsEditing(false);
          }
        }
      );
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
    } finally {
      setIsSaving(false);
    }
  }, {
    onError: (error) => {
      console.error('Context-aware handleSave failed:', error);
      setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
      setIsSaving(false);
    }
  });

  const handleCancel = () => {
    // Reset to original values
    setIsEditing(false);
    setMessage(null);
  };

  const roleOptions = [
    { value: 'Free', label: 'Plan Gratuito', description: 'Acceso básico a templates', color: 'text-gray-600' },
    { value: 'Premium', label: 'Plan Premium', description: 'Funcionalidades avanzadas', color: 'text-brand-primary' },
    { value: 'Ultra-Premium', label: 'Plan Ultra-Premium', description: 'Experiencia completa', color: 'text-brand-secondary' }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Premium': return 'text-brand-primary';
      case 'Ultra-Premium': return 'text-brand-secondary';
      default: return 'text-gray-600';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Premium': return 'bg-brand-primary/10 text-brand-primary border-brand-primary/20';
      case 'Ultra-Premium': return 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center">
              <FiUser className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-gray-600">Gestiona tu información personal y preferencias</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-success/10 border border-success/20 text-success'
              : 'bg-error/10 border border-error/20 text-error'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-brand-primary/10 rounded-xl">
                    <FiUser className="w-5 h-5 text-brand-primary" />
                  </div>
                  Información Personal
                </h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-4 py-2 text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-colors duration-200"
                >
                  <FiEdit3 className="w-4 h-4" />
                  {isEditing ? 'Cancelar' : 'Editar'}
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                      <FiUser className="w-12 h-12 text-gray-400" />
                    </div>
                    {isEditing && (
                      <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center hover:bg-brand-primary-dark transition-colors duration-200">
                        <FiCamera className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {profile.firstName} {profile.lastName}
                    </h3>
                    <p className="text-gray-600">{profile.position} en {profile.company}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(profile.role)}`}>
                                                            <FiStar className="w-4 h-4" />
                        {profile.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Plan de Suscripción
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {roleOptions.map((role) => (
                      <div
                        key={role.value}
                        className={`relative p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          profile.role === role.value
                            ? 'border-brand-primary bg-brand-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${!isEditing ? 'cursor-default' : ''}`}
                        onClick={() => isEditing && handleInputChange('role', role.value)}
                      >
                        <div className="text-center">
                          <h4 className={`font-semibold text-sm mb-1 ${getRoleColor(role.value)}`}>
                            {role.label}
                          </h4>
                          <p className="text-xs text-gray-600">{role.description}</p>
                        </div>
                        {profile.role === role.value && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-brand-primary rounded-full flex items-center justify-center">
                            <FiCheck className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {!isEditing && (
                    <p className="text-xs text-gray-500 mt-2">
                      Para cambiar tu plan, contacta con soporte o actualiza desde tu panel de facturación.
                    </p>
                  )}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={profile.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={profile.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biografía
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-elevated transform hover:-translate-y-1"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <FiSave className="w-4 h-4" />
                          Guardar Cambios
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-brand-secondary/10 rounded-xl">
                  <FiBell className="w-5 h-5 text-brand-secondary" />
                </div>
                Preferencias
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma
                    </label>
                    <select
                      value={profile.preferences.language}
                      onChange={(e) => handleInputChange('preferences.language', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zona Horaria
                    </label>
                    <select
                      value={profile.preferences.timezone}
                      onChange={(e) => handleInputChange('preferences.timezone', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="Europe/Madrid">Madrid (GMT+1)</option>
                      <option value="Europe/London">Londres (GMT+0)</option>
                      <option value="America/New_York">Nueva York (GMT-5)</option>
                      <option value="America/Los_Angeles">Los Ángeles (GMT-8)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Notificaciones por Email</h4>
                      <p className="text-sm text-gray-600">Recibe actualizaciones sobre tus proyectos</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.preferences.notifications}
                        onChange={(e) => handleInputChange('preferences.notifications', e.target.checked)}
                        disabled={!isEditing}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Marketing y Promociones</h4>
                      <p className="text-sm text-gray-600">Recibe ofertas especiales y novedades</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.preferences.marketing}
                        onChange={(e) => handleInputChange('preferences.marketing', e.target.checked)}
                        disabled={!isEditing}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Info */}
          <div className="space-y-6">
            {/* Account Security */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-xl">
                  <FiShield className="w-5 h-5 text-success" />
                </div>
                Seguridad
              </h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200">
                  <FiKey className="w-5 h-5 text-gray-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Cambiar Contraseña</h4>
                    <p className="text-sm text-gray-600">Actualiza tu contraseña</p>
                  </div>
                </button>
                
                <button className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200">
                  <FiShield className="w-5 h-5 text-gray-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Autenticación 2FA</h4>
                    <p className="text-sm text-gray-600">Activa verificación en dos pasos</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                <div className="p-2 bg-info/10 rounded-xl">
                  <FiGlobe className="w-5 h-5 text-info" />
                </div>
                Información de Cuenta
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID de Usuario:</span>
                  <span className="font-medium text-gray-900">{profile.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Miembro desde:</span>
                  <span className="font-medium text-gray-900">Enero 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Último acceso:</span>
                  <span className="font-medium text-gray-900">Hoy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan actual:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(profile.role)}`}>
                    {profile.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full font-medium">
                    Activo
                  </span>
                </div>
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 rounded-2xl p-6 border border-brand-primary/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">¿Necesitas Ayuda?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Nuestro equipo de soporte está disponible 24/7 para ayudarte con cualquier consulta.
              </p>
              <button className="w-full px-4 py-2 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary-dark transition-colors duration-200 shadow-soft hover:shadow-elevated transform hover:-translate-y-1">
                Contactar Soporte
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
