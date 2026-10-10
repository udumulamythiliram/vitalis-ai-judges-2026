import React, { useState, useEffect } from 'react';
import { PatientProfile, DocumentItem, ExtractedField } from '../types';
import { api } from '../api';
import { Language, useLanguage, translateStaticText } from '../i18n';
import {
  CheckSquare,
  Sparkles,
  FileText,
  Check,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Globe,
  Sliders,
  Volume2,
  ArrowRight
} from 'lucide-react';

interface ReviewCenterViewProps {
  activePatient: PatientProfile | null;
  selectedDocId?: string | null;
}

export const ReviewCenterView: React.FC<ReviewCenterViewProps> = ({
  activePatient,
  selectedDocId,
}) => {
  const { language, t } = useLanguage();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(selectedDocId || null);
  const [docDetails, setDocDetails] = useState<any>(null);
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // Summary state
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [summaryLang, setSummaryLang] = useState(language);
  const [summaryLevel, setSummaryLevel] = useState('standard');
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Edit field modal state
  const [editingField, setEditingField] = useState<ExtractedField | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => setSummaryLang(language), [language]);

  useEffect(() => {
    if (!activePatient) return;
    api.getDocuments(activePatient.id).then((docs) => {
      setDocuments(docs || []);
      if (selectedDocId) {
        setActiveDocId(selectedDocId);
      } else if (docs && docs.length > 0 && !activeDocId) {
        setActiveDocId(docs[0].id);
      }
    });
  }, [activePatient, selectedDocId]);

  useEffect(() => {
    if (!activeDocId) return;
    setLoading(true);
    setVerifiedSuccess(false);
    setSummaryText(null);

    Promise.all([
      api.getDocument(activeDocId),
      api.getExtractedFields(activeDocId)
    ])
      .then(([details, flds]) => {
        setDocDetails(details);
        setFields(flds || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [activeDocId]);

  const handleRunExtraction = async () => {
    if (!activeDocId) return;
    setExtracting(true);
    try {
      await api.runExtraction(activeDocId);
      const flds = await api.getExtractedFields(activeDocId);
      setFields(flds || []);
    } catch (err: any) {
      alert(err.message || 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveFieldEdit = async () => {
    if (!editingField) return;
    try {
      await api.updateField(editingField.id, {
        user_corrected_value: editValue,
        status: 'confident'
      });
      setFields((prev) =>
        prev.map((f) => (f.id === editingField.id ? { ...f, user_corrected_value: editValue, status: 'confident' } : f))
      );
      setEditingField(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update field');
    }
  };

  const handleVerifyCommit = async () => {
    if (!activeDocId) return;
    setVerifying(true);
    try {
      await api.verifyDocument(activeDocId);
      setVerifiedSuccess(true);
      // Trigger summary generation automatically
      handleFetchSummary();
    } catch (err: any) {
      alert(err.message || 'Verification commit failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleFetchSummary = async () => {
    if (!activeDocId) return;
    setLoadingSummary(true);
    try {
      const res = await api.getSummary(activeDocId, summaryLang, summaryLevel);
      setSummaryText(res.summary_text);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleReadSummary = () => {
    if (!summaryText || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(summaryText.replace(/[#*_`]/g, ''));
    utterance.lang = summaryLang === 'hi' ? 'hi-IN' : summaryLang === 'te' ? 'te-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Document Selector */}
      <div className="bg-surface rounded-theme p-4 border border-border shadow-theme flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            <span>{t('review.title')}</span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            {t('review.description')}
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-text-muted whitespace-nowrap">{t('review.document')}:</label>
          <select
            value={activeDocId || ''}
            onChange={(e) => setActiveDocId(e.target.value)}
            className="bg-surface-2 border border-border rounded px-3 py-1.5 text-sm text-text font-medium w-full sm:w-64"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.original_filename} ({d.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Side-by-Side Review Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Source Document & OCR Page Text */}
        <div className="bg-surface rounded-theme border border-border shadow-theme p-5 flex flex-col h-[580px]">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-text text-base">{t('review.source')}</h3>
            </div>
            {docDetails?.pages?.[0]?.ocr_confidence && (
              <span className="text-xs bg-surface-2 px-2 py-0.5 rounded text-text font-mono border border-border">
                {translateStaticText("OCR Conf:")} {Math.round(docDetails.pages[0].ocr_confidence * 100)}%
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto mt-4 p-4 bg-surface-2 rounded-theme font-mono text-xs text-text leading-relaxed whitespace-pre-wrap border border-border select-text">
            {docDetails?.pages?.length > 0 ? (
              docDetails.pages.map((p: any) => p.raw_text).join('\n\n--- Page Break ---\n\n')
            ) : (
              <div className="text-text-muted text-center py-10">{translateStaticText("No machine text available for this document.")}</div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
            <span>{translateStaticText("Real PyMuPDF extraction stream")}</span>
            <button
              onClick={handleRunExtraction}
              disabled={extracting}
              className="px-3 py-1.5 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{extracting ? 'Running Extraction...' : 'Re-run LLM Extraction'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Extracted Fields Review */}
        <div className="bg-surface rounded-theme border border-border shadow-theme p-5 flex flex-col h-[580px]">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-bold text-text text-base">{t('review.fields')}</h3>
              <p className="text-xs text-text-muted">{translateStaticText("Fields extracted via LLM Gateway JSON Schema")}</p>
            </div>

            <button
              onClick={handleVerifyCommit}
              disabled={verifying || fields.length === 0}
              className="px-4 py-2 rounded-theme bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{verifying ? t('review.committing') : t('review.commit')}</span>
            </button>
          </div>

          {verifiedSuccess && (
            <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded text-xs flex items-center space-x-2 border border-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('review.verified')}</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
            {fields.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <p className="mb-3">{t('review.noFields')}</p>
                <button
                  onClick={handleRunExtraction}
                  disabled={extracting}
                  className="px-4 py-2 rounded-theme bg-primary text-primary-contrast font-bold text-xs inline-flex items-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{translateStaticText("Run Structured Extraction Now")}</span>
                </button>
              </div>
            ) : (
              fields.map((f) => {
                const isNeedsReview = f.status === 'needs_review';
                const displayVal = f.user_corrected_value || f.extracted_value;

                return (
                  <div
                    key={f.id}
                    className={`p-3.5 rounded-theme border transition-all ${
                      isNeedsReview
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                        : 'bg-surface-2 border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-text text-sm">{f.field_name}</div>
                        <div className="text-xs text-text-muted mt-0.5">
                          {translateStaticText("Original Text:")} <span className="font-mono">{f.original_text || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                            isNeedsReview
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {f.status}
                        </span>
                        <button
                          onClick={() => {
                            setEditingField(f);
                            setEditValue(f.user_corrected_value || f.extracted_value);
                          }}
                          className="p-1 hover:bg-surface rounded text-text-muted hover:text-text"
                          title={translateStaticText("Edit extracted value")}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 text-xs font-semibold text-text bg-surface p-2 rounded border border-border truncate">
                      {translateStaticText("Extracted:")} {displayVal}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Field Edit Dialog Modal */}
      {editingField && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-theme border border-border shadow-2xl p-6 max-w-md w-full animate-in zoom-in-95">
            <h3 className="font-bold text-lg text-text">{translateStaticText("Edit Extracted Field")}</h3>
            <p className="text-xs text-text-muted mt-1">{translateStaticText("Field:")} {editingField.field_name}</p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-text mb-1 block">{translateStaticText("Corrected Value:")}</label>
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={4}
                className="w-full bg-surface-2 border border-border rounded-theme p-3 text-sm text-text font-mono focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                onClick={() => setEditingField(null)}
                className="px-4 py-2 rounded-theme bg-surface-2 hover:bg-border text-text font-bold text-xs"
              >
                {translateStaticText("Cancel")}
              </button>
              <button
                onClick={handleSaveFieldEdit}
                className="px-4 py-2 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs"
              >
                {translateStaticText("Save Correction")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Structured Health Summary Card */}
      <div className="bg-surface rounded-theme border border-border p-6 shadow-theme">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
          <div>
            <h3 className="font-bold text-lg text-text">{t('review.summary')}</h3>
            <p className="text-xs text-text-muted">
              {t('review.summaryDesc')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={summaryLang}
              onChange={(e) => setSummaryLang(e.target.value as Language)}
              className="bg-surface-2 border border-border rounded px-2.5 py-1 text-xs text-text font-semibold"
            >
              <option value="en">{translateStaticText("English")}</option>
              <option value="te">{translateStaticText("తెలుగు (Telugu)")}</option>
              <option value="hi">{translateStaticText("हिन्दी (Hindi)")}</option>
            </select>

            <select
              value={summaryLevel}
              onChange={(e) => setSummaryLevel(e.target.value)}
              className="bg-surface-2 border border-border rounded px-2.5 py-1 text-xs text-text font-semibold"
            >
              <option value="simple">{t('review.simple')}</option>
              <option value="standard">{t('review.standard')}</option>
              <option value="detailed">{t('review.detailed')}</option>
            </select>

            <button
              onClick={handleFetchSummary}
              disabled={loadingSummary}
              className="px-3 py-1 rounded bg-primary text-primary-contrast font-bold text-xs flex items-center space-x-1"
            >
              {loadingSummary ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{t('review.generate')}</span>
            </button>

            {summaryText && (
              <button
                onClick={handleReadSummary}
                className="px-3 py-1 rounded bg-surface-2 border border-border text-text font-bold text-xs flex items-center space-x-1"
                title={translateStaticText("Read aloud")}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{translateStaticText("Read")}</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 p-4 rounded-theme bg-surface-2 border border-border text-sm leading-relaxed text-text whitespace-pre-line">
          {summaryText ? (
            summaryText
          ) : (
            <div className="text-text-muted text-center py-6">
            {t('review.summaryPrompt', { name: activePatient?.full_name || '' })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
