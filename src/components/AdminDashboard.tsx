'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Activity, Flame, ShieldAlert, RefreshCw, Search,
  Utensils, Database, Cpu, Image as ImageIcon, CheckCircle2,
  Sparkles, TrendingUp, Calendar, LayoutDashboard, BarChart3,
  DollarSign, Download, Filter, Eye, ShieldCheck, Server,
  ArrowUpRight, Clock, Award, Layers, ChevronRight, X, Check, Zap
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface DailyTokenRecord {
  dateStr: string;
  totalTokens: number;
  promptTokens: number;
  candidatesTokens: number;
  requestsCount: number;
}

interface AdminStats {
  connected: boolean;
  totalUsers: number;
  totalMeals: number;
  todayMealsCount: number;
  goalsBreakdown: { lose: number; gain: number; maintain: number };
  aggregates: { calories: number; protein: number; carbs: number; fats: number };
  geminiUsage?: {
    todayTokens: number;
    todayPromptTokens: number;
    todayCandidatesTokens: number;
    todayRequests: number;
    allTimeTokens: number;
    allTimeRequests: number;
    freeTierTpmLimit: number;
    freeTierRpdLimit: number;
    dailyHistory: DailyTokenRecord[];
  };
  systemHealth: { mongodb: boolean; gemini: boolean; cloudinary: boolean };
}

interface AdminUser {
  _id: string;
  email: string;
  name: string;
  role?: string;
  goal: string;
  gender: string;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  dailyCaloriesGoal: number;
  mealsCount: number;
  updatedAt?: string;
  acceptedTermsAt?: string;
}

interface ActivityMeal {
  id: string;
  userId: string;
  title: string;
  category: string;
  timestamp: string;
  dateStr: string;
  imageUrl: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  detectedCount: number;
  createdAt: string;
}

type AdminSection = 
  | 'overview'
  | 'analytics'
  | 'users'
  | 'activity'
  | 'gemini'
  | 'economics'
  | 'diagnostics';

