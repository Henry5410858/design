import React from 'react';
import * as PhosphorIcons from 'phosphor-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, className = '', onClick }) => {
  // Map icon names to phosphor-react icons
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    // Navigation and UI
    'home': PhosphorIcons.House,
    'dashboard': PhosphorIcons.SquaresFour,
    'templates': PhosphorIcons.SquaresFour,
    'editor': PhosphorIcons.Pencil,
    'brand-kit': PhosphorIcons.Palette,
    'settings': PhosphorIcons.Gear,
    'profile': PhosphorIcons.User,
    'logout': PhosphorIcons.SignOut,
    
    // Actions
    'save': PhosphorIcons.FloppyDisk,
    'download': PhosphorIcons.Download,
    'upload': PhosphorIcons.Upload,
    'edit': PhosphorIcons.Pencil,
    'edit-pencil': PhosphorIcons.Pencil,
    'delete': PhosphorIcons.Trash,
    'copy': PhosphorIcons.Copy,
    'share': PhosphorIcons.Share,
    'add': PhosphorIcons.Plus,
    'close': PhosphorIcons.X,
    'check': PhosphorIcons.Check,
    'cancel': PhosphorIcons.X,
    
    // Design tools
    'text': PhosphorIcons.TextT,
    'image': PhosphorIcons.Image,
    'shape': PhosphorIcons.Square,
    'line': PhosphorIcons.LineSegment,
    'paint': PhosphorIcons.PaintBrush,
    'droplet': PhosphorIcons.Drop,
    'rotate-left': PhosphorIcons.ArrowCounterClockwise,
    'rotate-right': PhosphorIcons.ArrowClockwise,
    
    // Media and content
    'gallery': PhosphorIcons.SquaresFour,
    'filter': PhosphorIcons.Funnel,
    'search': PhosphorIcons.MagnifyingGlass,
    'grid': PhosphorIcons.GridFour,
    'list': PhosphorIcons.List,
    'calendar': PhosphorIcons.Calendar,
    'file': PhosphorIcons.File,
    'folder': PhosphorIcons.Folder,
    
    // Social and communication
    'mail': PhosphorIcons.Envelope,
    'phone': PhosphorIcons.Phone,
    'chat': PhosphorIcons.ChatCircle,
    'notification': PhosphorIcons.Bell,
    
    // Business and finance
    'star': PhosphorIcons.Star,
    'zap': PhosphorIcons.Lightning,
    'dollar': PhosphorIcons.CurrencyDollar,
    'chart': PhosphorIcons.ChartLine,
    
    // Layout and structure
    'menu': PhosphorIcons.List,
    'sidebar': PhosphorIcons.Sidebar,
    'topbar': PhosphorIcons.Rows,
    'arrow-right': PhosphorIcons.ArrowRight,
    'arrow-left': PhosphorIcons.ArrowLeft,
    'arrow-up': PhosphorIcons.ArrowUp,
    'arrow-down': PhosphorIcons.ArrowDown,
    
    // Technology
    'smartphone': PhosphorIcons.DeviceMobile,
    'monitor': PhosphorIcons.Monitor,
    'laptop': PhosphorIcons.Laptop,
    'tablet': PhosphorIcons.DeviceTablet,
    
    // Creative and design
    'palette': PhosphorIcons.Palette,
    'brush': PhosphorIcons.PaintBrush,
    'camera': PhosphorIcons.Camera,
    'video': PhosphorIcons.VideoCamera,
    'music': PhosphorIcons.MusicNote,
    'book': PhosphorIcons.BookOpen,
    
    // Default fallback
    'default': PhosphorIcons.Circle
  };

  const IconComponent = iconMap[name] || iconMap['default'];
  
  return (
    <IconComponent
      size={size}
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  );
};

export default Icon;
