import {
  Wrench, Zap, Droplets, Paintbrush, Hammer, TreePine, SprayCan, Sparkles,
  Sofa, AirVent, Bug, Wifi, Smartphone, UtensilsCrossed, Scissors,
  Shirt, Dumbbell, Car, Truck, PawPrint, Home, ShieldCheck, Flower2,
  Baby, BookOpen, Camera, Dog, Fan, Gamepad2, GraduationCap, Guitar,
  Heart, Lightbulb, Lock, Music, Palette, Pill, Pizza, Plug,
  Refrigerator, Ruler, Stethoscope, Sun, Thermometer, Tv, Umbrella,
  Volleyball, Waves, Wind, type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  Wrench, Zap, Droplets, Paintbrush, Hammer, TreePine, SprayCan, Sparkles,
  Sofa, AirVent, Bug, Wifi, Smartphone, UtensilsCrossed, Scissors,
  Shirt, Dumbbell, Car, Truck, PawPrint, Home, ShieldCheck, Flower2,
  Baby, BookOpen, Camera, Dog, Fan, Gamepad2, GraduationCap, Guitar,
  Heart, Lightbulb, Lock, Music, Palette, Pill, Pizza, Plug,
  Refrigerator, Ruler, Stethoscope, Sun, Thermometer, Tv, Umbrella,
  Volleyball, Waves, Wind,
};

export const ICON_NAMES = Object.keys(ICON_MAP);

export const getIcon = (name: string): LucideIcon => ICON_MAP[name] || Wrench;

export const SERVICE_GROUPS = [
  "Para sua Casa",
  "Tecnologia",
  "Alimentação",
  "Pra Você",
  "Para seu Veículo",
  "Mudança",
  "Para seu Pet",
] as const;

export type ServiceGroup = (typeof SERVICE_GROUPS)[number];
