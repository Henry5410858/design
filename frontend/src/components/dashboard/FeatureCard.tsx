import { ReactNode } from 'react';

type FeatureCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  locked?: boolean;
  onClick?: () => void;
};

export default function FeatureCard({ title, description, icon, locked, onClick }: FeatureCardProps) {
  return (
    <div
      className={`relative bg-gray-800/50 backdrop-blur-sm border border-[#31dFC5]/30 rounded-lg p-6 flex flex-col items-start shadow-lg transition hover:shadow-xl cursor-pointer ${locked ? 'opacity-60 pointer-events-none' : ''}`}
      onClick={locked ? undefined : onClick}
    >
      <div className="text-3xl mb-2 text-[#31dFC5]">{icon}</div>
      <h3 className="font-semibold text-lg mb-1 text-white">{title}</h3>
      <p className="text-gray-300 text-sm">{description}</p>
      {locked && (
        <div className="absolute inset-0 bg-gray-800/80 flex items-center justify-center rounded-lg z-10">
          <span className="text-sm font-semibold text-[#31dFC5]">Exclusive Feature – Upgrade Your Plan</span>
        </div>
      )}
    </div>
  );
}
