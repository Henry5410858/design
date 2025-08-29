'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FeatureGateProps, PLAN_LEVELS, PlanLevel } from '@/types';

const FeatureGate: React.FC<FeatureGateProps> = ({ 
  requiredPlan, 
  children, 
  fallback 
}) => {
  const { user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check if user has access to this feature
  const hasAccess = user && PLAN_LEVELS[user.plan] >= PLAN_LEVELS[requiredPlan];

  // Show upgrade modal for users without access
  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };

  // Redirect to main platform billing
  const redirectToBilling = () => {
    const billingUrl = process.env.NEXT_PUBLIC_BILLING_URL || '/billing';
    window.location.href = billingUrl;
  };

  // If user has access, show the feature
  if (hasAccess) {
    return <>{children}</>;
  }

  // If fallback is provided, show it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  return (
    <>
      <div 
        className="cursor-pointer opacity-60 hover:opacity-80 transition-opacity"
        onClick={handleUpgradeClick}
        title={`Función exclusiva para plan ${requiredPlan}`}
      >
        {children}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-white">🔒</span>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Función Exclusiva
            </h3>
            
            <p className="text-gray-600 mb-6">
              Esta función está disponible exclusivamente para usuarios con plan{' '}
              <span className="font-semibold text-blue-600">{requiredPlan}</span>.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                <strong>Tu plan actual:</strong> {user?.plan || 'No identificado'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Plan requerido:</strong> {requiredPlan}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={redirectToBilling}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                Actualizar Plan
              </button>
              
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeatureGate;
