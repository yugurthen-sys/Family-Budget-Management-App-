/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Download,
  Calendar,
  X,
  Palette,
  LogOut,
  Plus,
  Trash2,
  TrendingUp,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Home,
  Zap,
  ShoppingBag,
  Store,
  Phone,
  Gift,
  User as UserIcon,
  Users,
  GraduationCap,
  Sparkles,
  Stethoscope,
  Shirt,
  AlertTriangle,
  FileText,
  Wrench,
  Fuel,
  PartyPopper,
  School,
  Sun,
  Plane,
  Heart,
  LayoutDashboard,
  Wallet,
  Settings,
  Menu,
  ChevronLeft,
  Loader2,
  LogIn,
  Receipt,
  PieChart as PieChartIcon,
  ArrowUpCircle,
  ArrowDownCircle,
  Tags,
  SortAsc,
  SortDesc,
  DollarSign,
  Type,
  Car
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db, auth, signIn, signOut } from './lib/firebase';
import { BudgetItem, Category, Frequency, FREQUENCIES, getMonthlyEquivalent, getAnnualEquivalent, OperationType, FirestoreErrorInfo, Currency, CURRENCY_CONFIG, formatCurrency } from './types';
import { DEFAULT_FIXED_EXPENSES, FAMILY_EXPENSES, TRANSPORTATION_EXPENSES, OCCASIONAL_EXPENSES } from './constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type View = 'dashboard' | 'income' | 'expenses' | 'categories';
type SortField = 'label' | 'amount' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

const ICON_MAP: Record<string, React.ReactNode> = {
  'Housing': <Home size={20} />,
  'Electricity': <Zap size={20} />,
  'Groceries': <ShoppingBag size={20} />,
  'Market': <Store size={20} />,
  'Phone & Internet': <Phone size={20} />,
  'Wife’s allowance': <Heart size={20} />,
  'Husband’s allowance': <UserIcon size={20} />,
  'Children pocket money': <Users size={20} />,
  'Parents duty': <Users size={20} />,
  'Charity': <Gift size={20} />,
  'Children tutoring': <GraduationCap size={20} />,
  'Doctor visits': <Stethoscope size={20} />,
  'Clothes': <Shirt size={20} />,
  'Emergency': <AlertTriangle size={20} />,
  'Annual Tax': <FileText size={20} />,
  'Technical visit': <Wrench size={20} />,
  'Gas': <Fuel size={20} />,
  'Other Transportation': <Car size={20} />,
  'Celebrations': <PartyPopper size={20} />,
  'School entry': <School size={20} />,
  'Summer vacation': <Sun size={20} />,
  'Trips & travel': <Plane size={20} />,
};

