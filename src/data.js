import {
  Home as HomeIcon, Zap, Lightbulb, Droplet, Flame, Wifi, Smartphone, Shield, HeartPulse,
  Landmark, CreditCard, Repeat, Tv, Dumbbell, GraduationCap, Baby, Receipt, PiggyBank,
  ShoppingCart, Utensils, Coffee, Pizza, Cookie, Bus, Fuel, Car, Train, Bike, Wrench,
  Film, Gamepad2, Book, Music, ShoppingBag, Shirt, Laptop, Sofa, Package, Sparkles,
  Scissors, Palette, Stethoscope, Pill, Smile, Activity, Trophy, Plane, Hotel, Gift,
  Heart, PawPrint, Bone, Hammer, Flower2, Pencil, Wine, PartyPopper, Camera, MoreHorizontal
} from 'lucide-react';

export const INITIAL_USERS = [
  { id: 'u1', name: 'Dushman', currency: 'LKR', color: 'bg-blue-500', lightColor: 'bg-blue-100', text: 'text-blue-500' },
  { id: 'u2', name: 'Hasini', currency: 'CNY', color: 'bg-rose-500', lightColor: 'bg-rose-100', text: 'text-rose-500' }
];

export const CATEGORIES = [
  // Fixed
  { id: 'rent', name: 'Rent/Mortgage', icon: HomeIcon, type: 'Fixed' },
  { id: 'utilities', name: 'Utilities', icon: Zap, type: 'Fixed' },
  { id: 'electricity', name: 'Electricity', icon: Lightbulb, type: 'Fixed' },
  { id: 'water', name: 'Water', icon: Droplet, type: 'Fixed' },
  { id: 'gas', name: 'Gas', icon: Flame, type: 'Fixed' },
  { id: 'internet', name: 'Internet', icon: Wifi, type: 'Fixed' },
  { id: 'mobile', name: 'Mobile Phone', icon: Smartphone, type: 'Fixed' },
  { id: 'insurance', name: 'Insurance', icon: Shield, type: 'Fixed' },
  { id: 'health-insurance', name: 'Health Insurance', icon: HeartPulse, type: 'Fixed' },
  { id: 'loan', name: 'Loan Payment', icon: Landmark, type: 'Fixed' },
  { id: 'credit-card', name: 'Credit Card Payment', icon: CreditCard, type: 'Fixed' },
  { id: 'subscriptions', name: 'Subscriptions', icon: Repeat, type: 'Fixed' },
  { id: 'streaming', name: 'Streaming Services', icon: Tv, type: 'Fixed' },
  { id: 'gym', name: 'Gym Membership', icon: Dumbbell, type: 'Fixed' },
  { id: 'education', name: 'Education', icon: GraduationCap, type: 'Fixed' },
  { id: 'childcare', name: 'Childcare', icon: Baby, type: 'Fixed' },
  { id: 'taxes', name: 'Taxes', icon: Receipt, type: 'Fixed' },
  { id: 'savings-deposit', name: 'Savings Deposit', icon: PiggyBank, type: 'Fixed' },
  // Variable
  { id: 'groceries', name: 'Groceries', icon: ShoppingCart, type: 'Variable' },
  { id: 'dining', name: 'Dining Out', icon: Utensils, type: 'Variable' },
  { id: 'coffee', name: 'Coffee & Tea', icon: Coffee, type: 'Variable' },
  { id: 'fast-food', name: 'Fast Food', icon: Pizza, type: 'Variable' },
  { id: 'snacks', name: 'Snacks', icon: Cookie, type: 'Variable' },
  { id: 'transport', name: 'Transport', icon: Bus, type: 'Variable' },
  { id: 'fuel', name: 'Fuel', icon: Fuel, type: 'Variable' },
  { id: 'taxi', name: 'Taxi / Ride Hailing', icon: Car, type: 'Variable' },
  { id: 'train', name: 'Train / Metro', icon: Train, type: 'Variable' },
  { id: 'bike', name: 'Bike', icon: Bike, type: 'Variable' },
  { id: 'car-maintenance', name: 'Vehicle Maintenance', icon: Wrench, type: 'Variable' },
  { id: 'movies', name: 'Movies & Shows', icon: Film, type: 'Variable' },
  { id: 'games', name: 'Games', icon: Gamepad2, type: 'Variable' },
  { id: 'books', name: 'Books', icon: Book, type: 'Variable' },
  { id: 'music', name: 'Music', icon: Music, type: 'Variable' },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag, type: 'Variable' },
  { id: 'clothing', name: 'Clothing', icon: Shirt, type: 'Variable' },
  { id: 'electronics', name: 'Electronics', icon: Laptop, type: 'Variable' },
  { id: 'furniture', name: 'Furniture', icon: Sofa, type: 'Variable' },
  { id: 'home-supplies', name: 'Home Supplies', icon: Package, type: 'Variable' },
  { id: 'personal-care', name: 'Personal Care', icon: Sparkles, type: 'Variable' },
  { id: 'haircut', name: 'Haircut & Salon', icon: Scissors, type: 'Variable' },
  { id: 'cosmetics', name: 'Cosmetics', icon: Palette, type: 'Variable' },
  { id: 'health', name: 'Health & Doctor', icon: Stethoscope, type: 'Variable' },
  { id: 'pharmacy', name: 'Pharmacy', icon: Pill, type: 'Variable' },
  { id: 'dental', name: 'Dental', icon: Smile, type: 'Variable' },
  { id: 'fitness', name: 'Fitness & Wellness', icon: Activity, type: 'Variable' },
  { id: 'sports', name: 'Sports', icon: Trophy, type: 'Variable' },
  { id: 'travel', name: 'Travel', icon: Plane, type: 'Variable' },
  { id: 'hotel', name: 'Hotel & Stay', icon: Hotel, type: 'Variable' },
  { id: 'gifts', name: 'Gifts', icon: Gift, type: 'Variable' },
  { id: 'charity', name: 'Charity & Donations', icon: Heart, type: 'Variable' },
  { id: 'pets', name: 'Pets', icon: PawPrint, type: 'Variable' },
  { id: 'pet-food', name: 'Pet Food & Vet', icon: Bone, type: 'Variable' },
  { id: 'laundry', name: 'Laundry', icon: Droplet, type: 'Variable' },
  { id: 'repairs', name: 'Repairs', icon: Hammer, type: 'Variable' },
  { id: 'garden', name: 'Garden', icon: Flower2, type: 'Variable' },
  { id: 'stationery', name: 'Stationery', icon: Pencil, type: 'Variable' },
  { id: 'alcohol', name: 'Drinks & Alcohol', icon: Wine, type: 'Variable' },
  { id: 'party', name: 'Party & Events', icon: PartyPopper, type: 'Variable' },
  { id: 'photography', name: 'Photography', icon: Camera, type: 'Variable' },
  { id: 'other', name: 'Other', icon: MoreHorizontal, type: 'Variable' }
];

// All real data lives in Supabase — these are just empty starting points
// used before the first sync (or when the database is not configured).
export const INITIAL_EXPENSES = [];

export const INITIAL_TODOS = [];

export const INITIAL_PLAN = {};

export const INITIAL_GOAL = { target: 0, current: 0, name: 'Set your savings goal' };

// "2026-07-01" -> "July 2026"
export const monthLabel = (isoDate) => {
  const [year, month] = isoDate.split('-');
  return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
