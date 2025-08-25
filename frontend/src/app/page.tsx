'use client';
import { useUser } from '../context/UserContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FeatureCard from '../components/dashboard/FeatureCard';
import { FiGrid, FiLayers, FiImage, FiFileText, FiCalendar, FiEdit3, FiZap } from 'react-icons/fi';
import DashboardLayout from '../components/layout/DashboardLayout';

const features = [
  {
    title: 'Templates',
    description: 'Browse and use professional design templates',
    icon: <FiGrid className="w-6 h-6" />,
    href: '/templates',
    color: 'from-blue-500 to-blue-600'
  },
  {
    title: 'My Designs',
    description: 'Access your saved designs and projects',
    icon: <FiLayers className="w-6 h-6" />,
    href: '/my-designs',
    color: 'from-purple-500 to-purple-600'
  },
  {
    title: 'Brand Kit',
    description: 'Manage your brand identity and assets',
    icon: <FiImage className="w-6 h-6" />,
    href: '/brand',
    color: 'from-emerald-500 to-emerald-600'
  },
  {
    title: 'Flyers',
    description: 'Create stunning promotional materials',
    icon: <FiFileText className="w-6 h-6" />,
    href: '/flyers',
    color: 'from-orange-500 to-orange-600'
  },
  {
    title: 'AI Text',
    description: 'Generate creative content with AI assistance',
    icon: <FiZap className="w-6 h-6" />,
    href: '/ai-text',
    color: 'from-pink-500 to-pink-600'
  },
  {
    title: 'Calendar',
    description: 'Plan and schedule your design campaigns',
    icon: <FiCalendar className="w-6 h-6" />,
    href: '/calendar',
    color: 'from-indigo-500 to-indigo-600'
  }
];

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && (localStorage.getItem('token') || document.cookie.includes('token='));
    if (!user && !hasToken) {
      router.replace('/login');
    }
  }, [user, router]);

  if (!user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome back, {user.name || 'Designer'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your creative workspace for professional design, branding, and content creation
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              onClick={() => router.push(feature.href)}
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-6 flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                  Get started
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Designs</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FiLayers className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FiGrid className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">2.4 GB</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FiImage className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