interface CategoryCardProps {
  key?: string | number;
  cat: Category;
  onUpdate: (id: string, updates: Partial<Category>) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

function CategoryCard({ cat, onUpdate, onDelete }: CategoryCardProps) {
  const icon = ICON_MAP[cat.name] || <Palette size={20} />;
  
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-50 flex flex-col gap-6 group hover:translate-y-[-4px] transition-all duration-300">
      <div className="flex items-start justify-between">
        <div 
          className="w-14 h-14 rounded-2xl shadow-inner flex items-center justify-center text-white transition-transform group-hover:scale-110 duration-500"
          style={{ backgroundColor: cat.color }}
        >
          {icon}
        </div>
        <button 
          onClick={() => onDelete(cat.id)}
          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="space-y-1">
        <input 
          type="text"
          value={cat.name}
          onChange={(e) => onUpdate(cat.id, { name: e.target.value })}
          className="w-full font-black text-lg text-gray-900 border-none focus:ring-0 focus:outline-none p-0 bg-transparent"
        />
        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Category Name</p>
      </div>
      
      <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
        <div className="flex gap-1.5 flex-wrap">
          {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#06b6d4', '#14b8a6', '#f43f5e'].map(c => (
            <button 
              key={c}
              onClick={() => onUpdate(cat.id, { color: c })}
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-all hover:scale-125",
                cat.color === c ? "border-gray-900 scale-110" : "border-white"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ExportModal({ isOpen, onClose, items, currency }: { isOpen: boolean, onClose: () => void, items: BudgetItem[], currency: Currency }) {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleExport = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filtered = items.filter(item => {
      const date = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
      return date >= start && date <= end;
    });

    const csvRows = [
      ['Date', 'Type', 'Category', 'Description', 'Amount', 'Frequency', 'Monthly Equivalent', 'Currency'],
      ...filtered.map(item => {
        const date = item.createdAt.toDate ? item.createdAt.toDate().toLocaleDateString() : new Date(item.createdAt).toLocaleDateString();
        const monthly = getMonthlyEquivalent(item.amount, item.frequency);
        return [
          date,
          item.category,
          item.category === 'income' ? 'Income' : 'Expense',
          item.name,
          item.amount.toFixed(2),
          item.frequency,
          monthly.toFixed(2),
          currency
        ];
      })
    ];

    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `budget_export_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Download size={20} />
            </div>
            Export Data
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20} /></button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Start Date</label>
            <div className="relative">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 focus:outline-none font-bold text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">End Date</label>
            <div className="relative">
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 focus:outline-none font-bold text-gray-900"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={handleExport}
              className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3"
            >
              <Download size={20} />
              Download CSV Report
            </button>
            <button 
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-600 font-black py-5 rounded-2xl hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Filter and Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Auth Status
  useEffect(() => {
    (window as any)._setIsExportOpen = setIsExportModalOpen;
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  // Sync with Firestore
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    const q = query(
      collection(db, 'budgetItems'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BudgetItem[];
      setItems(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'budgetItems');
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Categories
  useEffect(() => {
    if (!user) {
      setCategories([]);
      return;
    }

    const q = query(collection(db, 'categories'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });

    return () => unsubscribe();
  }, [user]);

  // Stats calculation
  const stats = useMemo(() => {
    const rate = CURRENCY_CONFIG[currency].rate;
    const incomes = items.filter(i => i.category === 'income');
    const expenses = items.filter(i => i.category !== 'income');

    const monthlyIncome = incomes.reduce((acc, curr) => acc + getMonthlyEquivalent(curr.amount * rate, curr.frequency), 0);
    const monthlyExpense = expenses.reduce((acc, curr) => acc + getMonthlyEquivalent(curr.amount * rate, curr.frequency), 0);
    const monthlySavings = monthlyIncome - monthlyExpense;

    return {
      monthlyIncome,
      monthlyExpense,
      monthlySavings,
      annualIncome: monthlyIncome * 12,
      annualExpense: monthlyExpense * 12,
      annualSavings: monthlySavings * 12,
      expenseDetails: (() => {
        const getGroupValue = (names: string[]) => {
          const catIds = categories.filter(c => names.includes(c.name)).map(c => c.id);
          return expenses
            .filter(e => e.categoryId && catIds.includes(e.categoryId))
            .reduce((acc, curr) => acc + getMonthlyEquivalent(curr.amount * rate, curr.frequency), 0);
        };

        const details = categories.map(cat => ({
          name: cat.name,
          color: cat.color,
          value: expenses
            .filter(e => e.categoryId === cat.id)
            .reduce((acc, curr) => acc + getMonthlyEquivalent(curr.amount * rate, curr.frequency), 0)
        })).filter(d => d.value > 0);

        const familyDetails = FAMILY_EXPENSES.map(name => {
          const cat = categories.find(c => c.name === name);
          return {
            name,
            color: cat?.color || COLORS[0],
            value: expenses
              .filter(e => e.categoryId === cat?.id)
              .reduce((acc, curr) => acc + getMonthlyEquivalent(curr.amount * rate, curr.frequency), 0)
          };
        }).filter(d => d.value > 0);

        const transportationDetails = TRANSPORTATION_EXPENSES.map(name => {
          const cat = categories.find(c => c.name === name);
          return {
            name,
            color: cat?.color || COLORS[0],
            value: expenses
              .filter(e => e.categoryId === cat?.id)
              .reduce((acc, curr) => acc + getMonthlyEquivalent(curr.amount * rate, curr.frequency), 0)
          };
        }).filter(d => d.value > 0);

        const uncategorizedValue = expenses
          .filter(e => !e.categoryId)
          .reduce((acc, curr) => acc + getMonthlyEquivalent(curr.amount * rate, curr.frequency), 0);

        if (uncategorizedValue > 0) {
          details.push({
            name: 'Uncategorized',
            color: '#94a3b8',
            value: uncategorizedValue
          });
        }

        return {
          all: details.length > 0 ? details : expenses.map(e => ({
            name: e.name,
            color: COLORS[0],
            value: getMonthlyEquivalent(e.amount * rate, e.frequency)
          })),
          family: familyDetails,
          transportation: transportationDetails
        };
      })()
    };
  }, [items, currency, categories]);

  const addCategory = async () => {
    if (!user) return;
    try {
      const docRef = doc(collection(db, 'categories'));
      await setDoc(docRef, {
        name: 'New Category',
        color: '#3b82f6',
        userId: user.uid
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'categories');
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      await updateDoc(doc(db, 'categories', id), updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `categories/${id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `categories/${id}`);
    }
  };

  const seedDefaultCategories = async () => {
    if (!user) return;
    try {
      const allDefaults = [
        ...DEFAULT_FIXED_EXPENSES.map(n => ({ name: n, group: 'Fixed' })),
        ...FAMILY_EXPENSES.map(n => ({ name: n, group: 'Family' })),
        ...TRANSPORTATION_EXPENSES.map(n => ({ name: n, group: 'Transportation' })),
        ...OCCASIONAL_EXPENSES.map(n => ({ name: n, group: 'Occasional' }))
      ];

      const existingNames = new Set(categories.map(c => c.name));
      const toAdd = allDefaults.filter(item => !existingNames.has(item.name));

      if (toAdd.length === 0) return;

      const batch: Promise<any>[] = toAdd.map((item, index) => 
        addDoc(collection(db, 'categories'), {
          name: item.name,
          color: COLORS[index % COLORS.length],
          userId: user.uid
        })
      );

      await Promise.all(batch);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    }
  };

  const seedDefaultExpenses = async () => {
    if (!user) return;
    try {
      const existingNames = new Set(items.filter(i => i.category === 'fixed-expense').map(i => i.name));
      const toAdd = DEFAULT_FIXED_EXPENSES.filter(name => !existingNames.has(name));

      if (toAdd.length === 0) return;

      const batch: Promise<any>[] = toAdd.map(name => 
        addDoc(collection(db, 'budgetItems'), {
          name,
          amount: 0,
          frequency: 'monthly',
          category: 'fixed-expense',
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      );

      await Promise.all(batch);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'budgetItems');
    }
  };

  const addItem = async (category: BudgetItem['category']) => {
    if (!user) return;
    try {
      let defaultName = 'New Item';
      if (category === 'income') {
        const incomeCount = items.filter(i => i.category === 'income').length;
        defaultName = incomeCount < 2 ? `Salary ${incomeCount + 1}` : `Other Income ${incomeCount - 1}`;
      } else if (category === 'fixed-expense') {
        const fixedCount = items.filter(i => i.category === 'fixed-expense').length;
        defaultName = DEFAULT_FIXED_EXPENSES[fixedCount] || 'New Fixed Expense';
      } else {
        const occasionalCount = items.filter(i => i.category === 'occasional-expense').length;
        defaultName = OCCASIONAL_EXPENSES[occasionalCount] || 'New Occasional Expense';
      }

      await addDoc(collection(db, 'budgetItems'), {
        name: defaultName,
        amount: 0,
        frequency: 'monthly',
        category,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'budgetItems');
    }
  };

  const updateItem = async (id: string, updates: Partial<BudgetItem>) => {
    try {
      const itemRef = doc(db, 'budgetItems', id);
      await updateDoc(itemRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `budgetItems/${id}`);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'budgetItems', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `budgetItems/${id}`);
    }
  };

  const getFilteredAndSortedItems = (category: BudgetItem['category'] | 'all-expenses') => {
    let filtered = items.filter(item => {
      if (category === 'all-expenses') {
        return item.category !== 'income';
      }
      return item.category === category;
    });

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'label') { // Internal logic uses 'label' but checks .name
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'createdAt') {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        comparison = dateA - dateB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const chartData = [
    {
      name: 'Budget Summary',
      Income: stats.monthlyIncome,
      Expenses: stats.monthlyExpense,
      Savings: stats.monthlySavings,
    }
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-12 rounded-3xl shadow-xl shadow-blue-100 max-w-md w-full text-center space-y-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-4xl font-black">M</div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Mizania</h1>
            <p className="text-gray-500">Log in to manage your family budget securely with cloud sync.</p>
          </div>
          <button 
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all transform active:scale-95"
          >
            <LogIn size={20} />
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans" dir="ltr">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r transition-all duration-300 flex flex-col shadow-sm z-20",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between border-b">
          <div className={cn("flex items-center gap-3", !isSidebarOpen && "hidden")}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
            <span className="font-bold text-xl tracking-tight">Mizania</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-gray-100 rounded-md"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={view === 'dashboard'} 
            collapsed={!isSidebarOpen}
            onClick={() => setView('dashboard')}
          />
          <NavItem 
            icon={<Wallet size={20} />} 
            label="Income" 
            active={view === 'income'} 
            collapsed={!isSidebarOpen}
            onClick={() => setView('income')}
          />
          <NavItem 
            icon={<Receipt size={20} />} 
            label="Expenses" 
            active={view === 'expenses'} 
            collapsed={!isSidebarOpen}
            onClick={() => setView('expenses')}
          />
          <NavItem 
            icon={<Tags size={20} />} 
            label="Categories" 
            active={view === 'categories'} 
            collapsed={!isSidebarOpen}
            onClick={() => setView('categories')}
          />
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-4">
          <div className={cn("bg-blue-50 p-4 rounded-xl", !isSidebarOpen && "hidden")}>
            <p className="text-xs text-blue-600 font-medium mb-1">Monthly Savings</p>
            <p className="text-lg font-bold text-blue-900">{formatCurrency(stats.monthlySavings, currency)}</p>
          </div>
          
          <button 
            onClick={signOut}
            className={cn(
              "flex items-center gap-3 text-red-500 hover:bg-red-50 w-full rounded-xl transition-colors",
              !isSidebarOpen ? "p-3 justify-center" : "px-4 py-3"
            )}
          >
            <LogOut size={20} />
            {!isSidebarOpen ? null : <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden text-left bg-gray-50">
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-800">
              {view === 'dashboard' && 'Dashboard Overview'}
              {view === 'income' && 'Income Management'}
              {view === 'expenses' && 'Expense Management'}
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Family Budget Tracker</p>
          </div>
          
          <div className="flex gap-4 items-center">
             <button 
                onClick={() => setIsExportModalOpen(true)}
                className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                title="Export Data"
              >
                <Download size={20} />
              </button>
             <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-600">
               <span className="opacity-50">Currency:</span>
               <select 
                 value={currency}
                 onChange={(e) => setCurrency(e.target.value as Currency)}
                 className="bg-transparent border-none focus:ring-0 cursor-pointer text-blue-600"
               >
                 <option value="USD">USD ($)</option>
                 <option value="EUR">EUR (€)</option>
                 <option value="MAD">MAD (DH)</option>
               </select>
             </div>
             <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-600">
               <span className="opacity-50">Period:</span>
               <select className="bg-transparent border-none focus:ring-0 cursor-pointer">
                 <option>May 2026</option>
                 <option>June 2026</option>
               </select>
             </div>
             <img src={user.photoURL || ''} alt="profile" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {view === 'dashboard' && (
                <div className="space-y-8">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                      title="Total Monthly Income" 
                      value={stats.monthlyIncome} 
                      currency={currency}
                      icon={<ArrowUpCircle className="text-blue-500" />}
                      trend="Net Inflow"
                    />
                    <StatCard 
                      title="Total Monthly Expenses" 
                      value={stats.monthlyExpense} 
                      currency={currency}
                      icon={<ArrowDownCircle className="text-red-500" />}
                      trend="Fixed & Occasional"
                    />
                    <StatCard 
                      title="Projected Savings" 
                      value={stats.monthlySavings} 
                      currency={currency}
                      icon={<TrendingUp className="text-green-500" />}
                      trend="Budget Surplus"
                      highlight
                    />
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 underline decoration-blue-500 underline-offset-8">
                        <TrendingUp size={18} className="text-blue-600" />
                        Monthly Comparison ({CURRENCY_CONFIG[currency].symbol})
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" hide />
                            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip 
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                            />
                            <Legend iconType="circle" />
                            <Bar dataKey="Income" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                            <Bar dataKey="Expenses" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40} />
                            <Bar dataKey="Savings" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 underline decoration-purple-500 underline-offset-8">
                        <PieChartIcon size={18} className="text-purple-600" />
                        Expense Distribution
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.expenseDetails.all.filter(d => d.value > 0).slice(0, 10)}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={100}
                              innerRadius={60}
                              paddingAngle={5}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {stats.expenseDetails.all.map((entry: any, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              formatter={(value: number) => formatCurrency(value, currency)}
                            />
                            <Legend iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Specific Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 underline decoration-green-500 underline-offset-8">
                        <Users size={18} className="text-green-600" />
                        Family Expenses ({CURRENCY_CONFIG[currency].symbol})
                      </h3>
                      <div className="h-64">
                         {stats.expenseDetails.family.length > 0 ? (
                           <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={stats.expenseDetails.family} layout="vertical">
                               <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                               <XAxis type="number" hide />
                               <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                               <Tooltip 
                                 cursor={{ fill: '#f8fafc' }}
                                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                               />
                               <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} barSize={20} />
                             </BarChart>
                           </ResponsiveContainer>
                         ) : (
                           <div className="h-full flex items-center justify-center text-gray-400 text-sm">No family expenses tracked yet.</div>
                         )}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 underline decoration-orange-500 underline-offset-8">
                        <Car size={18} className="text-orange-600" />
                        Transportation costs ({CURRENCY_CONFIG[currency].symbol})
                      </h3>
                      <div className="h-64">
                        {stats.expenseDetails.transportation.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={stats.expenseDetails.transportation}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {stats.expenseDetails.transportation.map((entry: any, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                              <Legend iconType="circle" />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400 text-sm">No transportation data tracked yet.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Annual Summary */}
                  <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-[2rem] p-12 text-white shadow-2xl shadow-blue-200/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
                      <div className="text-center lg:text-left space-y-2">
                        <h2 className="text-xl opacity-80 font-medium">Annual Projections</h2>
                        <p className="text-6xl font-black tracking-tighter leading-tight">Yearly Budget<br />Simulation</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full lg:w-auto bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase opacity-70 block tracking-[0.2em] font-bold">Annual Income</span>
                          <span className="text-3xl font-black tabular-nums">{formatCurrency(stats.annualIncome, currency)}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase opacity-70 block tracking-[0.2em] font-bold">Annual Expenses</span>
                          <span className="text-3xl font-black tabular-nums">{formatCurrency(stats.annualExpense, currency)}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase opacity-70 block tracking-[0.2em] font-bold text-green-300">Net Surplus</span>
                          <span className="text-5xl font-black text-green-400 tabular-nums">{formatCurrency(stats.annualSavings, currency)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {view === 'income' && (
                <div className="space-y-6">
                  <SectionHeader 
                    title="Family Income" 
                    subtitle="Track and manage your various revenue streams and salaries."
                    onAdd={() => addItem('income')}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    sortBy={sortBy}
                    onSortByChange={setSortBy}
                    sortOrder={sortOrder}
                    onSortOrderChange={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  />
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-blue-600">
                    <ItemTable 
                      items={getFilteredAndSortedItems('income')} 
                      onUpdate={updateItem} 
                      onDelete={deleteItem} 
                      currency={currency}
                      categories={categories}
                    />
                  </div>
                </div>
              )}

              {view === 'expenses' && (
                <div className="space-y-12">
                  <div className="space-y-6">
                    <SectionHeader 
                      title="Fixed Monthly Costs" 
                      subtitle="Mandatory monthly liabilities like rent, loans, and subscriptions."
                      onAdd={() => addItem('fixed-expense')}
                      onSeed={seedDefaultExpenses}
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      sortBy={sortBy}
                      onSortByChange={setSortBy}
                      sortOrder={sortOrder}
                      onSortOrderChange={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    />
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-red-500">
                      <ItemTable 
                        items={getFilteredAndSortedItems('fixed-expense')} 
                        onUpdate={updateItem} 
                        onDelete={deleteItem} 
                        currency={currency}
                        categories={categories}
                      />
                    </div>
                  </div>

                  <div className="space-y-6 bg-gray-100/50 p-8 rounded-3xl border border-dashed border-gray-200">
                    <SectionHeader 
                      title="Occasional & Seasonal" 
                      subtitle="One-time or periodic expenses such as birthdays or travel."
                      onAdd={() => addItem('occasional-expense')}
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      sortBy={sortBy}
                      onSortByChange={setSortBy}
                      sortOrder={sortOrder}
                      onSortOrderChange={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    />
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-purple-500">
                      <ItemTable 
                        items={getFilteredAndSortedItems('occasional-expense')} 
                        onUpdate={updateItem} 
                        onDelete={deleteItem} 
                        currency={currency}
                        categories={categories}
                      />
                    </div>
                  </div>
                </div>
              )}

              {view === 'categories' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Expense Categories</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage custom categories to better organize your spending.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={seedDefaultCategories}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all text-sm font-bold shadow-sm h-fit"
                      >
                        <TrendingUp size={18} className="text-blue-600" />
                        Load Defaults
                      </button>
                      <button 
                        onClick={addCategory}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all text-sm font-bold shadow-lg shadow-blue-100 h-fit"
                      >
                        <Plus size={18} />
                        Add Category
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categories.map(cat => (
                      <CategoryCard 
                        key={cat.id} 
                        cat={cat} 
                        onUpdate={updateCategory} 
                        onDelete={deleteCategory} 
                      />
                    ))}
                    {categories.length === 0 && (
                      <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-gray-100 rounded-3xl">
                        <Tags className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-400 font-medium">Create your first category to start organizing.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        items={items}
        currency={currency}
      />
    </div>
  );
}

function NavItem({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 transition-all rounded-xl",
        collapsed ? "p-3 justify-center" : "px-4 py-3",
        active 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      <span className={cn(active ? "text-white" : "text-gray-400")}>{icon}</span>
      {!collapsed && <span className="font-medium text-sm">{label}</span>}
    </button>
  );
}

function StatCard({ title, value, icon, trend, highlight, currency }: { title: string, value: number, icon: React.ReactNode, trend: string, highlight?: boolean, currency: Currency }) {
  return (
    <div className={cn(
      "p-6 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]",
      highlight ? "bg-white ring-2 ring-blue-500 ring-offset-2" : "bg-white"
    )}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-black tracking-tight">{formatCurrency(value, currency)}</p>
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{trend}</p>
      </div>
    </div>
  );
}

function SectionHeader({ 
  title, 
  subtitle, 
  onAdd,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onSeed
}: { 
  title: string, 
  subtitle: string, 
  onAdd: () => void,
  searchTerm: string,
  onSearchChange: (val: string) => void,
  sortBy: SortField,
  onSortByChange: (val: SortField) => void,
  sortOrder: SortOrder,
  onSortOrderChange: () => void,
  onSeed?: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => (window as any)._setIsExportOpen(true)}
              className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm"
              title="Export to CSV"
            >
              <Download size={20} />
            </button>
            {onSeed && (
            <button 
              onClick={onSeed}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all text-sm font-bold shadow-sm h-fit"
            >
              <TrendingUp size={18} className="text-blue-600" />
              Load Defaults
            </button>
          )}
          <button 
            onClick={onAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all text-sm font-bold w-fit shadow-lg shadow-blue-100 h-fit"
          >
            <Plus size={18} />
            Add New Item
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search by description..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 p-1.5 rounded-xl shadow-sm w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
            <ArrowUpDown size={14} />
            Sort by
          </div>
          <div className="flex gap-1">
            <SortButton 
              active={sortBy === 'label'} 
              onClick={() => onSortByChange('label')}
              icon={<Type size={14} />}
              label="Label"
            />
            <SortButton 
              active={sortBy === 'amount'} 
              onClick={() => onSortByChange('amount')}
              icon={<DollarSign size={14} />}
              label="Amount"
            />
            <SortButton 
              active={sortBy === 'createdAt'} 
              onClick={() => onSortByChange('createdAt')}
              icon={<Calendar size={14} />}
              label="Date"
            />
          </div>
          <div className="h-6 w-[1px] bg-gray-100 mx-1"></div>
          <button 
            onClick={onSortOrderChange}
            className="p-2 hover:bg-gray-50 rounded-lg text-blue-600 transition-colors"
            title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
          >
            {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function SortButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
        active 
          ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100" 
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ItemTable({ items, onUpdate, onDelete, currency, categories = [] }: { items: BudgetItem[], onUpdate: (id: string, updates: Partial<BudgetItem>) => void, onDelete: (id: string) => void, currency: Currency, categories?: Category[] }) {
  if (items.length === 0) return <div className="p-12 text-center text-gray-400 font-medium">No items found. Click 'Add New' to start.</div>;

  const config = CURRENCY_CONFIG[currency];
  const rate = config.rate;

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-widest border-b border-gray-100">
          <th className="px-6 py-4 text-left">Description / Item</th>
          <th className="px-6 py-4 text-left">Category</th>
          <th className="px-6 py-4 text-left">Frequency</th>
          <th className="px-6 py-4 text-left">Amount ({config.symbol})</th>
          <th className="px-6 py-4 text-left">Monthly</th>
          <th className="px-6 py-4 text-left">Annually</th>
          <th className="px-6 py-4"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {items.map(item => (
          <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
            <td className="px-6 py-4">
              <input 
                type="text" 
                className="w-full bg-transparent focus:ring-4 focus:ring-blue-100 focus:outline-none p-2 rounded-lg font-bold text-gray-800 transition-all border border-transparent focus:border-blue-200"
                value={item.name}
                onChange={(e) => onUpdate(item.id, { name: e.target.value })}
              />
            </td>
            <td className="px-6 py-4">
              <select 
                className="bg-transparent focus:ring-4 focus:ring-blue-100 focus:outline-none p-2 rounded-lg text-xs text-gray-500 font-bold appearance-none cursor-pointer border border-transparent focus:border-blue-200"
                value={item.categoryId || ''}
                onChange={(e) => onUpdate(item.id, { categoryId: e.target.value })}
              >
                <option value="">Uncategorized</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </td>
            <td className="px-6 py-4">
              <select 
                className="bg-transparent focus:ring-4 focus:ring-blue-100 focus:outline-none p-2 rounded-lg text-sm text-blue-600 font-bold appearance-none cursor-pointer border border-transparent focus:border-blue-200"
                value={item.frequency}
                onChange={(e) => onUpdate(item.id, { frequency: e.target.value as Frequency })}
              >
                {FREQUENCIES.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="0.01"
                  className="w-24 bg-transparent border-b border-gray-200 focus:border-blue-500 focus:outline-none p-1 font-mono text-left font-black text-gray-900"
                  value={Number((item.amount * rate).toFixed(2))}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onUpdate(item.id, { amount: val / rate });
                  }}
                />
                <span className="text-xs text-gray-400 font-bold">{config.symbol}</span>
              </div>
            </td>
            <td className="px-6 py-4 font-black text-green-600 tabular-nums">
              {formatCurrency(getMonthlyEquivalent(item.amount * rate, item.frequency), currency)}
            </td>
            <td className="px-6 py-4 font-black text-red-500 tabular-nums">
              {formatCurrency(getAnnualEquivalent(item.amount * rate, item.frequency), currency)}
            </td>
            <td className="px-6 py-4">
              <button 
                onClick={() => onDelete(item.id)}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
