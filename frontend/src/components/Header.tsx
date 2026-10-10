import React, { useState } from 'react';
import { PatientProfile, SystemStatus } from '../types';
import {
  ShieldAlert,
  Sliders,
  Palette,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Activity,
  Heart,
  Languages
} from 'lucide-react';
import { useLanguage, translateStaticText } from '../i18n';

interface HeaderProps {
  patients: PatientProfile[];
  activePatient: PatientProfile | null;
  onSelectPatient: (patientId: string) => void;
  systemStatus: SystemStatus | null;
  onOpenAccessibility: () => void;
  onOpenThemeStudio: () => void;
  onToggleEmergencyCard: () => void;
  onOpenCommandPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  patients,
  activePatient,
  onSelectPatient,
  systemStatus,
  onOpenAccessibility,
  onOpenThemeStudio,
  onToggleEmergencyCard,
  onOpenCommandPalette,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border transition-colors">
      <a href="#main-content" className="skip-link">
        {t('header.skip')}
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-theme bg-primary flex items-center justify-center text-primary-contrast shadow-sm">
            <Heart className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-text">
                Vitalis <span className="text-primary font-normal">AI</span>
              </span>
              <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider bg-surface-2 text-text-muted px-2 py-0.5 rounded-full border border-border">
                {t('header.healthCopilot')}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Active Patient Switcher */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-theme bg-surface-2 hover:bg-surface border border-border text-text transition-all focus:ring-2 focus:ring-ring text-left"
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
              {activePatient?.full_name.charAt(0) || 'P'}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-medium text-text-muted">{t('header.activePatient')}</div>
              <div className="text-sm font-bold text-text truncate max-w-[130px]">
                {activePatient?.full_name || t('header.selectProfile')}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-text-muted" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-64 bg-surface border border-border rounded-theme shadow-lg py-2 z-50 animate-in fade-in">
              <div className="px-3 py-1 text-xs font-semibold text-text-muted uppercase border-b border-border">
                {t('header.switchProfile')}
              </div>
              <div className="max-h-60 overflow-y-auto">
                {patients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectPatient(p.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-surface-2 transition-colors ${
                      p.id === activePatient?.id ? 'bg-primary/10 text-primary font-bold' : 'text-text'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold">{p.full_name}</div>
                      <div className="text-xs text-text-muted capitalize">
                        {p.relationship} • {p.age_group}
                      </div>
                    </div>
                    {p.id === activePatient?.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          <label className="flex items-center gap-1.5 rounded-theme border border-border bg-surface-2 px-2 py-1.5 text-text" title={t('language.label')}>
            <Languages className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="sr-only">{t('language.label')}</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as 'en' | 'hi' | 'te')}
              className="max-w-[5.5rem] bg-transparent text-xs font-semibold outline-none"
              aria-label={t('language.label')}
            >
              <option value="en">{translateStaticText("English")}</option>
              <option value="hi">हिन्दी</option>
              <option value="te">తెలుగు</option>
            </select>
          </label>

          {/* Status Indicator */}
          {systemStatus && (
            <div
              className={`hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                systemStatus.is_fallback
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300'
              }`}
              title={systemStatus.is_fallback ? t('status.ruleTitle') : t('status.liveTitle')}
            >
              <span className={`w-2 h-2 rounded-full ${systemStatus.is_fallback ? 'bg-amber-500' : 'bg-emerald-500 animate-ping'}`} />
              <span>{systemStatus.is_fallback ? t('status.ruleFallback') : t('status.aiLive')}</span>
            </div>
          )}

          {/* Command Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="p-2 rounded-theme hover:bg-surface-2 text-text-muted hover:text-text transition-colors"
            title={t('header.search')}
            aria-label={t('header.search')}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Studio Button */}
          <button
            onClick={onOpenThemeStudio}
            className="p-2 rounded-theme hover:bg-surface-2 text-text-muted hover:text-text transition-colors"
            title={t('header.themeStudio')}
            aria-label={t('header.themeStudio')}
          >
            <Palette className="w-5 h-5" />
          </button>

          {/* Accessibility Settings */}
          <button
            onClick={onOpenAccessibility}
            className="p-2 rounded-theme hover:bg-surface-2 text-text-muted hover:text-text transition-colors"
            title={t('header.accessibility')}
            aria-label={t('header.accessibility')}
          >
            <Sliders className="w-5 h-5" />
          </button>

          {/* Emergency SOS Shortcut */}
          <button
            onClick={onToggleEmergencyCard}
            className="px-3 py-1.5 rounded-theme bg-red-600 hover:bg-red-700 text-white font-bold flex items-center space-x-1.5 shadow-sm text-sm"
            title={t('header.emergency')}
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="hidden sm:inline">{translateStaticText("SOS")}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
