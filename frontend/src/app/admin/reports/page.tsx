"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminNavigation from '../AdminNavigation';
import { 
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  DollarSign,
  Download,
  FileText,
  GraduationCap,
  Search,
  Users,
  XCircle
} from 'lucide-react';

type DateRange = '7' | '30' | '90' | '365' | 'all';
type ReportTab = 'overview' | 'users' | 'jobs' | 'events' | 'donations' | 'approvals';
type SeriesKey = 'users' | 'jobs' | 'events' | 'donations';
type ContributorType = 'all' | 'alumni' | 'organization';
type ContributorSort = 'amount' | 'donations' | 'name';

interface MetricCard {
  key: ReportTab;
  title: string;
  value: string;
  deltaPct: number;
  deltaLabel: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'orange' | 'green' | 'pink' | 'yellow';
}

interface ChartPoint {
  period: string;
  users: number;
  jobs: number;
  events: number;
  donations: number;
}

interface UserDistribution {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

interface TopContributor {
  id: number;
  name: string;
  avatar: string;
  amount: number;
  donations: number;
  type: 'alumni' | 'organization';
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeSeries, setActiveSeries] = useState<SeriesKey>('users');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [contributorQuery, setContributorQuery] = useState('');
  const [contributorType, setContributorType] = useState<ContributorType>('all');
  const [contributorSort, setContributorSort] = useState<ContributorSort>('amount');
  const [showAllContributors, setShowAllContributors] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  const stringToSeed = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  const mulberry32 = (seed: number) => {
    let a = seed;
    return () => {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const formatCompact = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString('en-IN');
  };

  const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const formatINRCompact = (n: number) => {
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
    if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
    if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
    return formatINR(n);
  };

  const getColorClasses = (color: MetricCard['color']) => {
    const colors: Record<MetricCard['color'], { bg: string; text: string; border: string; ring: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', ring: 'ring-blue-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', ring: 'ring-purple-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', ring: 'ring-orange-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', ring: 'ring-green-200' },
      pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', ring: 'ring-pink-200' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', ring: 'ring-yellow-200' },
    };
    return colors[color];
  };

  const seriesMeta: Record<SeriesKey, { label: string; color: string; format: (n: number) => string }> = {
    users: { label: 'Users', color: '#3b82f6', format: (n) => n.toLocaleString('en-IN') },
    jobs: { label: 'Jobs', color: '#a855f7', format: (n) => n.toLocaleString('en-IN') },
    events: { label: 'Events', color: '#f97316', format: (n) => n.toLocaleString('en-IN') },
    donations: { label: 'Donations', color: '#22c55e', format: (n) => formatINRCompact(n) },
  };

  const generateChartData = useCallback((range: DateRange): ChartPoint[] => {
    const seed = stringToSeed(`reports:${range}`);
    const rnd = mulberry32(seed);
    const now = new Date();

    const pointsCount = range === '7' ? 7 : range === '30' ? 6 : range === '90' ? 6 : range === '365' ? 12 : 24;
    const stepDays = range === '7' ? 1 : range === '30' ? 5 : range === '90' ? 15 : 30;

    const baseUsers = Math.round(2100 + rnd() * 700);
    const baseJobs = Math.round(120 + rnd() * 90);
    const baseEvents = Math.round(20 + rnd() * 30);
    const baseDonations = Math.round(1_800_000 + rnd() * 3_500_000);

    const data: ChartPoint[] = [];
    let users = baseUsers;
    let jobs = baseJobs;
    let events = baseEvents;
    let donations = baseDonations;

    for (let i = pointsCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * stepDays);
      const label = stepDays === 1
        ? d.toLocaleDateString(undefined, { weekday: 'short' })
        : d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });

      const usersGrowth = 18 + Math.round(rnd() * 35);
      const jobsGrowth = -3 + Math.round(rnd() * 7);
      const eventsGrowth = -1 + Math.round(rnd() * 4);
      const donationsGrowth = -120_000 + Math.round(rnd() * 350_000);

      users = Math.max(0, users + usersGrowth);
      jobs = Math.max(0, jobs + jobsGrowth);
      events = Math.max(0, events + eventsGrowth);
      donations = Math.max(0, donations + donationsGrowth);