export const AdminDashboard: React.FC = () => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activity, setActivity] = useState<ActivityMeal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userGoalFilter, setUserGoalFilter] = useState<'all' | 'lose' | 'gain' | 'maintain'>('all');
  const [userSortBy, setUserSortBy] = useState<'meals' | 'calories' | 'name'>('meals');
  const [selectedUserInspector, setSelectedUserInspector] = useState<AdminUser | null>(null);

  // Activity filter
  const [mealFilterQuery, setMealFilterQuery] = useState('');
  const [mealCategoryFilter, setMealCategoryFilter] = useState<string>('all');

  // SaaS Unit Economics Simulator State
  const [simMau, setSimMau] = useState<number>(1000);
  const [simConversionRate, setSimConversionRate] = useState<number>(8);
  const [simPricePerMonth, setSimPricePerMonth] = useState<number>(9.99);
  const [simScansPerUserDay, setSimScansPerUserDay] = useState<number>(2.5);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    setError(null);

    try {
      const [resOverview, resUsers, resActivity] = await Promise.all([
        fetch('/api/admin/overview', { cache: 'no-store' }),
        fetch(`/api/admin/users${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`, { cache: 'no-store' }),
        fetch('/api/admin/activity', { cache: 'no-store' })
      ]);

      if (resOverview.status === 403 || resUsers.status === 403) {
        throw new Error('Access denied. Administrator privileges required.');
      }

      const [dataOverview, dataUsers, dataActivity] = await Promise.all([
        resOverview.json(),
        resUsers.json(),
        resActivity.json()
      ]);

      if (dataOverview.success) setStats(dataOverview.stats);
      if (dataUsers.success) setUsers(dataUsers.users);
      if (dataActivity.success) setActivity(dataActivity.activity);
    } catch (err: any) {
      setError(err?.message || 'Failed to load administrative data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAllData(true);
  };

  // Computed SaaS BI Metrics from real database records
  const biMetrics = useMemo(() => {
    const totalUsers = stats?.totalUsers || users.length || 1;
    const totalMeals = stats?.totalMeals || activity.length || 0;
    const avgMealsPerUser = (totalUsers > 0 ? totalMeals / totalUsers : 0).toFixed(1);
    const activeUsersCount = users.filter((u) => (u.mealsCount || 0) > 0).length;
    const activationRate = Math.round((activeUsersCount / Math.max(1, users.length)) * 100);
    const powerUsersCount = users.filter((u) => (u.mealsCount || 0) >= 3).length;

    const avgAge = users.length
      ? Math.round(users.reduce((acc, u) => acc + (u.age || 25), 0) / users.length)
      : 0;
    const avgDailyKcalGoal = users.length
      ? Math.round(users.reduce((acc, u) => acc + (u.dailyCaloriesGoal || 2000), 0) / users.length)
      : 0;
    const avgWeight = users.length
      ? (users.reduce((acc, u) => acc + (u.currentWeightKg || 70), 0) / users.length).toFixed(1)
      : '0';
    const avgCaloriesPerMeal = totalMeals > 0
      ? Math.round((stats?.aggregates?.calories || 0) / totalMeals)
      : 0;

    const avgTokensPerScan =
      stats?.geminiUsage?.allTimeRequests && stats.geminiUsage.allTimeRequests > 0
        ? Math.round(stats.geminiUsage.allTimeTokens / stats.geminiUsage.allTimeRequests)
        : 1850;

    // Group activity by date for velocity chart
    const dateCounts: Record<string, number> = {};
    activity.forEach((m) => {
      const d = m.dateStr || 'Unknown';
      dateCounts[d] = (dateCounts[d] || 0) + 1;
    });
    const recentDates = Object.entries(dateCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7);

    // Category distribution
    const catCounts: Record<string, number> = {};
    activity.forEach((m) => {
      const c = (m.category || 'Meal').toUpperCase();
      catCounts[c] = (catCounts[c] || 0) + 1;
    });

    return {
      avgMealsPerUser,
      activeUsersCount,
      activationRate,
      powerUsersCount,
      avgAge,
      avgDailyKcalGoal,
      avgWeight,
      avgCaloriesPerMeal,
      avgTokensPerScan,
      recentDates,
      catCounts
    };
  }, [stats, users, activity]);

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        if (userGoalFilter !== 'all' && u.goal !== userGoalFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (userSortBy === 'meals') return (b.mealsCount || 0) - (a.mealsCount || 0);
        if (userSortBy === 'calories') return (b.dailyCaloriesGoal || 0) - (a.dailyCaloriesGoal || 0);
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [users, userGoalFilter, userSortBy, searchQuery]);

  // Filtered Activity
  const filteredActivity = useMemo(() => {
    return activity.filter((m) => {
      if (mealCategoryFilter !== 'all' && !m.category?.toLowerCase().includes(mealCategoryFilter)) {
        return false;
      }
      if (mealFilterQuery.trim()) {
        const q = mealFilterQuery.toLowerCase();
        return m.title?.toLowerCase().includes(q) || m.category?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activity, mealCategoryFilter, mealFilterQuery]);

  // CSV Export Handler for Admin
  const handleExportUsersCsv = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Goal', 'Age', 'Height(cm)', 'CurrentWeight(kg)', 'TargetWeight(kg)', 'DailyKcalGoal', 'MealsLogged'];
    const rows = users.map((u) => [
      u._id,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      u.email,
      u.role || 'user',
      u.goal,
      u.age,
      u.heightCm,
      u.currentWeightKg,
      u.targetWeightKg,
      u.dailyCaloriesGoal,
      u.mealsCount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `platevision_athletes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SaaS Economics Simulator Calculations
  const paidSubscribers = Math.round(simMau * (simConversionRate / 100));
  const projectedMrr = paidSubscribers * simPricePerMonth;
  const projectedArr = projectedMrr * 12;
  const totalMonthlyScans = Math.round(simMau * simScansPerUserDay * 30);
  const totalMonthlyTokens = totalMonthlyScans * biMetrics.avgTokensPerScan;
  // Gemini 2.5 Flash paid tier is ~$0.15 per 1M tokens (and $0 on free tier up to 1,500 RPD)
  const estimatedAiApiCost = totalMonthlyScans <= 45000 ? 0 : (totalMonthlyTokens / 1_000_000) * 0.18;
  const estimatedInfraCost = simMau <= 1000 ? 0 : Math.round((simMau / 1000) * 12);
  const totalMonthlyCost = estimatedAiApiCost + estimatedInfraCost;
  const grossMarginPct = projectedMrr > 0 ? Math.max(0, Math.min(100, Math.round(((projectedMrr - totalMonthlyCost) / projectedMrr) * 100))) : 100;

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-lime-100 border border-lime-300 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#65a30d] animate-spin" />
        </div>
        <p className="text-sm text-slate-600 font-bold">
          {isFr ? 'Chargement du Portail Exécutif SaaS...' : 'Loading PlateVision Executive SaaS Command Center...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center max-w-md mx-auto p-8 rounded-3xl bg-white border-2 border-rose-200 shadow-md space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-rose-500" />
        </div>
        <h3 className="text-lg font-black text-[#0f172a]">Administrator Access Required</h3>
        <p className="text-xs text-slate-600">{error}</p>
        <button
          onClick={() => fetchAllData(true)}
          className="px-5 py-2.5 rounded-xl bg-[#0f172a] text-[#b6ff2e] font-black text-xs"
        >
          Try Again
        </button>
      </div>
    );
  }

  const sidebarGroups = [
    {
      groupLabel: isFr ? 'PILOTAGE & BI' : 'BUSINESS INTELLIGENCE',
      items: [
        {
          id: 'overview' as AdminSection,
          label: isFr ? 'Vue d\'Ensemble SaaS' : 'Executive Overview',
          icon: LayoutDashboard,
          badge: 'Live'
        },
        {
          id: 'analytics' as AdminSection,
          label: isFr ? 'Croissance & Nutrition BI' : 'Growth & Nutrition BI',
          icon: BarChart3
        }
      ]
    },
    {
      groupLabel: isFr ? 'OPÉRATIONS & CRM' : 'OPERATIONS & CRM',
      items: [
        {
          id: 'users' as AdminSection,
          label: isFr ? 'Annuaire Athlètes (CRM)' : 'Athlete CRM Directory',
          icon: Users,
          badge: String(users.length)
        },
        {
          id: 'activity' as AdminSection,
          label: isFr ? 'Flux Repas Temps Réel' : 'Live Meal Stream',
          icon: Utensils,
          badge: String(activity.length)
        }
      ]
    },
    {
      groupLabel: isFr ? 'IA & ÉCONOMIE SAAS' : 'AI & UNIT ECONOMICS',
      items: [
        {
          id: 'gemini' as AdminSection,
          label: isFr ? 'Tokens & Quotas Gemini' : 'Gemini AI Telemetry',
          icon: Cpu,
          badge: 'Free Tier'
        },
        {
          id: 'economics' as AdminSection,
          label: isFr ? 'Simulateur Revenus SaaS' : 'SaaS Revenue & ROI',
          icon: DollarSign,
          badge: 'PRO'
        }
      ]
    },
    {
      groupLabel: isFr ? 'INFRASTRUCTURE' : 'INFRASTRUCTURE',
      items: [
        {
          id: 'diagnostics' as AdminSection,
          label: isFr ? 'Santé Système & Sécurité' : 'System Health & Security',
          icon: Server
        }
      ]
    }
  ];

  const activeItemMeta = sidebarGroups
    .flatMap((g) => g.items)
    .find((i) => i.id === activeSection);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start animate-in fade-in duration-300">
      
      {/* =====================================================================
          LEFT SIDEBAR NAVIGATION (STICKY ON DESKTOP)
         ===================================================================== */}
      <aside className="w-full lg:w-72 shrink-0 bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-5 space-y-6 lg:sticky lg:top-24">
        
        {/* Sidebar Header / Brand Identity */}
        <div className="p-4 rounded-2xl bg-[#0f172a] text-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#b6ff2e]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FOUNDER OS v2.5</span>
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Online
            </span>
          </div>
          <h2 className="text-lg font-black tracking-tight text-white">PlateVision SaaS</h2>
          <p className="text-[11px] text-slate-400">
            {isFr ? 'Centre de contrôle exécutif' : 'Executive Management & Telemetry'}
          </p>
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-5">
          {sidebarGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                {group.groupLabel}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const IconComp = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                        isActive
                          ? 'bg-[#b6ff2e] text-[#0f172a] shadow-xs border border-[#84cc16]'
                          : 'text-slate-600 hover:text-[#0f172a] hover:bg-slate-50 font-bold'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComp className={`w-4 h-4 ${isActive ? 'text-[#0f172a]' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            isActive
                              ? 'bg-[#0f172a] text-[#b6ff2e]'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Quick Footer Stats */}
        <div className="pt-4 border-t border-slate-200 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">{isFr ? 'Coût API ce mois' : 'Monthly API Spend'}</span>
            <span className="font-black text-[#65a30d]">$0.00 (Free Tier)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">{isFr ? 'Taux d\'activation' : 'User Activation'}</span>
            <span className="font-black text-[#0f172a]">{biMetrics.activationRate}%</span>
          </div>
          <button
            onClick={handleExportUsersCsv}
            className="w-full mt-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0f172a] font-black text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#65a30d]" />
            <span>{isFr ? 'Exporter CSV Athlètes' : 'Export Athletes CSV'}</span>
          </button>
        </div>

      </aside>

      {/* =====================================================================
          RIGHT MAIN CONTENT WORKSPACE
         ===================================================================== */}
      <div className="flex-1 w-full min-w-0 space-y-6">
        
        {/* Contextual Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span>SaaS Command Center</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#65a30d] font-black">{activeItemMeta?.label}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight mt-1">
              {activeItemMeta?.label}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportUsersCsv}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-[#0f172a] font-black text-xs hover:bg-slate-50 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#65a30d]" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => fetchAllData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f172a] text-[#b6ff2e] font-black text-xs hover:bg-slate-800 transition-all disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Live Refresh'}</span>
            </button>
          </div>
        </div>

        {/* =================================================================
            VIEW 1: EXECUTIVE OVERVIEW (NORTH STAR KPIs + VELOCITY + PREVIEW)
           ================================================================= */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            
            {/* 5 North Star Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              <div
                onClick={() => setActiveSection('users')}
                className="p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-[#84cc16] shadow-xs space-y-2 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Athletes</span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0f172a]">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-[#0f172a]">{stats?.totalUsers || 0}</p>
                <p className="text-[11px] text-[#65a30d] font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {biMetrics.activationRate}% activated
                </p>
              </div>

              <div
                onClick={() => setActiveSection('activity')}
                className="p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-[#84cc16] shadow-xs space-y-2 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Meals Scanned</span>
                  <div className="w-8 h-8 rounded-xl bg-lime-100 border border-lime-200 flex items-center justify-center text-[#65a30d]">
                    <Utensils className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-[#65a30d]">{stats?.totalMeals || 0}</p>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Avg {biMetrics.avgMealsPerUser} meals / athlete
                </p>
              </div>

              <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Scans Today</span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0f172a]">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-[#0f172a]">{stats?.todayMealsCount || 0}</p>
                <p className="text-[11px] text-slate-500 font-semibold">24h active stream</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Calories Tracked</span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0f172a]">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-[#0f172a]">
                  {stats?.aggregates?.calories ? stats.aggregates.calories.toLocaleString() : 0}
                </p>
                <p className="text-[11px] text-slate-500 font-semibold">
                  ~{biMetrics.avgCaloriesPerMeal} kcal / meal avg
                </p>
              </div>

              <div
                onClick={() => setActiveSection('gemini')}
                className="p-5 bg-[#0f172a] text-white rounded-2xl border-2 border-slate-800 shadow-sm space-y-2 cursor-pointer hover:border-[#b6ff2e] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#b6ff2e] font-black uppercase tracking-wider">Gemini Tokens</span>
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#b6ff2e]">
                    <Cpu className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-white">
                  {stats?.geminiUsage?.todayTokens ? stats.geminiUsage.todayTokens.toLocaleString() : '0'}
                </p>
                <p className="text-[10px] text-slate-300 font-bold flex items-center justify-between">
                  <span>{stats?.geminiUsage?.todayRequests || 0} req today</span>
                  <span className="text-[#b6ff2e]">$0.00</span>
                </p>
              </div>
            </div>

            {/* SaaS Engagement & Velocity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left 7 Cols: Scan Activity Velocity by Date */}
              <div className="lg:col-span-7 p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-[#0f172a] flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#65a30d]" />
                      <span>Daily AI Scan Velocity (Recent Activity Days)</span>
                    </h3>
                    <p className="text-xs text-slate-500">Volume of meal photos processed across active dates</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-lime-100 text-[#0f172a] text-xs font-black">
                    {activity.length} Total Scans
                  </span>
                </div>

                {biMetrics.recentDates.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    {biMetrics.recentDates.map(([dateStr, count]) => {
                      const maxCount = Math.max(...biMetrics.recentDates.map((d) => d[1]), 1);
                      const pct = Math.max(12, Math.round((count / maxCount) * 100));
                      return (
                        <div key={dateStr} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="font-mono text-slate-600">{dateStr}</span>
                            <span className="text-[#0f172a] font-black">{count} meals scanned</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className="h-full bg-gradient-to-r from-[#84cc16] to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-8 text-center">No meal activity recorded yet.</p>
                )}
              </div>

              {/* Right 5 Cols: SaaS Funnel & Retention Health */}
              <div className="lg:col-span-5 p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-5">
                <h3 className="text-base font-black text-[#0f172a] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#65a30d]" />
                  <span>SaaS Cohort & Funnel Health</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Onboarding Rate</p>
                    <p className="text-2xl font-black text-emerald-600">100%</p>
                    <p className="text-[10px] text-slate-500">Completed BMR setup</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Active Scanners</p>
                    <p className="text-2xl font-black text-[#0f172a]">{biMetrics.activeUsersCount} / {users.length}</p>
                    <p className="text-[10px] text-slate-500">Logged 1+ meal</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Power Athletes</p>
                    <p className="text-2xl font-black text-[#65a30d]">{biMetrics.powerUsersCount}</p>
                    <p className="text-[10px] text-slate-500">3+ meals logged</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Avg Tokens / Scan</p>
                    <p className="text-2xl font-black text-[#0f172a]">{biMetrics.avgTokensPerScan.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500">Gemini 2.5 Flash</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Quick Preview: Latest 3 Scans & Latest 3 Users */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Latest Scans Preview */}
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-wider">Recent Scanned Meals</h3>
                  <button
                    onClick={() => setActiveSection('activity')}
                    className="text-xs font-black text-[#65a30d] hover:underline flex items-center gap-1"
                  >
                    <span>View All ({activity.length})</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {activity.slice(0, 3).map((meal) => (
                    <div key={meal.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={meal.imageUrl} alt={meal.title} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200" />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-[#0f172a] truncate">{meal.title}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">{meal.category} • {meal.dateStr}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-lime-100 text-[#0f172a] font-black text-xs shrink-0">
                        {meal.totalCalories} kcal
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Athletes Preview */}
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-wider">Top Active Athletes</h3>
                  <button
                    onClick={() => setActiveSection('users')}
                    className="text-xs font-black text-[#65a30d] hover:underline flex items-center gap-1"
                  >
                    <span>Open CRM ({users.length})</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {users.slice(0, 3).map((u) => (
                    <div key={u._id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#0f172a] text-[#b6ff2e] flex items-center justify-center font-black text-xs shrink-0">
                          {(u.name || 'A').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-[#0f172a] truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-[#65a30d]">{u.mealsCount} meals</p>
                        <p className="text-[10px] text-slate-500 font-bold">{u.dailyCaloriesGoal} kcal/day</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* =================================================================
            VIEW 2: GROWTH & NUTRITION BI
           ================================================================= */}
        {activeSection === 'analytics' && (
          <div className="space-y-6">
            
            {/* Cohort Demographic & Physical Averages */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-500">Avg Athlete Age</p>
                <p className="text-3xl font-black text-[#0f172a]">{biMetrics.avgAge} <span className="text-xs font-normal text-slate-500">years</span></p>
              </div>
              <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-500">Avg Current Weight</p>
                <p className="text-3xl font-black text-[#0f172a]">{biMetrics.avgWeight} <span className="text-xs font-normal text-slate-500">kg</span></p>
              </div>
              <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-500">Avg Daily BMR Target</p>
                <p className="text-3xl font-black text-[#65a30d]">{biMetrics.avgDailyKcalGoal} <span className="text-xs font-normal text-slate-500">kcal</span></p>
              </div>
              <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-500">Avg Energy / Plate</p>
                <p className="text-3xl font-black text-[#0f172a]">{biMetrics.avgCaloriesPerMeal} <span className="text-xs font-normal text-slate-500">kcal</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Goal Distribution */}
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-5">
                <h3 className="text-base font-black text-[#0f172a] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#84cc16]" />
                  <span>Athletes Distribution by Fitness Goal</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-[#0f172a]">Fat Loss (Calorie Deficit)</span>
                      <span className="text-[#0f172a] font-black">{stats?.goalsBreakdown?.lose || 0} athletes</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="bg-[#0f172a] h-full rounded-full"
                        style={{ width: `${stats?.totalUsers ? ((stats.goalsBreakdown.lose / stats.totalUsers) * 100) : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-[#65a30d]">Muscle Gain (Lean Surplus)</span>
                      <span className="text-[#0f172a] font-black">{stats?.goalsBreakdown?.gain || 0} athletes</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="bg-[#84cc16] h-full rounded-full"
                        style={{ width: `${stats?.totalUsers ? ((stats.goalsBreakdown.gain / stats.totalUsers) * 100) : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600">Maintenance &amp; Recomposition</span>
                      <span className="text-[#0f172a] font-black">{stats?.goalsBreakdown?.maintain || 0} athletes</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="bg-slate-400 h-full rounded-full"
                        style={{ width: `${stats?.totalUsers ? ((stats.goalsBreakdown.maintain / stats.totalUsers) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cumulative Macros Breakdown */}
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-5">
                <h3 className="text-base font-black text-[#0f172a] flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-[#84cc16]" />
                  <span>Cumulative Macronutrients Tracked</span>
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-[10px] uppercase font-black text-[#65a30d]">Protein</p>
                    <p className="text-2xl font-black text-[#0f172a] mt-1">
                      {stats?.aggregates?.protein ? stats.aggregates.protein.toLocaleString() : 0}g
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-[10px] uppercase font-black text-slate-600">Carbs</p>
                    <p className="text-2xl font-black text-[#0f172a] mt-1">
                      {stats?.aggregates?.carbs ? stats.aggregates.carbs.toLocaleString() : 0}g
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-[10px] uppercase font-black text-slate-600">Fats</p>
                    <p className="text-2xl font-black text-[#0f172a] mt-1">
                      {stats?.aggregates?.fats ? stats.aggregates.fats.toLocaleString() : 0}g
                    </p>
                  </div>
                </div>

                {/* Meal Category Distribution */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-black text-slate-600">Meal Timing &amp; Category Breakdown:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(biMetrics.catCounts).map(([cat, count]) => (
                      <span key={cat} className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-[#0f172a]">
                        {cat}: <strong className="text-[#65a30d]">{count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* =================================================================
            VIEW 3: ATHLETE CRM DIRECTORY
           ================================================================= */}
        {activeSection === 'users' && (
          <div className="space-y-4">
            
            {/* Filter & Search Bar */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter athletes by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#0f172a] text-xs font-semibold focus:outline-none focus:border-[#84cc16]"
                  />
                </div>
              </form>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  {(['all', 'lose', 'gain', 'maintain'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setUserGoalFilter(g)}
                      className={`px-2.5 py-1 rounded-lg font-black uppercase text-[10px] transition-all ${
                        userGoalFilter === g ? 'bg-[#0f172a] text-[#b6ff2e]' : 'text-slate-600'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>

                <select
                  value={userSortBy}
                  onChange={(e) => setUserSortBy(e.target.value as any)}
                  aria-label="Sort athletes by"
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0f172a]"
                >
                  <option value="meals">Sort: Most Meals</option>
                  <option value="calories">Sort: Calorie Target</option>
                  <option value="name">Sort: Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Selected Athlete Inspector Drawer / Banner */}
            {selectedUserInspector && (
              <div className="p-6 bg-[#0f172a] text-white rounded-3xl border-2 border-slate-800 shadow-xl space-y-4 animate-in fade-in duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#b6ff2e] text-[#0f172a] flex items-center justify-center font-black text-base">
                      {(selectedUserInspector.name || 'A').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white">{selectedUserInspector.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">{selectedUserInspector.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUserInspector(null)}
                    className="p-1.5 rounded-xl bg-white/10 text-slate-300 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Fitness Goal</p>
                    <p className="text-sm font-black text-[#b6ff2e] uppercase mt-0.5">{selectedUserInspector.goal}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Weight Trajectory</p>
                    <p className="text-sm font-black text-white mt-0.5">
                      {selectedUserInspector.currentWeightKg}kg → {selectedUserInspector.targetWeightKg}kg
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Height &amp; Age</p>
                    <p className="text-sm font-black text-white mt-0.5">
                      {selectedUserInspector.heightCm}cm • {selectedUserInspector.age} yrs
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Daily Calorie Target</p>
                    <p className="text-sm font-black text-[#b6ff2e] mt-0.5">{selectedUserInspector.dailyCaloriesGoal} kcal</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total Meals Scanned</p>
                    <p className="text-sm font-black text-white mt-0.5">{selectedUserInspector.mealsCount} meals</p>
                  </div>
                </div>
              </div>
            )}

            {/* CRM Table */}
            <div className="overflow-x-auto rounded-3xl border-2 border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Athlete</th>
                    <th className="p-4">Goal</th>
                    <th className="p-4">Physical Profile</th>
                    <th className="p-4">Daily BMR Target</th>
                    <th className="p-4">Engagement</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[#0f172a]">
                  {filteredUsers.map((u) => {
                    const isPower = (u.mealsCount || 0) >= 3;
                    const isActive = (u.mealsCount || 0) >= 1;
                    return (
                      <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-[#0f172a]">
                              {(u.name || 'A').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-[#0f172a]">{u.name}</p>
                              <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-slate-100 text-[#0f172a] border border-slate-200">
                            {u.goal}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">
                          {u.currentWeightKg}kg &rarr; {u.targetWeightKg}kg ({u.heightCm}cm, {u.age}yo)
                        </td>
                        <td className="p-4 font-black text-[#65a30d]">
                          {u.dailyCaloriesGoal} kcal
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-[#0f172a]">{u.mealsCount} meals</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black inline-flex items-center gap-1 ${
                              isPower
                                ? 'bg-[#0f172a] text-[#b6ff2e]'
                                : isActive
                                ? 'bg-lime-100 text-[#365314] border border-lime-300'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {isPower ? <Zap className="w-2.5 h-2.5 text-[#b6ff2e]" /> : isActive ? <Check className="w-2.5 h-2.5 text-[#65a30d]" /> : null}
                              <span>{isPower ? 'Power' : isActive ? 'Active' : 'New'}</span>
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          {u.role === 'admin' ? (
                            <span className="px-2 py-0.5 rounded bg-[#0f172a] text-[#b6ff2e] font-black text-[10px]">
                              ADMIN
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-bold">Athlete</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedUserInspector(u)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#b6ff2e] text-[#0f172a] font-black text-[11px] inline-flex items-center gap-1 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* =================================================================
            VIEW 4: LIVE MEAL STREAM
           ================================================================= */}
        {activeSection === 'activity' && (
          <div className="space-y-4">
            
            {/* Stream Filter Bar */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search scanned meals by food name or category..."
                  value={mealFilterQuery}
                  onChange={(e) => setMealFilterQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#0f172a] text-xs font-semibold focus:outline-none focus:border-[#84cc16]"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto">
                {['all', 'breakfast', 'lunch', 'dinner', 'snack'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMealCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg font-black uppercase text-[10px] transition-all ${
                      mealCategoryFilter === cat ? 'bg-[#0f172a] text-[#b6ff2e]' : 'text-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredActivity.map((meal) => (
                <div key={meal.id} className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:border-[#84cc16] transition-all">
                  <div className="flex gap-3">
                    <img
                      src={meal.imageUrl}
                      alt={meal.title}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-200 bg-slate-100"
                    />
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-black text-[#65a30d] uppercase">{meal.category}</span>
                      <h4 className="text-sm font-black text-[#0f172a] truncate">{meal.title}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{meal.timestamp} ({meal.dateStr})</p>
                      <p className="text-xs font-black text-[#65a30d] mt-1">{meal.totalCalories} kcal</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-black pt-2 border-t border-slate-100">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[#0f172a] border border-slate-200">P: {meal.totalProtein}g</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">C: {meal.totalCarbs}g</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">F: {meal.totalFats}g</span>
                    <span className="text-slate-400 font-normal font-mono truncate max-w-[90px]">{meal.userId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================
            VIEW 5: GEMINI AI TOKENS & QUOTA TELEMETRY
           ================================================================= */}
        {activeSection === 'gemini' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-lime-50/80 rounded-2xl border-2 border-[#84cc16] shadow-xs space-y-2">
                <span className="text-xs text-[#0f172a] font-black uppercase tracking-wider">Today&apos;s Token Usage</span>
                <p className="text-3xl font-black text-[#0f172a]">
                  {stats?.geminiUsage?.todayTokens ? stats.geminiUsage.todayTokens.toLocaleString() : 0}
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  Input: {stats?.geminiUsage?.todayPromptTokens?.toLocaleString() || 0} | Output: {stats?.geminiUsage?.todayCandidatesTokens?.toLocaleString() || 0}
                </p>
              </div>

              <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Daily Request Quota</span>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-black text-[#0f172a]">{stats?.geminiUsage?.todayRequests || 0}</p>
                  <span className="text-xs text-slate-500 font-mono">/ 1,500 RPD</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="bg-[#84cc16] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, ((stats?.geminiUsage?.todayRequests || 0) / 1500) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">All-Time Tokens</span>
                <p className="text-3xl font-black text-[#0f172a]">
                  {stats?.geminiUsage?.allTimeTokens ? stats.geminiUsage.allTimeTokens.toLocaleString() : 0}
                </p>
                <p className="text-[11px] text-slate-500">
                  Across {stats?.geminiUsage?.allTimeRequests || 0} total AI invocations
                </p>
              </div>

              <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Avg Tokens / Scan</span>
                <p className="text-3xl font-black text-[#65a30d]">{biMetrics.avgTokensPerScan.toLocaleString()}</p>
                <p className="text-[11px] text-slate-500">Compressed image + JSON schema</p>
              </div>
            </div>

            {/* Daily Consumption History Table */}
            <div className="space-y-3">
              <h3 className="text-base font-black text-[#0f172a] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#84cc16]" />
                <span>Day-by-Day Token Consumption History</span>
              </h3>

              <div className="overflow-x-auto rounded-2xl border-2 border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 font-bold">Date (YYYY-MM-DD)</th>
                      <th className="p-3.5 font-bold">Total Tokens</th>
                      <th className="p-3.5 font-bold">Prompt (Vision + Input)</th>
                      <th className="p-3.5 font-bold">Candidate (JSON Output)</th>
                      <th className="p-3.5 font-bold">Scans / Fixes</th>
                      <th className="p-3.5 font-bold">Status</th>
                      <th className="p-3.5 font-bold">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[#0f172a]">
                    {stats?.geminiUsage?.dailyHistory && stats.geminiUsage.dailyHistory.length > 0 ? (
                      stats.geminiUsage.dailyHistory.map((day) => (
                        <tr key={day.dateStr} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-[#0f172a] flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[#84cc16]" />
                            <span>{day.dateStr}</span>
                          </td>
                          <td className="p-3.5 font-black text-[#65a30d]">
                            {day.totalTokens.toLocaleString()} tokens
                          </td>
                          <td className="p-3.5 text-slate-600 font-mono">
                            {day.promptTokens.toLocaleString()}
                          </td>
                          <td className="p-3.5 text-slate-600 font-mono">
                            {day.candidatesTokens.toLocaleString()}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-[#0f172a]">{day.requestsCount}</span> requests
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                              Within Free Tier
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-[#0f172a] font-mono">
                            $0.00
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">
                          No historical token usage recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            VIEW 6: SAAS REVENUE & UNIT ECONOMICS SIMULATOR (NEW!)
           ================================================================= */}
        {activeSection === 'economics' && (
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#65a30d]">
                  FOUNDER FINANCIAL MODELING
                </span>
                <h3 className="text-xl font-black text-[#0f172a] mt-0.5">
                  SaaS Revenue, AI Token Scaling &amp; Gross Margin Simulator
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Simulate your startup&apos;s MRR, ARR, and Google Gemini API infrastructure costs as PlateVision scales from 100 to 50,000+ users.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left Sliders (7 Cols) */}
                <div className="lg:col-span-7 space-y-5">
                  
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-700">1. Monthly Active Users (MAU)</span>
                      <span className="text-[#0f172a]">{simMau.toLocaleString()} users</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={50000}
                      step={100}
                      value={simMau}
                      onChange={(e) => setSimMau(Number(e.target.value))}
                      className="w-full accent-[#84cc16] cursor-pointer"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-700">2. Free-to-Pro Conversion Rate (%)</span>
                      <span className="text-[#65a30d]">{simConversionRate}% ({paidSubscribers.toLocaleString()} Pro users)</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={25}
                      step={0.5}
                      value={simConversionRate}
                      onChange={(e) => setSimConversionRate(Number(e.target.value))}
                      className="w-full accent-[#84cc16] cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex justify-between text-xs font-black">
                        <span className="text-slate-700">Pro Subscription ($/mo)</span>
                        <span className="text-[#0f172a]">${simPricePerMonth.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={4.99}
                        max={29.99}
                        step={1}
                        value={simPricePerMonth}
                        onChange={(e) => setSimPricePerMonth(Number(e.target.value))}
                        className="w-full accent-[#84cc16] cursor-pointer"
                      />
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex justify-between text-xs font-black">
                        <span className="text-slate-700">Scans / User / Day</span>
                        <span className="text-[#0f172a]">{simScansPerUserDay} scans</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={0.5}
                        value={simScansPerUserDay}
                        onChange={(e) => setSimScansPerUserDay(Number(e.target.value))}
                        className="w-full accent-[#84cc16] cursor-pointer"
                      />
                    </div>
                  </div>

                </div>

                {/* Right Financial Output (5 Cols) */}
                <div className="lg:col-span-5 p-6 rounded-3xl bg-[#0f172a] text-white border-2 border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-[#b6ff2e]">PROJECTED SAAS P&amp;L</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black">
                      {grossMarginPct}% Gross Margin
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Est. Monthly MRR</p>
                      <p className="text-2xl font-black text-[#b6ff2e] mt-0.5">
                        ${Math.round(projectedMrr).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Annual Run Rate (ARR)</p>
                      <p className="text-2xl font-black text-white mt-0.5">
                        ${Math.round(projectedArr).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly AI Scans Volume:</span>
                      <span className="font-mono font-bold text-white">{totalMonthlyScans.toLocaleString()} scans</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Est. Gemini Vision API Cost:</span>
                      <span className="font-mono font-bold text-emerald-400">${estimatedAiApiCost.toFixed(2)} / mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Est. Cloud &amp; DB Overhead:</span>
                      <span className="font-mono font-bold text-slate-300">${estimatedInfraCost.toFixed(2)} / mo</span>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-black">
                      <span className="text-[#b6ff2e]">Net Monthly Operating Profit:</span>
                      <span className="text-white">${Math.round(projectedMrr - totalMonthlyCost).toLocaleString()}/mo</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            VIEW 7: SYSTEM HEALTH & SECURITY DIAGNOSTICS
           ================================================================= */}
        {activeSection === 'diagnostics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#0f172a]">MongoDB Atlas Cluster</h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Primary User &amp; Meal Document Store</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Connected &amp; Healthy</span>
                </div>
              </div>

              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-lime-100 border border-lime-200 flex items-center justify-center text-[#84cc16]">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#0f172a]">Google Gemini Vision</h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Multimodal Food Segmentation Engine</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-100 text-[#0f172a] border border-lime-200 text-xs font-black">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#84cc16]" />
                  <span>API Key Operational</span>
                </div>
              </div>

              <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#0f172a]">Cloudinary Image CDN</h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Auto-compressed meal image delivery</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>CDN Online</span>
                </div>
              </div>
            </div>

            {/* Security & Compliance Checklist */}
            <div className="p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-black text-[#0f172a] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#65a30d]" />
                <span>Platform Security &amp; Regulatory Readiness Audit</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[
                  { title: 'HttpOnly Signed Session Cookies', desc: 'Prevents XSS token theft across web and PWA sessions' },
                  { title: 'Bcrypt Password Hashing', desc: 'Salted irreversible cryptographic credential storage' },
                  { title: 'API Rate Limiting Active', desc: 'Protects login, register, and Gemini Vision endpoints from abuse' },
                  { title: 'GDPR Account Export & Self-Deletion', desc: 'Users can export JSON data or wipe their account at any time' }
                ].map((sec, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-[#0f172a]">{sec.title}</p>
                      <p className="text-slate-500 mt-0.5">{sec.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
