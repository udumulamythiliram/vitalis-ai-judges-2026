import React from 'react';
import {
  HelpCircle,
  Phone,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  HeartHandshake
} from 'lucide-react';
import { useLanguage } from '../i18n';

export const HelpView: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Emergency Call Box */}
      <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-500 rounded-theme p-6 text-red-950 dark:text-red-100 shadow-theme">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 bg-red-600 text-white rounded-full">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-red-900 dark:text-red-100">
              {t('help.title')}
            </h2>
            <p className="text-sm text-red-700 dark:text-red-300">
              {t('help.symptoms')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-white/80 dark:bg-black/30 p-4 rounded-theme border border-red-200 dark:border-red-800 text-center">
            <div className="text-xs uppercase font-bold text-red-600 dark:text-red-400">{t('help.india')}</div>
            <a href="tel:112" className="text-2xl font-extrabold text-red-700 dark:text-red-200 hover:underline block mt-1">
              {t('help.dial112')}
            </a>
            <div className="text-[11px] text-text-muted mt-0.5">{t('help.ambulance')}</div>
          </div>

          <div className="bg-white/80 dark:bg-black/30 p-4 rounded-theme border border-red-200 dark:border-red-800 text-center">
            <div className="text-xs uppercase font-bold text-red-600 dark:text-red-400">{t('help.mental')}</div>
            <a href="tel:18005990019" className="text-lg font-bold text-red-700 dark:text-red-200 hover:underline block mt-1">
              1800-599-0019
            </a>
            <div className="text-[11px] text-text-muted mt-0.5">{t('help.kiran')}</div>
          </div>

          <div className="bg-white/80 dark:bg-black/30 p-4 rounded-theme border border-red-200 dark:border-red-800 text-center">
            <div className="text-xs uppercase font-bold text-red-600 dark:text-red-400">{t('help.us')}</div>
            <a href="tel:911" className="text-2xl font-extrabold text-red-700 dark:text-red-200 hover:underline block mt-1">
              {t('help.dial911')}
            </a>
            <div className="text-[11px] text-text-muted mt-0.5">{t('help.crisis988')}</div>
          </div>
        </div>

        <div className="text-xs text-red-800 dark:text-red-300">
          <strong>{t('help.important')}</strong> {t('help.noDispatch')}
        </div>
      </div>

      {/* Product Disclaimers & Safety Rules */}
      <div className="bg-surface rounded-theme p-6 border border-border shadow-theme space-y-4">
        <h3 className="font-bold text-lg text-text flex items-center space-x-2">
          <Info className="w-5 h-5 text-primary" />
          <span>{t('help.productSafety')}</span>
        </h3>

        <div className="space-y-3 text-sm text-text-muted leading-relaxed">
          <div className="p-3.5 bg-surface-2 rounded-theme border border-border">
            <strong className="text-text block mb-1">{t('help.clinicianTitle')}</strong>
            {t('help.clinicianBody')}
          </div>

          <div className="p-3.5 bg-surface-2 rounded-theme border border-border">
            <strong className="text-text block mb-1">{t('help.doseTitle')}</strong>
            {t('help.doseBody')}
          </div>

          <div className="p-3.5 bg-surface-2 rounded-theme border border-border">
            <strong className="text-text block mb-1">{t('help.labTitle')}</strong>
            {t('help.labBody')}
          </div>

          <div className="p-3.5 bg-surface-2 rounded-theme border border-border">
            <strong className="text-text block mb-1">{t('help.reviewTitle')}</strong>
            {t('help.reviewBody')}
          </div>
        </div>
      </div>
    </div>
  );
};
