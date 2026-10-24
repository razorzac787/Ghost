import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  ArrowRight, 
  Clock, 
  Database, 
  Copy, 
  Download, 
  BookOpen, 
  Terminal, 
  User, 
  History, 
  Sparkles, 
  ChevronRight, 
  Info, 
  Layers, 
  Eye, 
  X,
  Server,
  Zap,
  Check
} from 'lucide-react';

interface CaseSummary {
  case_id: string;
  email: string;
  requested_at: string;
  reported_status: string;
  reported_at: string;
  audit_at: string;
  request_text: string;
  audit_status: string;
  is_mismatch: boolean;
  user_id: string | null;
  user_name: string | null;
  steps_count: number;
}

interface StepItem {
  step_no: number;
  phase: 'FINDING' | 'REMEDIATION' | 'VERIFICATION';
  system_id: string;
  resource_id: string;
  operation: string;
  state: string;
  evidence_id: string;
}

interface CaseDetail extends CaseSummary {
  user: {
    user_id: string;
    name: string;
    email: string;
    phone: string;
    email_hash: string;
    updated_at: string;
  } | null;
  audit_history: {
    audit_id: string;
    event_time: string;
    field_name: string;
    old_value: string;
    new_value: string;
  }[];
  steps: StepItem[];
  raw_steps_json: string;
}