      data.push({
        period: label,
        users,
        jobs,
        events,
        donations,
      });
    }

    return data;
  }, []);

  const chartData = useMemo(() => generateChartData(dateRange), [dateRange, generateChartData]);

  const derived = useMemo(() => {
    const seed = stringToSeed(`reports:derived:${dateRange}`);
    const rnd = mulberry32(seed);

    const current = chartData[chartData.length - 1];
    const prev = chartData[Math.max(0, chartData.length - 2)];

    const delta = (curr: number, p: number) => {
      const denom = p === 0 ? 1 : p;
      return ((curr - p) / denom) * 100;
    };

    const engagementCurrent = clamp(0.58 + rnd() * 0.18, 0.4, 0.95);
    const engagementPrev = clamp(engagementCurrent - (0.01 + rnd() * 0.03) * (rnd() > 0.5 ? -1 : 1), 0.35, 0.95);

    const pendingApprovals = Math.round(12 + rnd() * 20);
    const pendingPrev = Math.max(0, pendingApprovals + Math.round(-4 + rnd() * 8));

    const approvalsApproved = Math.round(220 + rnd() * 220);
    const approvalsRejected = Math.round(12 + rnd() * 40);

    const alumniPct = clamp(0.66 + rnd() * 0.14, 0.55, 0.85);
    const studentsPct = clamp(0.12 + rnd() * 0.18, 0.10, 0.35);
    const adminsPct = clamp(1 - alumniPct - studentsPct, 0.02, 0.07);

    const totalUsers = current.users;
    const alumni = Math.round(totalUsers * alumniPct);
    const students = Math.round(totalUsers * studentsPct);
    const admins = Math.max(1, totalUsers - alumni - students);

    return {
      current,
      prev,
      deltas: {
        users: delta(current.users, prev.users),
        jobs: delta(current.jobs, prev.jobs),
        events: delta(current.events, prev.events),
        donations: delta(current.donations, prev.donations),
        engagement: delta(engagementCurrent, engagementPrev),
        pending: delta(pendingApprovals, pendingPrev),
      },
      engagement: {
        current: engagementCurrent,
        prev: engagementPrev,
      },
      approvals: {
        pending: pendingApprovals,
        pendingPrev,
        approved: approvalsApproved,
        rejected: approvalsRejected,
      },
      distribution: {
        alumni,
        students,
        admins,
        total: totalUsers,
      },
    };
  }, [chartData, dateRange]);

  const metrics: MetricCard[] = useMemo(() => {
    const upDownLabel = (pct: number) => (pct >= 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`);

    return [
      {
        key: 'users',
        title: 'Total Users',
        value: derived.current.users.toLocaleString('en-IN'),
        deltaPct: derived.deltas.users,
        deltaLabel: `${upDownLabel(derived.deltas.users)} vs previous period`,
        icon: <Users className="w-4 h-4" />,
        color: 'blue',
      },
      {
        key: 'jobs',
        title: 'Active Jobs',
        value: derived.current.jobs.toLocaleString('en-IN'),
        deltaPct: derived.deltas.jobs,
        deltaLabel: `${upDownLabel(derived.deltas.jobs)} vs previous period`,
        icon: <Briefcase className="w-4 h-4" />,
        color: 'purple',
      },
      {
        key: 'events',
        title: 'Events Hosted',
        value: derived.current.events.toLocaleString('en-IN'),
        deltaPct: derived.deltas.events,
        deltaLabel: `${upDownLabel(derived.deltas.events)} vs previous period`,
        icon: <Calendar className="w-4 h-4" />,
        color: 'orange',
      },
      {
        key: 'donations',
        title: 'Total Donations',
        value: formatINRCompact(derived.current.donations),
        deltaPct: derived.deltas.donations,
        deltaLabel: `${upDownLabel(derived.deltas.donations)} vs previous period`,
        icon: <DollarSign className="w-4 h-4" />,
        color: 'green',
      },
      {
        key: 'overview',
        title: 'Engagement Rate',
        value: `${(derived.engagement.current * 100).toFixed(1)}%`,
        deltaPct: derived.deltas.engagement,
        deltaLabel: `${upDownLabel(derived.deltas.engagement)} vs previous period`,
        icon: <Activity className="w-4 h-4" />,
        color: 'pink',
      },
      {
        key: 'approvals',
        title: 'Pending Approvals',
        value: derived.approvals.pending.toLocaleString('en-IN'),
        deltaPct: derived.deltas.pending,
        deltaLabel: `${upDownLabel(derived.deltas.pending)} vs previous period`,
        icon: <Clock className="w-4 h-4" />,
        color: 'yellow',
      },
    ];
  }, [derived]);

  const userDistribution: UserDistribution[] = useMemo(() => {
    const total = derived.distribution.total || 1;
    const mk = (category: string, value: number, color: string) => ({
      category,
      value,
      percentage: +((value / total) * 100).toFixed(1),
      color,
    });
    return [
      mk('Alumni', derived.distribution.alumni, 'bg-blue-500'),
      mk('Students', derived.distribution.students, 'bg-purple-500'),
      mk('Admins', derived.distribution.admins, 'bg-orange-500'),
    ];
  }, [derived.distribution]);

  const topContributors: TopContributor[] = useMemo(() => {
    const seed = stringToSeed(`reports:contributors:${dateRange}`);
    const rnd = mulberry32(seed);
    const alumniNames = ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Joshi', 'Karan Verma', 'Nisha Gupta', 'Aditya Nair', 'Meera Iyer'];
    const orgNames = ['Infosys Foundation', 'Tech Mahindra', 'Tata Trusts', 'Wipro Cares', 'HCL Foundation', 'Accenture India'];

    const rows: TopContributor[] = [];
    let id = 1;

    for (let i = 0; i < 10; i++) {
      const isOrg = rnd() > 0.62;
      const name = isOrg
        ? orgNames[Math.floor(rnd() * orgNames.length)]
        : alumniNames[Math.floor(rnd() * alumniNames.length)];
      const initials = name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('');

      const donations = isOrg ? Math.max(1, Math.round(1 + rnd() * 4)) : Math.max(1, Math.round(4 + rnd() * 18));
      const amountBase = isOrg ? 250_000 : 45_000;
      const amount = Math.round(amountBase + rnd() * (isOrg ? 1_250_000 : 320_000));

      rows.push({
        id: id++,
        name,
        avatar: initials || (isOrg ? 'ORG' : 'AL'),
        amount,
        donations,
        type: isOrg ? 'organization' : 'alumni',
      });
    }

    // Dedupe by name
    const unique = Array.from(new Map(rows.map((r) => [r.name, r])).values());
    return unique;
  }, [dateRange]);

  const visibleSeries: SeriesKey = useMemo(() => {
    if (activeTab === 'users') return 'users';
    if (activeTab === 'jobs') return 'jobs';
    if (activeTab === 'events') return 'events';
    if (activeTab === 'donations') return 'donations';
    return activeSeries;
  }, [activeSeries, activeTab]);

  const exportCsv = useCallback(() => {
    const keys: SeriesKey[] = activeTab === 'overview'
      ? ['users', 'jobs', 'events', 'donations']
      : activeTab === 'users'
        ? ['users']
        : activeTab === 'jobs'
          ? ['jobs']
          : activeTab === 'events'
            ? ['events']
            : activeTab === 'donations'
              ? ['donations']
              : ['users', 'jobs', 'events', 'donations'];

    const header = ['Period', ...keys.map((k) => seriesMeta[k].label)];
    const rows = chartData.map((p) => [
      p.period,
      ...keys.map((k) => String(p[k])),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => {
        const escaped = String(cell).replace(/\"/g, '""');
        return `"${escaped}"`;
      }).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-${activeTab}-${dateRange}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [activeTab, chartData, dateRange, seriesMeta]);

  const handleExport = useCallback((format: 'pdf' | 'excel' | 'csv') => {
    if (format === 'csv') {
      exportCsv();
      setShowExportMenu(false);
      return;
    }
    alert('Export currently supports CSV in this demo page.');
    setShowExportMenu(false);
  }, [exportCsv]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showExportMenu) return;
      const target = e.target as Node;
      if (exportMenuRef.current && !exportMenuRef.current.contains(target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showExportMenu]);

  const contributorsFiltered = useMemo(() => {
    const q = contributorQuery.trim().toLowerCase();
    const byQuery = (c: TopContributor) => (q ? c.name.toLowerCase().includes(q) : true);
    const byType = (c: TopContributor) => contributorType === 'all' ? true : c.type === contributorType;
    const sorted = [...topContributors]
      .filter((c) => byType(c) && byQuery(c))
      .sort((a, b) => {
        if (contributorSort === 'name') return a.name.localeCompare(b.name);
        if (contributorSort === 'donations') return b.donations - a.donations;
        return b.amount - a.amount;
      });
    return sorted;
  }, [contributorQuery, contributorSort, contributorType, topContributors]);

  const contributorsVisible = useMemo(() => {
    return showAllContributors ? contributorsFiltered : contributorsFiltered.slice(0, 5);
  }, [contributorsFiltered, showAllContributors]);

  const tabs: { key: ReportTab; label: string; hint: string }[] = [
    { key: 'overview', label: 'Overview', hint: 'All key metrics' },
    { key: 'users', label: 'Users', hint: 'Registrations & growth' },
    { key: 'jobs', label: 'Jobs', hint: 'Postings & activity' },
    { key: 'events', label: 'Events', hint: 'Hosted & scheduled' },
    { key: 'donations', label: 'Donations', hint: 'Contributions & donors' },
    { key: 'approvals', label: 'Approvals', hint: 'Review & processing' },
  ];

  const Chart = ({ metric }: { metric: SeriesKey }) => {
    const values = chartData.map((p) => p[metric]);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const width = 720;
    const height = 240;
    const pad = 28;

    const xFor = (i: number) => {
      if (values.length <= 1) return pad;
      return pad + (i / (values.length - 1)) * (width - pad * 2);
    };

    const yFor = (v: number) => {
      const denom = max - min || 1;
      const t = (v - min) / denom;
      return pad + (1 - t) * (height - pad * 2);
    };

    const points = values.map((v, i) => ({ x: xFor(i), y: yFor(v), v, i }));
    const d = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');
    const area = `${d} L ${xFor(values.length - 1)} ${height - pad} L ${xFor(0)} ${height - pad} Z`;

    const active = hoverIndex == null ? points[points.length - 1] : points[hoverIndex];
    const meta = seriesMeta[metric];

    return (
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{meta.label} Trend</h3>
            <p className="text-sm text-gray-500 mt-1">Interactive timeline • hover for details</p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'overview' && (
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
                {(['users', 'jobs', 'events', 'donations'] as SeriesKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setActiveSeries(k)}
                    className={
                      `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ` +
                      (activeSeries === k ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-600 hover:text-gray-900')
                    }
                  >
                    {seriesMeta[k].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50 p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}>
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{active?.i != null ? chartData[active.i]?.period : ''}</p>
                <p className="text-xl font-bold text-gray-900">{meta.format(active?.v ?? values[values.length - 1])}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Range</p>
              <p className="text-sm font-semibold text-gray-900">{chartData[0]?.period} → {chartData[chartData.length - 1]?.period}</p>
            </div>
          </div>

          <div
            className="w-full"
            onMouseLeave={() => setHoverIndex(null)}
            onMouseMove={(e) => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * width;
              const idx = Math.round(((x - pad) / (width - pad * 2)) * (values.length - 1));
              setHoverIndex(clamp(idx, 0, values.length - 1));
            }}
          >
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[240px]">
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={meta.color} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={meta.color} stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid */}
              {[0, 1, 2, 3].map((i) => {
                const y = pad + (i / 3) * (height - pad * 2);
                return <line key={i} x1={pad} y1={y} x2={width - pad} y2={y} stroke="#E5E7EB" strokeDasharray="4 6" />;
              })}

              <path d={area} fill="url(#area)" />
              <path d={d} fill="none" stroke={meta.color} strokeWidth="3" strokeLinecap="round" />

              {points.map((p) => (
                <circle
                  key={p.i}
                  cx={p.x}
                  cy={p.y}
                  r={hoverIndex === p.i ? 6 : 4}
                  fill={meta.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                  opacity={hoverIndex == null || hoverIndex === p.i ? 1 : 0.25}
                />
              ))}

              {active && (
                <>
                  <line x1={active.x} y1={pad} x2={active.x} y2={height - pad} stroke="#9CA3AF" strokeDasharray="4 6" />
                </>
              )}

              {/* X labels */}
              {chartData.map((p, i) => {
                if (chartData.length > 12 && i % 3 !== 0 && i !== chartData.length - 1) return null;
                if (chartData.length > 7 && chartData.length <= 12 && i % 2 !== 0 && i !== chartData.length - 1) return null;
                const x = xFor(i);
                return (
                  <text
                    key={p.period}
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#6B7280"
                  >
                    {p.period}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-500">Avg</p>
              <p className="text-lg font-bold text-gray-900">{meta.format(Math.round(values.reduce((s, v) => s + v, 0) / values.length))}</p>
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="text-xs text-gray-500">Max</p>
              <p className="text-lg font-bold text-gray-900">{meta.format(max)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Change</p>
              <p className="text-lg font-bold text-gray-900">
                {(() => {
                  const first = values[0] || 1;
                  const last = values[values.length - 1] || 0;
                  const pct = ((last - first) / first) * 100;
                  const isUp = pct >= 0;
                  return (
                    <span className={isUp ? 'text-green-600' : 'text-red-600'}>
                      {isUp ? '+' : ''}{pct.toFixed(1)}%
                    </span>
                  );
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminNavigation>
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-2">Professional reporting with interactive insights</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Filter */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="appearance-none pl-4 pr-10 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-300 transition-all cursor-pointer font-medium text-sm"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
                <option value="all">All time</option>
              </select>
              <Calendar className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Export Button */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export Report</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Export as PDF
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                  >
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    Export as Excel
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                  >
                    <Download className="w-4 h-4 inline mr-2" />
                    Export as CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ` +
                (activeTab === t.key
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
                  : 'text-gray-700 hover:bg-gray-50')
              }
              title={t.hint}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric, index) => {
            const colors = getColorClasses(metric.color);
            const isSelected = activeTab === metric.key;
            const isUp = metric.deltaPct >= 0;
            return (
              <div 
                key={index}
                onClick={() => setActiveTab(metric.key)}
                className={
                  `bg-white rounded-2xl shadow-sm border p-6 transition-all duration-300 cursor-pointer ` +
                  (isSelected
                    ? `border-gray-200 ring-2 ${colors.ring} shadow-md`
                    : 'border-gray-100 hover:shadow-lg hover:scale-[1.01]')
                }
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-9 h-9 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text}`}>
                    {metric.icon}
                  </div>
                  <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    <span>{Math.abs(metric.deltaPct).toFixed(1)}%</span>
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{metric.title}</h3>
                <p className="text-3xl font-bold text-gray-900 mb-2">{metric.value}</p>
                <p className="text-sm text-gray-500">{metric.deltaLabel}</p>
              </div>
            );
          })}
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <Chart metric={visibleSeries} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">User Distribution</h3>
            <p className="text-sm text-gray-500 mb-6">Breakdown by user type</p>

            <div className="relative h-48 mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {userDistribution.reduce((acc, item, index) => {
                      const prevPercentage = userDistribution.slice(0, index).reduce((sum, d) => sum + d.percentage, 0);
                      const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
                      const strokeDashoffset = -prevPercentage;
                      const colors: Record<string, string> = {
                        'bg-blue-500': '#3b82f6',
                        'bg-purple-500': '#a855f7',
                        'bg-orange-500': '#f97316',
                      };
                      acc.push(
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r="15.915"
                          fill="transparent"
                          stroke={colors[item.color]}
                          strokeWidth="31.831"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300 hover:opacity-80"
                        />
                      );
                      return acc;
                    }, [] as React.ReactNode[])}
                  </svg>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{formatCompact(userDistribution.reduce((sum, d) => sum + d.value, 0))}</p>
                      <p className="text-xs text-gray-500">Total Users</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {userDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{item.category}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-gray-900">{item.value.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-gray-500 w-12 text-right">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Contributors */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Top Contributors</h3>
                <p className="text-sm text-gray-500 mt-1">Highest donation amounts</p>
              </div>
              <button
                onClick={() => setShowAllContributors((s) => !s)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <span>{showAllContributors ? 'Show Less' : 'View All'}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={contributorQuery}
                  onChange={(e) => setContributorQuery(e.target.value)}
                  placeholder="Search contributors..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={contributorType}
                  onChange={(e) => setContributorType(e.target.value as ContributorType)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="alumni">Alumni</option>
                  <option value="organization">Organizations</option>
                </select>
                <select
                  value={contributorSort}
                  onChange={(e) => setContributorSort(e.target.value as ContributorSort)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="amount">Sort: Amount</option>
                  <option value="donations">Sort: Donations</option>
                  <option value="name">Sort: Name</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contributor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Donations</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {contributorsVisible.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                      No contributors match your filters.
                    </td>
                  </tr>
                ) : contributorsVisible.map((contributor, index) => (
                  <tr key={contributor.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {index + 1}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center font-semibold text-sm text-gray-600">
                            {index + 1}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {contributor.avatar}
                        </div>
                        <span className="ml-3 text-sm font-semibold text-gray-900">{contributor.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        contributor.type === 'alumni' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {contributor.type === 'alumni' ? (
                          <GraduationCap className="w-3 h-3 mr-1" />
                        ) : (
                          <Award className="w-3 h-3 mr-1" />
                        )}
                        {contributor.type.charAt(0).toUpperCase() + contributor.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{contributor.donations}</span>
                      <span className="text-sm text-gray-500 ml-1">donations</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-green-600">{formatINR(contributor.amount)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Approval Statistics */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Approval Statistics</h3>
                <p className="text-sm text-gray-500">Live operational view</p>
              </div>
              <button
                onClick={() => setActiveTab('approvals')}
                className="text-sm font-semibold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors"
              >
                Open Approvals
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Approved</p>
                    <p className="text-xs text-gray-500">Successfully processed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{derived.approvals.approved}</p>
                  <p className="text-xs text-green-600">{derived.deltas.users >= 0 ? '+' : ''}{Math.abs(derived.deltas.users).toFixed(1)}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Rejected</p>
                    <p className="text-xs text-gray-500">Did not meet criteria</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">{derived.approvals.rejected}</p>
                  <p className="text-xs text-red-600">Quality gate</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Pending</p>
                    <p className="text-xs text-gray-500">Awaiting review</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-700">{derived.approvals.pending}</p>
                  <p className="text-xs text-yellow-700">{derived.deltas.pending >= 0 ? '+' : ''}{derived.deltas.pending.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Quick Statistics</h3>
            <p className="text-sm text-gray-500 mb-6">At-a-glance operational metrics</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-600 bg-blue-200 px-2 py-0.5 rounded-full">Today</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mb-1">{Math.max(6, Math.round(chartData[chartData.length - 1].users * 0.012))}</p>
                <p className="text-xs text-blue-700">New Registrations</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-600 bg-purple-200 px-2 py-0.5 rounded-full">Active</span>
                </div>
                <p className="text-2xl font-bold text-purple-900 mb-1">{derived.current.jobs}</p>
                <p className="text-xs text-purple-700">Job Postings</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <span className="text-xs font-semibold text-orange-600 bg-orange-200 px-2 py-0.5 rounded-full">This Month</span>
                </div>
                <p className="text-2xl font-bold text-orange-900 mb-1">{Math.max(0, derived.current.events)}</p>
                <p className="text-xs text-orange-700">Events Scheduled</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <span className="text-xs font-semibold text-green-600 bg-green-200 px-2 py-0.5 rounded-full">Live</span>
                </div>
                <p className="text-2xl font-bold text-green-900 mb-1">{(derived.engagement.current * 100).toFixed(1)}%</p>
                <p className="text-xs text-green-700">Engagement Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminNavigation>
  );
}
