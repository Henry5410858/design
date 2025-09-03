import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { Star, Lightning, Check } from 'phosphor-react';

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  featureName?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  featureName = 'esta función'
}) => {
  const handleUpgrade = () => {
    onUpgrade();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      closeOnOverlayClick={false}
    >
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full flex items-center justify-center mb-6">
          <Star size={32} className="text-white" />
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          ¡Desbloquea más funcionalidades!
        </h2>
        
        {/* Message */}
        <p className="text-neutral-600 mb-8 text-lg">
          ¿Quieres usar {featureName}? Actualiza tu plan actual para acceder a todas las herramientas premium.
        </p>
        
        {/* Features List */}
        <div className="bg-neutral-50 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Lightning size={20} className="text-brand-primary" />
            Funcionalidades incluidas:
          </h3>
          <ul className="space-y-3">
            {[
              'Templates ilimitados',
              'Exportación en alta calidad',
              'Acceso a biblioteca premium',
              'Soporte prioritario',
              'Colaboración en equipo'
            ].map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-neutral-700">
                <Check size={16} className="text-success flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleUpgrade}
            className="flex-1 sm:flex-none"
            leftIcon={<Star size={20} />}
          >
            Actualizar Plan
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={onClose}
            className="flex-1 sm:flex-none"
          >
            Cancelar
          </Button>
        </div>
        
        {/* Additional Info */}
        <p className="text-sm text-neutral-500 mt-6">
          Puedes cancelar tu suscripción en cualquier momento
        </p>
      </div>
    </Modal>
  );
};

export default UpgradeModal;
