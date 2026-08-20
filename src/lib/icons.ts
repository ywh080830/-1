/**
 * SVG 图标注册表 · 06-系统设计 §7.1
 * categories.icon（数据库种子值）↔ Lucide 组件 一一对应
 * 全站真实 SVG（lucide-react），禁 emoji；未命中回退 MoreHorizontal
 */
import {
  Activity,
  BedDouble,
  BookOpen,
  Briefcase,
  Building2,
  Bus,
  Car,
  CarTaxiFront,
  Clapperboard,
  Coffee,
  Crown,
  Dumbbell,
  FileText,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Key,
  Moon,
  MoreHorizontal,
  Pill,
  Plane,
  Plus,
  Presentation,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Sofa,
  SprayCan,
  Stethoscope,
  Ticket,
  TrendingUp,
  Utensils,
  UtensilsCrossed,
  Wallet,
  Wine,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/** 分类图标注册表（key = categories.icon 存值） */
export const iconRegistry: Record<string, LucideIcon> = {
  'utensils': Utensils,
  'utensils-crossed': UtensilsCrossed,
  'car': Car,
  'bus': Bus,
  'taxi': CarTaxiFront,
  'fuel': Fuel,
  'plane': Plane,
  'shopping-bag': ShoppingBag,
  'shopping-basket': ShoppingBasket,
  'shirt': Shirt,
  'smartphone': Smartphone,
  'spray-can': SprayCan,
  'home': Home,
  'zap': Zap,
  'building-2': Building2,
  'key': Key,
  'sofa': Sofa,
  'heart-pulse': HeartPulse,
  'pill': Pill,
  'stethoscope': Stethoscope,
  'activity': Activity,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  'presentation': Presentation,
  'file-text': FileText,
  'gamepad-2': Gamepad2,
  'clapperboard': Clapperboard,
  'dumbbell': Dumbbell,
  'crown': Crown,
  'gift': Gift,
  'present': Gift,
  'wine': Wine,
  'bed-double': BedDouble,
  'ticket': Ticket,
  'wallet': Wallet,
  'briefcase': Briefcase,
  'trending-up': TrendingUp,
  'plus': Plus,
  'more-horizontal': MoreHorizontal,
  'moon': Moon,
  'coffee': Coffee,
};

/** 供其他模块引用（避免未使用告警） */
export { MoreHorizontal };

/** 取图标组件（未注册回退 MoreHorizontal） */
export function getIcon(name: string | null | undefined): LucideIcon {
  if (name && iconRegistry[name]) return iconRegistry[name];
  return MoreHorizontal;
}

/** 注册表名称集合（校验 categories.icon 种子一致性用） */
export const iconNames: string[] = Object.keys(iconRegistry);