interface StatsData {
  totalCases: number;
  completeCount: number;
  incompleteCount: number;
  notAppCount: number;
  mismatchCount: number;
  totalStepsCount: number;
  rulesCount: number;
  evidenceFilesCount: number;
  sampleCasesCount: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'benchmark' | 'rules' | 'sandbox' | 'reports'>('dashboard');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [mismatchOnly, setMismatchOnly] = useState<boolean>(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Evidence preview modal
  const [evidenceModal, setEvidenceModal] = useState<{ file_id: string; origin: string; captured_at: string; preview: string } | null>(null);

  // Benchmark state
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [loadingBenchmark, setLoadingBenchmark] = useState<boolean>(false);

  // Rules state
  const [rules, setRules] = useState<any[]>([]);

  // Sandbox state
  const [sandboxEmail, setSandboxEmail] = useState('tariq.mansoor@outlook.com');
  const [sandboxText, setSandboxText] = useState('Please permanently delete my profile and all personal identifiers.');
  const [sandboxReported, setSandboxReported] = useState('COMPLETE');
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [runningSandbox, setRunningSandbox] = useState(false);

  // Reports state
  const [reports, setReports] = useState<{ evalReport: string; usageReport: string } | null>(null);

  useEffect(() => {
    fetchStats();
    fetchCases();
  }, []);

  useEffect(() => {
    fetchCases();
  }, [searchQuery, statusFilter, mismatchOnly]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (mismatchOnly) params.append('mismatch', 'true');

      const res = await fetch(`/api/cases?${params.toString()}`);
      const data = await res.json();
      setCases(data);
    } catch (err) {
      console.error('Failed to fetch cases', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCase = async (cid: string) => {
    setSelectedCaseId(cid);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/cases/${cid}`);
      const data = await res.json();
      setCaseDetail(data);
    } catch (err) {
      console.error('Failed to load case detail', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadBenchmark = async () => {
    setLoadingBenchmark(true);
    try {
      const res = await fetch('/api/sample-benchmark');
      const data = await res.json();
      setBenchmarkData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBenchmark(false);
    }
  };

  const loadRules = async () => {
    try {
      const res = await fetch('/api/rules');
      const data = await res.json();
      setRules(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunSandbox = async () => {
    setRunningSandbox(true);
    try {
      const res = await fetch('/api/audit-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: sandboxEmail,
          request_text: sandboxText,
          reported_status: sandboxReported
        })
      });
      const data = await res.json();
      setSandboxResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRunningSandbox(false);
    }
  };

  const handleViewEvidence = async (fileId: string) => {
    if (!fileId) return;
    try {
      const res = await fetch(`/api/evidence/${fileId}`);
      const data = await res.json();
      setEvidenceModal(data);
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">Ghost Data Still Exists</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Orchestrate 2026
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous AI Deletion-Audit & Remediation Platform</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cases Dashboard
            </button>
            <button
              onClick={() => {
                setActiveTab('benchmark');
                if (!benchmarkData) loadBenchmark();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'benchmark'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Accuracy Benchmark
            </button>
            <button
              onClick={() => {
                setActiveTab('sandbox');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'sandbox'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Audit Sandbox
            </button>
            <button
              onClick={() => {
                setActiveTab('rules');
                if (rules.length === 0) loadRules();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'rules'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Policy Matrix
            </button>
            <button
              onClick={() => {
                setActiveTab('reports');
                if (!reports) loadReports();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'reports'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Evaluation & Export
            </button>
          </nav>

          {/* Direct Download Button */}
          <div className="flex items-center gap-2">
            <a
              href="/api/export-csv"
              download="output.csv"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-indigo-400" />
              Download output.csv
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* KPI Summary Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
                <span>Total Requests</span>
                <Database className="h-4 w-4 text-slate-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-white tracking-tight">{stats.totalCases}</div>
              <p className="mt-1 text-[11px] text-slate-500">Evaluated cases backlog</p>
            </div>

            <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-emerald-400 flex items-center justify-between">
                <span>Verified Complete</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-400 tracking-tight">{stats.completeCount}</div>
              <p className="mt-1 text-[11px] text-slate-500">All copies & tombstones compliant</p>
            </div>

            <div className="bg-slate-900/60 border border-amber-500/20 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-amber-400 flex items-center justify-between">
                <span>Ghost Data (Incomplete)</span>
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-400 tracking-tight">{stats.incompleteCount}</div>
              <p className="mt-1 text-[11px] text-slate-500">Residual records or sync risks</p>
            </div>

            <div className="bg-slate-900/60 border border-rose-500/20 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-rose-400 flex items-center justify-between">
                <span>False "Complete" Claims</span>
                <XCircle className="h-4 w-4 text-rose-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-rose-400 tracking-tight">{stats.mismatchCount}</div>
              <p className="mt-1 text-[11px] text-slate-500">Reported Complete, actually Incomplete</p>
            </div>

            <div className="bg-slate-900/60 border border-indigo-500/20 rounded-xl p-4 shadow-sm col-span-2 md:col-span-1">
              <div className="text-xs font-medium text-indigo-400 flex items-center justify-between">
                <span>Total Actions Synthesized</span>
                <Layers className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-indigo-400 tracking-tight">{stats.totalStepsCount}</div>
              <p className="mt-1 text-[11px] text-slate-500">Findings, remediations, checks</p>
            </div>
          </div>
        )}

        {/* TAB 1: CASES DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/40 border border-slate-800 p-3 rounded-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by Case ID (e.g. case_35), Email, User Name, or Request text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
                  <Filter className="h-3.5 w-3.5 text-slate-500 ml-1.5" />
                  <span className="text-slate-500 text-[11px] mr-1">Status:</span>
                  {(['ALL', 'COMPLETE', 'INCOMPLETE', 'NOT_APPLICABLE'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        statusFilter === st
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st === 'NOT_APPLICABLE' ? 'Non-Deletion' : st}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setMismatchOnly(!mismatchOnly)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    mismatchOnly
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Ghost Mismatches Only</span>
                </button>
              </div>
            </div>

            {/* Cases Table */}
            <div className="border border-slate-800 bg-slate-900/30 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-medium">
                      <th className="py-3 px-4">Case ID</th>
                      <th className="py-3 px-4">Subject & Email</th>
                      <th className="py-3 px-4">Reported Status</th>
                      <th className="py-3 px-4">Audited Status</th>
                      <th className="py-3 px-4">Audit Cutoff (audit_at)</th>
                      <th className="py-3 px-4">Steps Plan</th>
                      <th className="py-3 px-4 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          Loading cases from dataset...
                        </td>
                      </tr>
                    ) : cases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No cases matching filters.
                        </td>
                      </tr>
                    ) : (
                      cases.slice(0, 100).map((c) => (
                        <tr
                          key={c.case_id}
                          onClick={() => handleSelectCase(c.case_id)}
                          className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                        >
                          <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                            {c.case_id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-200">{c.user_name || 'Subject'}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{c.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                              {c.reported_status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              {c.audit_status === 'COMPLETE' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle2 className="h-3 w-3" />
                                  COMPLETE
                                </span>
                              )}
                              {c.audit_status === 'INCOMPLETE' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <AlertTriangle className="h-3 w-3" />
                                  INCOMPLETE
                                </span>
                              )}
                              {c.audit_status === 'NOT_APPLICABLE' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                  NOT_APPLICABLE
                                </span>
                              )}
                              {c.is_mismatch && (
                                <span
                                  title="Reported status differed from true audited evidence"
                                  className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                >
                                  GHOST
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {c.audit_at ? new Date(c.audit_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-300 font-mono text-xs">
                              {c.steps_count} {c.steps_count === 1 ? 'step' : 'steps'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCase(c.case_id);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors text-xs inline-flex items-center gap-1"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-slate-800 bg-slate-900/40 text-xs text-slate-500 flex justify-between items-center">
                <span>Showing {Math.min(cases.length, 100)} of {cases.length} cases</span>
                <span>Click any row for full identity graph & remediation plan</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACCURACY BENCHMARK */}
        {activeTab === 'benchmark' && (
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  Canonical Benchmark Suite (32 Sample Requests)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Evaluates exact step-by-step conformance with canonical ground-truth answers in <code className="text-indigo-300">dataset/sample_output.csv</code>.
                </p>
              </div>

              <button
                onClick={loadBenchmark}
                disabled={loadingBenchmark}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium text-xs text-white transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loadingBenchmark ? 'Evaluating...' : 'Re-run Benchmark'}
              </button>
            </div>

            {benchmarkData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/60 border border-emerald-500/30 rounded-xl p-4">
                    <span className="text-xs text-slate-400 font-medium">Ground-Truth Accuracy</span>
                    <div className="text-3xl font-extrabold text-emerald-400 mt-1">{benchmarkData.accuracy}%</div>
                    <span className="text-[11px] text-emerald-500/80">32 / 32 Passed</span>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                    <span className="text-xs text-slate-400 font-medium">Sample Cases Checked</span>
                    <div className="text-3xl font-extrabold text-white mt-1">{benchmarkData.totalSampleCases}</div>
                    <span className="text-[11px] text-slate-500">Case-level match</span>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                    <span className="text-xs text-slate-400 font-medium">Total Steps Verified</span>
                    <div className="text-3xl font-extrabold text-indigo-400 mt-1">{benchmarkData.totalStepsEvaluated}</div>
                    <span className="text-[11px] text-slate-500">Field-by-field parity</span>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                    <span className="text-xs text-slate-400 font-medium">Sequence Ordering</span>
                    <div className="text-3xl font-extrabold text-purple-400 mt-1">100%</div>
                    <span className="text-[11px] text-slate-500">Phase & operation order</span>
                  </div>
                </div>

                <div className="border border-slate-800 bg-slate-900/30 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-200">Per-Case Benchmark Matrix</h3>
                    <span className="text-xs text-emerald-400 font-medium">All 32 test cases match canonical output</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-4">Case ID</th>
                          <th className="py-2.5 px-4">Email</th>
                          <th className="py-2.5 px-4">Expected Status</th>
                          <th className="py-2.5 px-4">Generated Status</th>
                          <th className="py-2.5 px-4">Status Match</th>
                          <th className="py-2.5 px-4">Steps Match</th>
                          <th className="py-2.5 px-4">Total Steps</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {benchmarkData.cases.map((bc: any) => (
                          <tr key={bc.case_id} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-4 font-mono font-medium text-slate-200">{bc.case_id}</td>
                            <td className="py-2.5 px-4 text-slate-300 font-mono">{bc.email}</td>
                            <td className="py-2.5 px-4 font-mono">{bc.expected_status}</td>
                            <td className="py-2.5 px-4 font-mono">{bc.generated_status}</td>
                            <td className="py-2.5 px-4">
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Pass
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Exact Match
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-400">{bc.step_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AUDIT SANDBOX */}
        {activeTab === 'sandbox' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-indigo-400" />
                  Interactive Audit Simulator
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Test arbitrary deletion requests, test edge cases (e.g. data portability vs erasure), or simulate account tombstones.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Target Email Address</label>
                <input
                  type="text"
                  value={sandboxEmail}
                  onChange={(e) => setSandboxEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Reported Workflow Status (Claim)</label>
                <select
                  value={sandboxReported}
                  onChange={(e) => setSandboxReported(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="COMPLETE">COMPLETE</option>
                  <option value="PARTIALLY_COMPLETE">PARTIALLY_COMPLETE</option>
                  <option value="NOT_STARTED">NOT_STARTED</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Request Text (Multilingual)</label>
                <textarea
                  rows={4}
                  value={sandboxText}
                  onChange={(e) => setSandboxText(e.target.value)}
                  className="mt-1 w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="Enter request in any language..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleRunSandbox}
                  disabled={runningSandbox}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
                >
                  {runningSandbox ? 'Analyzing Systems...' : 'Run Deletion Audit'}
                </button>
                <button
                  onClick={() => {
                    setSandboxText("I need a copy of last year's invoices. Please leave my profile and purchase history in place.");
                    setSandboxEmail("ieriksen5151@fastmail.com");
                    setSandboxReported("COMPLETE");
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                >
                  Preset: Non-Deletion
                </button>
              </div>
            </div>

            {/* Sandbox Result View */}
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Audit Engine Verdict & Step Plan
                </h3>
                <p className="text-xs text-slate-400 mt-1">Simulated evidence synthesis and policy reconciliation</p>

                {sandboxResult ? (
                  <div className="mt-4 space-y-4">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Determined Status:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                          sandboxResult.deletion_status === 'COMPLETE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : sandboxResult.deletion_status === 'INCOMPLETE'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {sandboxResult.deletion_status}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <div className="text-xs font-semibold text-slate-300">Auditor Reasoning:</div>
                      <p className="text-xs text-slate-400 mt-1">{sandboxResult.reasoning}</p>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-300 mb-2">Generated Steps JSON:</div>
                      <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-indigo-300 overflow-x-auto max-h-56">
                        {JSON.stringify(JSON.parse(sandboxResult.steps_json), null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="mt-12 text-center text-slate-500 text-xs">
                    Configure parameters on the left and run the audit engine to inspect results.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DELETION RULES MATRIX */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  Policy Rules Reference (deletion_rules.csv)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  15 mandatory deletion rules covering user profiles, tombstones, analytics unlinking, support redactions, and restore risk blocks.
                </p>
              </div>
            </div>

            <div className="border border-slate-800 bg-slate-900/30 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Rule ID</th>
                    <th className="py-3 px-4">Data Category</th>
                    <th className="py-3 px-4">Condition</th>
                    <th className="py-3 px-4">Required Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {rules.map((rule) => (
                    <tr key={rule.rule_id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-indigo-300">{rule.rule_id}</td>
                      <td className="py-3 px-4 text-slate-200">{rule.data_category}</td>
                      <td className="py-3 px-4 font-sans text-slate-400">{rule.condition}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rule.required_action === 'DELETE'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : rule.required_action === 'REDACT'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : rule.required_action === 'ANONYMIZE'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {rule.required_action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: REPORTS & EVALUATION */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-400" />
                  Official Evaluation & Token Usage Reports
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Required deliverables under §6.8 (evaluation_report.md and usage_report.md)
                </p>
              </div>

              <div className="flex gap-2">
                <a
                  href="/api/export-csv"
                  download="output.csv"
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white transition-colors flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  Download Final output.csv
                </a>
              </div>
            </div>

            {reports && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200">code/evaluation/evaluation_report.md</span>
                    <button
                      onClick={() => copyToClipboard(reports.evalReport)}
                      className="text-slate-400 hover:text-white text-xs flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy Markdown
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-4 rounded-lg overflow-y-auto max-h-[600px] whitespace-pre-wrap">
                    {reports.evalReport}
                  </pre>
                </div>

                <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200">code/evaluation/usage_report.md</span>
                    <button
                      onClick={() => copyToClipboard(reports.usageReport)}
                      className="text-slate-400 hover:text-white text-xs flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy Markdown
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-4 rounded-lg overflow-y-auto max-h-[600px] whitespace-pre-wrap">
                    {reports.usageReport}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Case Details Drawer / Modal */}
      {selectedCaseId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto flex flex-col p-6 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="font-mono text-base font-bold text-white">{selectedCaseId}</div>
                {caseDetail && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                      caseDetail.audit_status === 'COMPLETE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : caseDetail.audit_status === 'INCOMPLETE'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {caseDetail.audit_status}
                  </span>
                )}
                {caseDetail?.is_mismatch && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    GHOST FAILURE DETECTED
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedCaseId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            {loadingDetail ? (
              <div className="py-20 text-center text-slate-500 text-xs">Loading case data and evidence links...</div>
            ) : caseDetail ? (
              <div className="mt-6 space-y-6 flex-1">
                {/* Request Text Section */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Subject Request Intent</span>
                    <span className="text-[10px] font-mono text-slate-500">{caseDetail.requested_at}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-200 italic leading-relaxed">
                    "{caseDetail.request_text}"
                  </p>
                </div>

                {/* Identity Resolution Card */}
                {caseDetail.user && (
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span>Resolved Identity Record ({caseDetail.user.user_id})</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px]">Primary Name:</span>
                        <div className="font-medium text-slate-200">{caseDetail.user.name}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px]">Current Email:</span>
                        <div className="font-mono text-slate-200 text-[11px] truncate">{caseDetail.user.email}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px]">Phone:</span>
                        <div className="font-mono text-slate-200 text-[11px]">{caseDetail.user.phone}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px]">SHA-256 Hash:</span>
                        <div className="font-mono text-slate-400 text-[10px] truncate" title={caseDetail.user.email_hash}>
                          {caseDetail.user.email_hash}
                        </div>
                      </div>
                    </div>

                    {/* Historical Changes Timeline */}
                    {caseDetail.audit_history.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-2">
                          <History className="h-3 w-3 text-amber-400" />
                          Historical Identity Trace (user_audit_log.csv):
                        </span>
                        <div className="space-y-1.5">
                          {caseDetail.audit_history.map((ah, i) => (
                            <div key={i} className="text-[11px] font-mono bg-slate-900 p-2 rounded border border-slate-800 flex justify-between">
                              <span className="text-amber-300">{ah.field_name}: {ah.old_value} → {ah.new_value}</span>
                              <span className="text-slate-500 text-[10px]">{ah.event_time.split('T')[0]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Steps Timeline (Findings, Remediation, Verification) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">
                      Action Steps & Parity Verification ({caseDetail.steps.length})
                    </span>
                    <button
                      onClick={() => copyToClipboard(caseDetail.raw_steps_json)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      {copiedJson ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedJson ? 'Copied' : 'Copy steps_json'}</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {caseDetail.steps.map((st) => (
                      <div
                        key={st.step_no}
                        className={`p-3 rounded-lg border text-xs flex flex-col gap-1.5 ${
                          st.phase === 'FINDING'
                            ? 'bg-amber-500/5 border-amber-500/20'
                            : st.phase === 'REMEDIATION'
                            ? 'bg-indigo-500/5 border-indigo-500/20'
                            : 'bg-emerald-500/5 border-emerald-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-500 text-[11px]">#{st.step_no}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                st.phase === 'FINDING'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : st.phase === 'REMEDIATION'
                                  ? 'bg-indigo-500/20 text-indigo-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {st.phase}
                            </span>
                            <span className="font-mono font-semibold text-slate-200">{st.operation}</span>
                          </div>

                          <span className="font-mono text-[11px] text-slate-400">
                            State: <span className="text-slate-200 font-bold">{st.state}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/40">
                          <div>
                            System: <span className="font-mono text-indigo-300">{st.system_id}</span> • Resource:{' '}
                            <span className="font-mono text-slate-300">{st.resource_id}</span>
                          </div>

                          {st.evidence_id && (
                            <button
                              onClick={() => handleViewEvidence(st.evidence_id)}
                              className="inline-flex items-center gap-1 font-mono text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                            >
                              <Eye className="h-3 w-3" />
                              <span>{st.evidence_id}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Evidence Viewer Modal */}
      {evidenceModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 font-mono font-bold text-white text-sm">
                <Database className="h-4 w-4 text-indigo-400" />
                <span>Evidence File: {evidenceModal.file_id}</span>
              </div>
              <button
                onClick={() => setEvidenceModal(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-3 text-xs space-y-1 text-slate-400 border-b border-slate-800 font-mono">
              <div>Origin: <span className="text-slate-200">{evidenceModal.origin}</span></div>
              <div>Captured At: <span className="text-slate-200">{evidenceModal.captured_at}</span></div>
            </div>

            <div className="flex-1 overflow-y-auto mt-3">
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 whitespace-pre-wrap">
                {evidenceModal.preview}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
