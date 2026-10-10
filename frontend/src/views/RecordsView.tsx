import React, { useState, useEffect, useRef } from 'react';
import { PatientProfile, DocumentItem } from '../types';
import { api, hasJudgeLlmCredentials } from '../api';
import { SectionId } from '../components/Sidebar';
import {
  FileText,
  Upload,
  Camera,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface RecordsViewProps {
  activePatient: PatientProfile | null;
  onNavigate: (section: SectionId) => void;
  onSelectDocumentForReview: (docId: string) => void;
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  activePatient,
  onNavigate,
  onSelectDocumentForReview,
}) => {
  const publicDemo = import.meta.env.VITE_PUBLIC_DEMO === 'true';
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [demoDataConfirmed, setDemoDataConfirmed] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [previewSummary, setPreviewSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [docTypeToUpload, setDocTypeToUpload] = useState('prescription');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = () => {
    if (!activePatient) return;
    setLoading(true);
    api.getDocuments(activePatient.id)
      .then((docs) => setDocuments(docs || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDocuments();
  }, [activePatient]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || (!publicDemo && !activePatient)) return;
    const file = files[0];

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      if (publicDemo) {
        if (!demoDataConfirmed) {
          setUploadError('Confirm that this is fictional or de-identified test data before uploading.');
          return;
        }
        if (file.size > 3_000_000) {
          setUploadError('Public demo uploads are limited to 3 MB.');
          return;
        }
        const result = await api.previewJudgeDocument(file, docTypeToUpload);
        setPreviewData(result);
        setPreviewSummary(null);
        setSummaryError(null);
        setUploadSuccess('Processed "' + result.filename + '" for this response only. The app did not save the file.');
      } else {
        const result = await api.uploadDocument(file, activePatient!.id, docTypeToUpload);
        if (result.status === 'duplicate') {
          setUploadError('Duplicate notice: ' + result.message);
        } else {
          setUploadSuccess('Successfully uploaded "' + result.filename + '" (' + result.page_count + ' page(s), OCR Quality: ' + result.ocr_quality + ')');
          loadDocuments();
        }
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePreviewSummary = async () => {
    if (!previewData?.text_preview || !hasJudgeLlmCredentials()) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const result = await api.summarizeJudgePreview(previewData.text_preview);
      if (result.is_fallback) {
        setSummaryError('The provider did not return a live response. Check the key and model, then try again.');
      } else {
        setPreviewSummary(result.summary);
      }
    } catch (err: any) {
      setSummaryError(err.message || 'The live summary request failed.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.deleteDocument(docId);
      loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const filteredDocs = documents.filter((d) => {
    const matchesSearch = d.original_filename.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'all' || d.document_type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {publicDemo ? (
        <div className="bg-surface rounded-theme p-6 border-2 border-dashed border-border shadow-theme">
          <div className="max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-text">Temporary Document Preview</h2>
              <p className="text-text-muted text-sm mt-1">
                Try a PDF, JPG, PNG, or WEBP under 3 MB (PDFs up to 15 pages). The file is sent to this public demo server for text extraction, processed for this request, and not saved in Vitalis storage.
              </p>
              <p className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
                Use fictional or de-identified test documents only. Never upload real patient records or personal identifiers.
              </p>
            </div>

            <label className="mt-5 flex items-start gap-2 rounded border border-border bg-surface-2 p-3 text-xs text-text">
              <input
                type="checkbox"
                checked={demoDataConfirmed}
                onChange={(e) => setDemoDataConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              <span>I confirm this is fictional or de-identified test data and understand the file is sent to the public demo server for temporary processing.</span>
            </label>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <select
                value={docTypeToUpload}
                onChange={(e) => setDocTypeToUpload(e.target.value)}
                className="bg-surface-2 border border-border rounded px-2.5 py-2 text-xs text-text"
                aria-label="Document type"
              >
                <option value="prescription">Prescription</option>
                <option value="lab_report">Lab / Diagnostic Report</option>
                <option value="discharge_summary">Discharge Summary</option>
                <option value="vaccination_record">Vaccination Chart</option>
                <option value="general">General Medical File</option>
              </select>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !demoDataConfirmed}
                className="px-5 py-2.5 rounded-theme bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-contrast font-bold flex items-center space-x-2 shadow-sm transition-all"
              >
                {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{uploading ? 'Processing File…' : 'Choose Demo File'}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e.target.files)}
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
              />
            </div>

            {uploadSuccess && <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded text-xs">{uploadSuccess}</div>}
            {uploadError && <div role="alert" className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 rounded text-xs">{uploadError}</div>}

            {previewData && (
              <div className="mt-5 rounded-theme border border-border bg-surface-2 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-text">Extraction Preview: {previewData.filename}</h3>
                    <p className="text-xs text-text-muted">{previewData.document_type?.replace(/_/g, ' ')} · {previewData.page_count} page(s) · {previewData.ocr_quality} text quality · confidence {Math.round((previewData.ocr_confidence || 0) * 100)}%</p>
                  </div>
                  <button
                    onClick={() => { setPreviewData(null); setPreviewSummary(null); setSummaryError(null); setUploadSuccess(null); }}
                    className="px-3 py-1.5 rounded border border-border text-xs font-semibold text-text hover:bg-surface"
                  >
                    Clear Preview
                  </button>
                </div>
                {previewData.text_preview ? (
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded border border-border bg-surface p-3 text-xs text-text">{previewData.text_preview}{previewData.text_truncated ? '\n…preview truncated' : ''}</pre>
                ) : (
                  <p className="text-xs text-text-muted">No readable text was found. Scanned images may need a clearer image or a PDF with selectable text.</p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {hasJudgeLlmCredentials() ? (
                    <button
                      onClick={handlePreviewSummary}
                      disabled={summaryLoading || !previewData.text_preview}
                      className="px-4 py-2 rounded-theme bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-contrast font-bold text-xs"
                    >
                      {summaryLoading ? 'Requesting provider summary…' : 'Generate Live AI Summary'}
                    </button>
                  ) : (
                    <button onClick={() => onNavigate('ai-quality')} className="px-4 py-2 rounded-theme bg-surface hover:bg-border border border-border text-text font-bold text-xs">
                      Add Your Provider Key to Try AI
                    </button>
                  )}
                  <span className="text-[11px] text-text-muted">AI summary sends extracted text to your selected provider. Use fictional/de-identified content only.</span>
                </div>
                {summaryError && <p role="alert" className="text-xs text-red-700 dark:text-red-300">{summaryError}</p>}
                {previewSummary && <div className="rounded border border-border bg-surface p-3 text-sm text-text whitespace-pre-wrap"><strong className="block mb-2">AI summary · informational only</strong>{previewSummary}</div>}
              </div>
            )}
          </div>
        </div>
      ) : (
      <>
      {/* Upload Box */}
      <div className="bg-surface rounded-theme p-6 border-2 border-dashed border-border hover:border-primary transition-all shadow-theme">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-text">Upload Health Record</h2>
          <p className="text-text-muted text-sm mt-1">
            Accepts PDF, JPG, PNG or WEBP. Extracted with real PyMuPDF text & OCR pipeline for{' '}
            <span className="font-semibold text-text">{activePatient?.full_name}</span>.
          </p>

          {/* Document Type Selector */}
          <div className="mt-4 flex items-center justify-center space-x-3 text-xs">
            <label className="font-semibold text-text-muted">Document Type:</label>
            <select
              value={docTypeToUpload}
              onChange={(e) => setDocTypeToUpload(e.target.value)}
              className="bg-surface-2 border border-border rounded px-2.5 py-1 text-text text-xs focus:ring-1 focus:ring-ring"
            >
              <option value="prescription">Prescription</option>
              <option value="lab_report">Lab / Diagnostic Report</option>
              <option value="discharge_summary">Discharge Summary</option>
              <option value="vaccination_record">Vaccination Chart</option>
              <option value="general">General Medical File</option>
            </select>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-5 py-2.5 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold flex items-center space-x-2 shadow-sm transition-all"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing File...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Select File</span>
                </>
              )}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-theme bg-surface-2 hover:bg-border text-text font-bold border border-border flex items-center space-x-2 transition-all"
            >
              <Camera className="w-4 h-4 text-primary" />
              <span>Camera Capture</span>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files)}
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
          />

          {uploadSuccess && (
            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded text-xs flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 rounded text-xs flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search records by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-theme pl-9 pr-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-surface border border-border rounded-theme px-3 py-2 text-sm text-text focus:outline-none"
          >
            <option value="all">All Document Types</option>
            <option value="prescription">Prescriptions</option>
            <option value="lab_report">Lab Reports</option>
            <option value="discharge_summary">Discharge Summaries</option>
            <option value="vaccination_record">Vaccinations</option>
          </select>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-surface rounded-theme border border-border overflow-hidden shadow-theme">
        <div className="p-4 bg-surface-2 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-text text-base">
            Verified & Uploaded Documents ({filteredDocs.length})
          </h3>
          <span className="text-xs text-text-muted">Patient: {activePatient?.full_name}</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading documents...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No documents found matching criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 hover:bg-surface-2/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-theme mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-text text-base flex items-center space-x-2">
                      <span>{doc.original_filename}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          doc.status === 'reviewed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>

                    <div className="text-xs text-text-muted mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="capitalize font-medium text-text">
                        Type: {doc.document_type.replace('_', ' ')}
                      </span>
                      <span>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</span>
                      <span>Size: {Math.round(doc.file_size / 1024)} KB</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onSelectDocumentForReview(doc.id)}
                    className="px-3 py-1.5 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs flex items-center space-x-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Review & Verify</span>
                  </button>

                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 rounded-theme hover:bg-red-50 hover:text-red-600 text-text-muted transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
