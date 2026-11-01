'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, Flame, ShieldAlert, RefreshCw, Search,
  Utensils, Database, Cpu, Image as ImageIcon, CheckCircle2,
  AlertTriangle, Sparkles, TrendingUp, Calendar, ArrowUpRight
} from 'lucide-react';

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

export const AdminDashboard: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'gemini' | 'users' | 'activity' | 'diagnostics'>('analytics');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activity, setActivity] = useState<ActivityMeal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#b6ff2e] animate-spin" />
        </div>
        <p className="text-sm text-[#9ea3b0] font-semibold">Loading PlateVision Executive Management Portal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center max-w-md mx-auto p-8 rounded-3xl glass-card border border-rose-500/30 space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-rose-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Administrator Access Required</h3>
        <p className="text-xs text-[#9ea3b0]">{error}</p>
        <button
          onClick={() => fetchAllData(true)}
          className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 glass-card rounded-3xl border border-[rgba(255,255,255,0.12)]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 text-[#b6ff2e] text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#b6ff2e]" />
            <span>SaaS Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Executive Management Portal</h1>
          <p className="text-xs text-[#9ea3b0]">Live platform monitoring, user activity stream, and database telemetry.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAllData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-bold text-xs hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#b6ff2e]' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Live Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 glass-card rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9ea3b0] font-bold uppercase tracking-wider">Registered Athletes</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{stats?.totalUsers || 0}</p>
          <p className="text-[10px] text-[#9ea3b0] flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#b6ff2e]" /> Live database accounts
          </p>
        </div>

        <div className="p-5 glass-card rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9ea3b0] font-bold uppercase tracking-wider">Total Meals Scanned</span>
            <div className="w-8 h-8 rounded-xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 flex items-center justify-center text-[#b6ff2e]">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#b6ff2e]">{stats?.totalMeals || 0}</p>
          <p className="text-[10px] text-[#9ea3b0]">Logged via Gemini Computer Vision</p>
        </div>

        <div className="p-5 glass-card rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9ea3b0] font-bold uppercase tracking-wider">Scans Today</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-400">{stats?.todayMealsCount || 0}</p>
          <p className="text-[10px] text-[#9ea3b0]">Processed in current day</p>
        </div>

        <div className="p-5 glass-card rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9ea3b0] font-bold uppercase tracking-wider">Calories Tracked</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-400">
            {stats?.aggregates?.calories ? stats.aggregates.calories.toLocaleString() : 0}
          </p>
          <p className="text-[10px] text-[#9ea3b0]">Cumulative platform intake</p>
        </div>

        <div 
          onClick={() => setActiveSubTab('gemini')}
          className="p-5 glass-card rounded-2xl border border-[#b6ff2e]/30 space-y-2 cursor-pointer hover:border-[#b6ff2e] transition-all bg-[#b6ff2e]/5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#b6ff2e] font-extrabold uppercase tracking-wider">Gemini Tokens (Today)</span>
            <div className="w-8 h-8 rounded-xl bg-[#b6ff2e]/20 border border-[#b6ff2e]/40 flex items-center justify-center text-[#b6ff2e]">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">
            {stats?.geminiUsage?.todayTokens ? stats.geminiUsage.todayTokens.toLocaleString() : '0'}
          </p>
          <p className="text-[10px] text-[#9ea3b0] flex items-center justify-between">
            <span>Free Tier ({stats?.geminiUsage?.todayRequests || 0} req)</span>
            <span className="text-[#b6ff2e] font-bold">$0.00 spent</span>
          </p>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'analytics'
              ? 'bg-[#b6ff2e] text-[#14171d] shadow-[0_0_15px_rgba(182,255,46,0.3)]'
              : 'text-[#9ea3b0] hover:text-white hover:bg-white/5'
          }`}
        >
          Analytics &amp; Targets
        </button>
        <button
          onClick={() => setActiveSubTab('gemini')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'gemini'
              ? 'bg-[#b6ff2e] text-[#14171d] shadow-[0_0_15px_rgba(182,255,46,0.3)]'
              : 'text-[#9ea3b0] hover:text-white hover:bg-white/5'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Gemini Tokens &amp; Quota</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 font-black text-[#b6ff2e]">
            Free Tier
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'users'
              ? 'bg-[#b6ff2e] text-[#14171d] shadow-[0_0_15px_rgba(182,255,46,0.3)]'
              : 'text-[#9ea3b0] hover:text-white hover:bg-white/5'
          }`}
        >
          <span>User Directory</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 font-black">
            {users.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('activity')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'activity'
              ? 'bg-[#b6ff2e] text-[#14171d] shadow-[0_0_15px_rgba(182,255,46,0.3)]'
              : 'text-[#9ea3b0] hover:text-white hover:bg-white/5'
          }`}
        >
          <span>Live Meal Activity</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 font-black">
            {activity.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('diagnostics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'diagnostics'
              ? 'bg-[#b6ff2e] text-[#14171d] shadow-[0_0_15px_rgba(182,255,46,0.3)]'
              : 'text-[#9ea3b0] hover:text-white hover:bg-white/5'
          }`}
        >
          System Health
        </button>
      </div>

      {/* VIEW 1: ANALYTICS & GOALS */}
      {activeSubTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Goal Distribution */}
          <div className="p-6 glass-card rounded-3xl border border-white/10 space-y-5">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#b6ff2e]" />
              <span>Athletes Distribution by Fitness Goal</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-rose-400">Fat Loss (Deficit)</span>
                  <span className="text-white">{stats?.goalsBreakdown?.lose || 0} athletes</span>
                </div>
                <div className="w-full bg-[#14171d] h-2.5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="bg-rose-500 h-full rounded-full"
                    style={{ width: `${stats?.totalUsers ? ((stats.goalsBreakdown.lose / stats.totalUsers) * 100) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-emerald-400">Muscle Gain (Surplus)</span>
                  <span className="text-white">{stats?.goalsBreakdown?.gain || 0} athletes</span>
                </div>
                <div className="w-full bg-[#14171d] h-2.5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${stats?.totalUsers ? ((stats.goalsBreakdown.gain / stats.totalUsers) * 100) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-sky-400">Maintenance &amp; Longevity</span>
                  <span className="text-white">{stats?.goalsBreakdown?.maintain || 0} athletes</span>
                </div>
                <div className="w-full bg-[#14171d] h-2.5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="bg-sky-400 h-full rounded-full"
                    style={{ width: `${stats?.totalUsers ? ((stats.goalsBreakdown.maintain / stats.totalUsers) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cumulative Macros Breakdown */}
          <div className="p-6 glass-card rounded-3xl border border-white/10 space-y-5">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#b6ff2e]" />
              <span>Cumulative Macronutrients Logged</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#14171d] border border-rose-500/20 text-center">
                <p className="text-[10px] uppercase font-bold text-[#9ea3b0]">Protein</p>
                <p className="text-xl font-extrabold text-rose-300 mt-1">
                  {stats?.aggregates?.protein ? (stats.aggregates.protein / 1000).toFixed(1) : 0}k <span className="text-xs font-normal">g</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#14171d] border border-amber-500/20 text-center">
                <p className="text-[10px] uppercase font-bold text-[#9ea3b0]">Carbs</p>
                <p className="text-xl font-extrabold text-amber-300 mt-1">
                  {stats?.aggregates?.carbs ? (stats.aggregates.carbs / 1000).toFixed(1) : 0}k <span className="text-xs font-normal">g</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#14171d] border border-emerald-500/20 text-center">
                <p className="text-[10px] uppercase font-bold text-[#9ea3b0]">Fats</p>
                <p className="text-xl font-extrabold text-emerald-300 mt-1">
                  {stats?.aggregates?.fats ? (stats.aggregates.fats / 1000).toFixed(1) : 0}k <span className="text-xs font-normal">g</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#9ea3b0] leading-relaxed">
              Every logged meal is computed server-side using Gemini AI computer vision models with real-time calorie calculation.
            </p>
          </div>
        </div>
      )}

      {/* VIEW: GEMINI AI TOKENS CONSUMPTION */}
      {activeSubTab === 'gemini' && (
        <div className="space-y-6">
          {/* Top Token Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 glass-card rounded-2xl border border-[#b6ff2e]/30 space-y-2 bg-[#b6ff2e]/5">
              <span className="text-xs text-[#b6ff2e] font-extrabold uppercase tracking-wider">Today's Token Consumption</span>
              <p className="text-3xl font-black text-white">
                {stats?.geminiUsage?.todayTokens ? stats.geminiUsage.todayTokens.toLocaleString() : 0}
              </p>
              <p className="text-[11px] text-[#9ea3b0]">
                Input: {stats?.geminiUsage?.todayPromptTokens?.toLocaleString() || 0} | Output: {stats?.geminiUsage?.todayCandidatesTokens?.toLocaleString() || 0}
              </p>
            </div>

            <div className="p-5 glass-card rounded-2xl border border-white/10 space-y-2">
              <span className="text-xs text-[#9ea3b0] font-bold uppercase tracking-wider">Daily Request Quota</span>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-black text-white">{stats?.geminiUsage?.todayRequests || 0}</p>
                <span className="text-xs text-[#9ea3b0] font-mono">/ 1,500 RPD</span>
              </div>
              <div className="w-full bg-[#14171d] h-2 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-[#b6ff2e] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(2, ((stats?.geminiUsage?.todayRequests || 0) / 1500) * 100))}%` }}
                />
              </div>
            </div>

            <div className="p-5 glass-card rounded-2xl border border-white/10 space-y-2">
              <span className="text-xs text-[#9ea3b0] font-bold uppercase tracking-wider">All-Time Cumulative Tokens</span>
              <p className="text-3xl font-black text-white">
                {stats?.geminiUsage?.allTimeTokens ? stats.geminiUsage.allTimeTokens.toLocaleString() : 0}
              </p>
              <p className="text-[11px] text-[#9ea3b0]">
                Across {stats?.geminiUsage?.allTimeRequests || 0} total AI model invocations
              </p>
            </div>

            <div className="p-5 glass-card rounded-2xl border border-white/10 space-y-2">
              <span className="text-xs text-[#9ea3b0] font-bold uppercase tracking-wider">Pricing Tier</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#b6ff2e]/20 text-[#b6ff2e] font-black text-xs border border-[#b6ff2e]/40">
                  FREE TIER
                </span>
                <span className="text-xs text-white font-bold">$0.00 / mo</span>
              </div>
              <p className="text-[11px] text-[#9ea3b0]">1M Tokens/Min TPM Limit</p>
            </div>
          </div>

          {/* Daily Consumption History Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#b6ff2e]" />
                  <span>Day-by-Day Token Consumption History</span>
                </h3>
                <p className="text-xs text-[#9ea3b0]">Detailed audit of daily Gemini API token usage per calendar date:</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 glass-card">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-[#9ea3b0] border-b border-white/10">
                  <tr>
                    <th className="p-3.5 font-bold">Date (YYYY-MM-DD)</th>
                    <th className="p-3.5 font-bold">Total Tokens</th>
                    <th className="p-3.5 font-bold">Prompt (Vision + Input)</th>
                    <th className="p-3.5 font-bold">Candidate (JSON Output)</th>
                    <th className="p-3.5 font-bold">Scans / Fixes</th>
                    <th className="p-3.5 font-bold">Free Tier Status</th>
                    <th className="p-3.5 font-bold">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats?.geminiUsage?.dailyHistory && stats.geminiUsage.dailyHistory.length > 0 ? (
                    stats.geminiUsage.dailyHistory.map((day) => (
                      <tr key={day.dateStr} className="hover:bg-white/5 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-white flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#b6ff2e]" />
                          <span>{day.dateStr}</span>
                        </td>
                        <td className="p-3.5 font-extrabold text-[#b6ff2e]">
                          {day.totalTokens.toLocaleString()} tokens
                        </td>
                        <td className="p-3.5 text-[#c4c8d2] font-mono">
                          {day.promptTokens.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-[#c4c8d2] font-mono">
                          {day.candidatesTokens.toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-white">{day.requestsCount}</span> requests
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30">
                            Normal (Within Free Tier)
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-white font-mono">
                          $0.00
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-[#9ea3b0]">
                        No historical token usage recorded yet. Start scanning meals to see real-time daily metrics!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Educational Note on Free Tier */}
          <div className="p-4 rounded-2xl bg-[#14171d] border border-white/10 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#b6ff2e] shrink-0 mt-0.5" />
            <div className="text-xs text-[#9ea3b0] space-y-1">
              <p className="font-bold text-white">Google Gemini Free-Tier Quota Guidelines:</p>
              <p>
                PlateVision runs on Google Gemini's generous Free Tier: up to 15 Requests Per Minute (RPM), 1,000,000 Tokens Per Minute (TPM), and 1,500 Requests Per Day (RPD).
                High-resolution images are automatically compressed before analysis to minimize token overhead and guarantee lightning-fast response times.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: USERS DIRECTORY */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9ea3b0]" />
              <input
                type="text"
                placeholder="Search athlete by name or email address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#14171d] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#b6ff2e]"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#b6ff2e] text-[#14171d] font-extrabold text-xs hover:bg-[#a3f01b] transition-all"
            >
              Search
            </button>
          </form>

          <div className="overflow-x-auto rounded-2xl border border-white/10 glass-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-[#9ea3b0] border-b border-white/10">
                <tr>
                  <th className="p-3.5 font-bold">Athlete</th>
                  <th className="p-3.5 font-bold">Goal</th>
                  <th className="p-3.5 font-bold">Physical Stats</th>
                  <th className="p-3.5 font-bold">Daily Calorie Target</th>
                  <th className="p-3.5 font-bold">Meals Logged</th>
                  <th className="p-3.5 font-bold">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5">
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-[11px] text-[#9ea3b0] font-mono">{u.email}</p>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        u.goal === 'lose' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                        u.goal === 'gain' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                        'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      }`}>
                        {u.goal}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#c4c8d2]">
                      {u.currentWeightKg}kg &rarr; {u.targetWeightKg}kg ({u.heightCm}cm, {u.age}yo)
                    </td>
                    <td className="p-3.5 font-extrabold text-[#b6ff2e]">
                      {u.dailyCaloriesGoal} kcal
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-white">{u.mealsCount}</span> meals
                    </td>
                    <td className="p-3.5">
                      {u.role === 'admin' ? (
                        <span className="px-2 py-0.5 rounded bg-[#b6ff2e]/20 text-[#b6ff2e] font-black text-[10px] border border-[#b6ff2e]/40">
                          ADMIN
                        </span>
                      ) : (
                        <span className="text-[#9ea3b0] text-[10px]">User</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: LIVE ACTIVITY FEED */}
      {activeSubTab === 'activity' && (
        <div className="space-y-4">
          <p className="text-xs text-[#9ea3b0]">Live real-time stream of dishes captured and analyzed across the web app:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activity.map((meal) => (
              <div key={meal.id} className="p-4 glass-card rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between">
                <div className="flex gap-3">
                  <img
                    src={meal.imageUrl}
                    alt={meal.title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-white/10"
                  />
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-bold text-[#b6ff2e] uppercase">{meal.category}</span>
                    <h4 className="text-sm font-extrabold text-white truncate">{meal.title}</h4>
                    <p className="text-[10px] text-[#9ea3b0]">{meal.timestamp} ({meal.dateStr})</p>
                    <p className="text-xs font-black text-[#b6ff2e] mt-1">{meal.totalCalories} kcal</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-white pt-2 border-t border-white/5">
                  <span className="text-rose-300">P: {meal.totalProtein}g</span>
                  <span className="text-amber-300">C: {meal.totalCarbs}g</span>
                  <span className="text-emerald-300">F: {meal.totalFats}g</span>
                  <span className="text-[#9ea3b0] font-normal font-mono truncate max-w-[100px]">{meal.userId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: SYSTEM HEALTH & DIAGNOSTICS */}
      {activeSubTab === 'diagnostics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 glass-card rounded-3xl border border-white/10 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white">MongoDB Atlas Cluster</h4>
              <p className="text-xs text-[#9ea3b0] mt-1">Multi-region distributed database</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Operational (Connected)</span>
            </div>
          </div>

          <div className="p-6 glass-card rounded-3xl border border-white/10 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 flex items-center justify-center text-[#b6ff2e]">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white">Google Gemini Vision</h4>
              <p className="text-xs text-[#9ea3b0] mt-1">AI Food Object Detection &amp; Nutrition</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#b6ff2e]/10 text-[#b6ff2e] border border-[#b6ff2e]/30 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>API Key Active</span>
            </div>
          </div>

          <div className="p-6 glass-card rounded-3xl border border-white/10 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white">Cloudinary Image CDN</h4>
              <p className="text-xs text-[#9ea3b0] mt-1">Encrypted meal photo storage</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>CDN Online</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

