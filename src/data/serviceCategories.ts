import {
  Zap, Droplets, Paintbrush, Hammer, TreePine, SprayCan, Sparkles,
  Sofa, AirVent, Bug, Wifi, Smartphone, UtensilsCrossed, Scissors,
  Shirt, Dumbbell, Car, Truck, PawPrint, LucideIcon,
} from "lucide-react";

export interface ServiceItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

export interface ServiceCategory {
  group: string;
  items: ServiceItem[];
}

export const serviceCategories: ServiceCategory[] = [
  {
    group: "Para sua Casa",
    items: [
      { label: "Eletricista", icon: Zap, path: "/morador/servicos?q=Eletricista" },
      { label: "Encanador", icon: Droplets, path: "/morador/servicos?q=Encanador" },
      { label: "Pintura", icon: Paintbrush, path: "/morador/servicos?q=Pintura" },
      { label: "Reparos", icon: Hammer, path: "/morador/servicos?q=Reparos" },
      { label: "Jardinagem", icon: TreePine, path: "/morador/servicos?q=Jardinagem" },
      { label: "Faxina", icon: SprayCan, path: "/morador/servicos?q=Faxina" },
      { label: "Limpeza", icon: Sparkles, path: "/morador/servicos?q=Limpeza" },
      { label: "Móveis", icon: Sofa, path: "/morador/servicos?q=Móveis" },
      { label: "Ar Cond.", icon: AirVent, path: "/morador/servicos?q=Ar Condicionado" },
      { label: "Dedetização", icon: Bug, path: "/morador/servicos?q=Dedetização" },
    ],
  },
  {
    group: "Tecnologia",
    items: [
      { label: "Internet", icon: Wifi, path: "/morador/servicos?q=Internet" },
      { label: "Eletrônicos", icon: Smartphone, path: "/morador/servicos?q=Eletrônicos" },
    ],
  },
  {
    group: "Alimentação",
    items: [
      { label: "Confeitaria", icon: UtensilsCrossed, path: "/morador/servicos?q=Confeitaria" },
      { label: "Marmitas", icon: UtensilsCrossed, path: "/morador/servicos?q=Marmitas" },
    ],
  },
  {
    group: "Pra Você",
    items: [
      { label: "Costura", icon: Scissors, path: "/morador/servicos?q=Costura" },
      { label: "Lavanderia", icon: Shirt, path: "/morador/servicos?q=Lavanderia" },
      { label: "Personal", icon: Dumbbell, path: "/morador/servicos?q=Personal" },
    ],
  },
  {
    group: "Para seu Veículo",
    items: [
      { label: "Mecânico", icon: Car, path: "/morador/servicos?q=Mecânico" },
      { label: "Lavagem", icon: Car, path: "/morador/servicos?q=Lavagem" },
    ],
  },
  {
    group: "Mudança",
    items: [
      { label: "Mudança", icon: Truck, path: "/morador/servicos?q=Mudança" },
      { label: "Carreto", icon: Truck, path: "/morador/servicos?q=Carreto" },
    ],
  },
  {
    group: "Para seu Pet",
    items: [
      { label: "Pet Shop", icon: PawPrint, path: "/morador/servicos?q=Pet Shop" },
      { label: "Dog Walker", icon: PawPrint, path: "/morador/servicos?q=Dog Walker" },
    ],
  },
];

export const allServiceItems = serviceCategories.flatMap((c) => c.items);
