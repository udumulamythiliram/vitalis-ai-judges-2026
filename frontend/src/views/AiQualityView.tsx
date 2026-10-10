import React, { useState, useEffect } from 'react';
import { SystemStatus } from '../types';
import { api, clearJudgeLlmCredentials, hasJudgeLlmCredentials, setJudgeLlmCredentials } from '../api';
import {
  Activity,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Key,
  Database,
  Eye,
  Zap,
  Server
} from 'lucide-react';

const DEFAULT_MODELS: Record<string, string> = {
  groq: 'openai/gpt-oss-20b',
  gemini: 'gemini-3.8-flash',
  openai: 'gpt-5-mini',
  openrouter: 'openai/gpt-6-luna-decisions',
};

interface AiQualityViewProps {
  systemStatus: SystemStatus | null;
  onRefreshStatus: () => void;
}

export const AiQualityView: React.FC<AiQualityViewProps> = ({
  systemStatus,
  onRefreshStatus,
}) => {
  const publicDemo = import.meta.env.VITE_PUBLIC_DEMO === 'true';
  const [evalData, setEvalData] = useState<any>(null);
  const [loadingEvals, setLoadingEvals] = useState(false);

  // Live API Key config state
  const [newKey, setNewKey] = useState('');
  const [newProvider, setNewProvider] = useState('groq');
  const [newModel, setNewModel] = useState(DEFAULT_MODELS.groq);
  const [savingKey, setSavingKey] = useState(false);
  const [keyNotice, setKeyNotice] = useState<string | null>(null);
  const [judgeKeyActive, setJudgeKeyActive] = useState(hasJudgeLlmCredentials());

  const runBenchmark = () => {
    setLoadingEvals(true);
    api.runEvals()
      .then((res) => setEvalData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoadingEvals(false));
  };

  useEffect(() => {
    runBenchmark();
  }, []);

  const clearActiveJudgeKeyBeforeEdit = () => {
    if (publicDemo && judgeKeyActive) {
      clearJudgeLlmCredentials();
      setJudgeKeyActive(false);
      setKeyNotice('Settings changed. Enter the key again and select Use Key in This Tab.');
    }
  };

  const handleConfigureKey = async () => {
    if (!newKey.trim()) return;
    if (publicDemo) {
      setJudgeLlmCredentials({ apiKey: newKey.trim(), provider: newProvider, model: newModel.trim() || DEFAULT_MODELS[newProvider] });
      setNewKey('');
      setJudgeKeyActive(true);
      setKeyNotice('Key is held in this tab’s memory and will be sent only when you request an AI response. It has not been tested yet.');
      return;
    }

    setSavingKey(true);
    try {
      const res = await api.configureLlm({
        api_key: newKey,
        provider: newProvider,
        model: newModel || undefined,
      });
      setKeyNotice(`Key updated successfully! Provider status: ${res.health?.status || 'OK'}`);
      setNewKey('');
      onRefreshStatus();
      runBenchmark();
    } catch (err: any) {
      alert(err.message || 'Failed to update LLM configuration');
    } finally {
      setSavingKey(false);
    }
  };

  const handleClearJudgeKey = () => {
    clearJudgeLlmCredentials();
    setJudgeKeyActive(false);
    setKeyNotice('The judge API key was cleared from this tab.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text flex items-center space-x-2">
            <Activity className="w-5 h-5 text-primary" />
            <span>AI Quality, Benchmarks & Gateway Status</span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Transparent accuracy benchmarks across 15 fictional clinical fixtures, safety red-teaming, and LLM telemetry.
          </p>
        </div>

        <button
          onClick={runBenchmark}
          disabled={loadingEvals}
          className="px-4 py-2 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs flex items-center space-x-1.5 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loadingEvals ? 'animate-spin' : ''}`} />
          <span>{loadingEvals ? 'Running Benchmark...' : 'Run Live Benchmark'}</span>
        </button>
      </div>

      {/* Benchmark Metric Cards */}
      {evalData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface rounded-theme p-4 border border-border shadow-theme">
            <div className="text-xs font-bold text-text-muted uppercase">Field Extraction Accuracy</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {evalData.field_accuracy_pct}%
            </div>
            <div className="text-[11px] text-text-muted mt-1">Drug name, dose, units</div>
          </div>

          <div className="bg-surface rounded-theme p-4 border border-border shadow-theme">
            <div className="text-xs font-bold text-text-muted uppercase">Deterministic Flag Accuracy</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {evalData.abnormal_flag_accuracy_pct}%
            </div>
            <div className="text-[11px] text-text-muted mt-1">Zero LLM hallucinations</div>
          </div>

          <div className="bg-surface rounded-theme p-4 border border-border shadow-theme">
            <div className="text-xs font-bold text-text-muted uppercase">Safety Red-Team Pass Rate</div>
            <div className="text-2xl font-extrabold text-primary mt-1">
              {evalData.safety_redteam_pass_rate_pct}%
            </div>
            <div className="text-[11px] text-text-muted mt-1">112 routing & prompt injection</div>
          </div>

          <div className="bg-surface rounded-theme p-4 border border-border shadow-theme">
            <div className="text-xs font-bold text-text-muted uppercase">Avg Evaluation Latency</div>
            <div className="text-2xl font-extrabold text-text mt-1">
              {evalData.avg_latency_per_test_ms} ms
            </div>
            <div className="text-[11px] text-text-muted mt-1">Across 15 test fixtures</div>
          </div>
        </div>
      )}

      {/* System Status Architecture Panel */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme">
        <h3 className="font-bold text-base text-text mb-4 flex items-center space-x-2">
          <Server className="w-5 h-5 text-primary" />
          <span>Live Infrastructure Telemetry</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 bg-surface-2 rounded-theme border border-border">
            <div className="flex items-center space-x-2 text-xs font-bold text-text-muted mb-1">
              <Cpu className="w-4 h-4 text-primary" />
              <span>LLM Gateway Engine</span>
            </div>
            <div className="font-bold text-text text-sm">
              {systemStatus?.active_provider.toUpperCase()} ({systemStatus?.active_model})
            </div>
            <div className="mt-2 text-xs flex items-center space-x-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  systemStatus?.is_fallback ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
              <span className="font-medium text-text">
                {systemStatus?.is_fallback ? 'Deterministic Fallback Mode' : 'Connected to Remote API'}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-surface-2 rounded-theme border border-border">
            <div className="flex items-center space-x-2 text-xs font-bold text-text-muted mb-1">
              <Eye className="w-4 h-4 text-primary" />
              <span>Document Extraction & OCR</span>
            </div>
            <div className="font-bold text-text text-sm">{systemStatus?.ocr_engine}</div>
            <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>PyMuPDF Native Parser Active</span>
            </div>
          </div>

          <div className="p-3.5 bg-surface-2 rounded-theme border border-border">
            <div className="flex items-center space-x-2 text-xs font-bold text-text-muted mb-1">
              <Database className="w-4 h-4 text-primary" />
              <span>Relational Storage</span>
            </div>
            <div className="font-bold text-text text-sm">{systemStatus?.database}</div>
            <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{publicDemo ? 'Shared temporary demo storage' : 'Foreign keys enabled'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Judge API Key Injector */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme">
        <div className="pb-3 border-b border-border">
          <h3 className="font-bold text-base text-text flex items-center space-x-2">
            <Key className="w-5 h-5 text-primary" />
            <span>Judge LLM Provider Configuration</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {publicDemo
              ? 'Bring your own key for live responses from Groq, Gemini, OpenAI, or OpenRouter.'
              : 'Test real LLM calls by supplying your own API key (Groq, Gemini, OpenAI, or OpenRouter).'}
          </p>
        </div>

        {publicDemo && (
          <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            Your key stays in this browser tab’s memory and is not saved by Vitalis. When you ask the copilot or request a document summary, the key and that request’s text are sent through this demo’s backend to the provider you select. Key-based copilot messages are not saved by Vitalis. Provider usage may cost money. Use a limited test key and fictional or de-identified data only.
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-text mb-1 block">Provider:</label>
            <select
              value={newProvider}
              onChange={(e) => {
                const provider = e.target.value;
                clearActiveJudgeKeyBeforeEdit();
                setNewProvider(provider);
                setNewModel(DEFAULT_MODELS[provider]);
              }}
              className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-xs text-text"
            >
              <option value="groq">Groq (Ultra-Fast)</option>
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-text mb-1 block">{newProvider[0].toUpperCase() + newProvider.slice(1)} API Key:</label>
            <input
              type="password"
              placeholder={`Paste ${newProvider} API key...`}
              value={newKey}
              onChange={(e) => { clearActiveJudgeKeyBeforeEdit(); setNewKey(e.target.value); }}
              className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-xs text-text font-mono"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="text-xs font-semibold text-text mb-1 block">Model ID (editable):</label>
            <input
              type="text"
              placeholder="Enter a model ID supported by your provider"
              value={newModel}
              onChange={(e) => { clearActiveJudgeKeyBeforeEdit(); setNewModel(e.target.value); }}
              className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-xs text-text font-mono"
            />
          </div>

          <button
            onClick={handleConfigureKey}
            disabled={savingKey || !newKey.trim()}
            className="w-full py-2 px-4 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs shadow-sm"
          >
            {savingKey ? 'Verifying...' : publicDemo ? 'Use Key in This Tab' : 'Connect Key'}
          </button>

          {publicDemo && judgeKeyActive && (
            <button
              onClick={handleClearJudgeKey}
              className="w-full py-2 px-4 rounded-theme bg-surface-2 hover:bg-border text-text font-bold text-xs border border-border"
            >
              Clear Key
            </button>
          )}
        </div>

        {publicDemo && judgeKeyActive && (
          <p role="status" className="mt-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            A key is active in this tab for {newProvider} · {newModel}. Reloading or clearing it removes it from this browser session.
          </p>
        )}

        {keyNotice && (
          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{keyNotice}</span>
          </div>
        )}
      </div>

      {/* Fixtures Breakdown Table */}
      {evalData?.fixtures && (
        <div className="bg-surface rounded-theme border border-border overflow-hidden shadow-theme">
          <div className="p-4 bg-surface-2 border-b border-border">
            <h3 className="font-bold text-text text-base">15 Evaluation Fixtures Execution Details</h3>
          </div>

          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {evalData.fixtures.map((f: any) => (
              <div key={f.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-surface-2/40">
                <div className="flex items-center space-x-3">
                  {f.status === 'passed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <div>
                    <div className="font-bold text-text">{f.name}</div>
                    <div className="text-[11px] text-text-muted">
                      {f.computed_flag ? `Flag: ${f.computed_flag}` : f.triage_result ? `Triage: ${f.triage_result}` : 'Verified'}
                    </div>
                  </div>
                </div>

                <div className="font-mono text-text-muted">{f.latency_ms} ms</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
