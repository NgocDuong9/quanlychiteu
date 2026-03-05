import { 
  Wallet, Utensils, ShoppingBag, Shirt, Sparkles, Users, Heart, GraduationCap, 
  Zap, Car, Smartphone, Home, Banknote, TrendingUp, Gift, Gamepad2, 
  Clapperboard, Plane, Dog, Trophy, Hammer, Coffee, Pizza, Wine, 
  Stethoscope, Book, Bus, Bike, Monitor, Gamepad, Camera, HelpCircle,
  ShoppingBasket, CreditCard, Receipt, Briefcase, UtensilsCrossed, Settings, 
  User, PieChart, Calendar, PenLine, MoreHorizontal, BarChart3
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const iconMap: Record<string, any> = {
  Wallet, Utensils, ShoppingBag, Shirt, Sparkles, Users, Heart, GraduationCap, 
  Zap, Car, Smartphone, Home, Banknote, TrendingUp, Gift, Gamepad2, 
  Clapperboard, Plane, Dog, Trophy, Hammer, Coffee, Pizza, Wine, 
  Stethoscope, Book, Bus, Bike, Monitor, Gamepad, Camera,
  ShoppingBasket, CreditCard, Receipt, Briefcase, UtensilsCrossed, Settings, 
  User, PieChart, Calendar, PenLine, MoreHorizontal, BarChart3
};

// Mapping from old emojis to Lucide icon names for backward compatibility
const emojiToNameMap: Record<string, string> = {
  '💸': 'Wallet',
  '🍽️': 'Utensils',
  '🧴': 'ShoppingBag',
  '👕': 'Shirt',
  '💄': 'Sparkles',
  '🥂': 'Users',
  '💊': 'Heart',
  '📚': 'GraduationCap',
  '⚡': 'Zap',
  '🚗': 'Car',
  '📱': 'Smartphone',
  '🏠': 'Home',
  '💰': 'Banknote',
  '📈': 'TrendingUp',
  '🎁': 'Gift',
  '🎮': 'Gamepad2',
  '🎬': 'Clapperboard',
  '✈️': 'Plane',
  '🐶': 'Dog',
  '🏀': 'Trophy',
  '🛠️': 'Hammer'
};

interface IconProps extends LucideProps {
  name: string;
}

export const ALL_ICONS = Object.keys(iconMap);

export const Icon = ({ name, ...props }: IconProps) => {
  const iconName = emojiToNameMap[name] || name;
  const LucideIcon = iconMap[iconName];
  
  if (!LucideIcon) {
    // Fallback to a default icon if name is invalid
    return <HelpCircle {...props} />;
  }

  return <LucideIcon {...props} />;
};
