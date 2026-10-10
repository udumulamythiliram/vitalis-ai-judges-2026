import React from 'react';
import {
  Home,
  Bot,
  FileText,
  CheckSquare,
  Clock,
  Pill,
  TrendingUp,
  Users2,
  Calendar,
  Palette,
  Shield,
  Activity,
  Award,
  HelpCircle
} from 'lucide-react';
import { useLanguage, translateStaticText } from '../i18n';

export type SectionId =
  | 'dashboard'
  | 'copilot'
  | 'records'
  | 'review'
  | 'timeline'
  | 'medications'
  | 'reports'
  | 'family'
  | 'appointments'
  | 'appearance'
  | 'privacy'
  | 'ai-quality'
  | 'demo'
  | 'help';

interface SidebarProps {
  currentSection: SectionId;
  onSelectSection: (section: SectionId) => void;
  elderlyMode?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  elderlyMode = false,
}) => {
  const { t } = useLanguage();
  const allNavItems = [
    { id: 'dashboard', key: 'nav.dashboard', icon: Home, badge: '' },
    { id: 'copilot', key: 'nav.copilot', icon: Bot, badge: 'AI' },
    { id: 'records', key: 'nav.records', icon: FileText, badge: '' },
    { id: 'review', key: 'nav.review', icon: CheckSquare, badge: 'nav.verify' },
    { id: 'timeline', key: 'nav.timeline', icon: Clock, badge: '' },
    { id: 'medications', key: 'nav.medications', icon: Pill, badge: '' },
    { id: 'reports', key: 'nav.reports', icon: TrendingUp, badge: '' },
    { id: 'family', key: 'nav.family', icon: Users2, badge: '' },
    { id: 'appointments', key: 'nav.appointments', icon: Calendar, badge: '' },
    { id: 'appearance', key: 'nav.themes', icon: Palette, badge: 'nav.themesCount' },
    { id: 'privacy', key: 'nav.privacy', icon: Shield, badge: 'ABDM' },
    { id: 'ai-quality', key: 'nav.aiQuality', icon: Activity, badge: 'nav.evals' },
    { id: 'demo', key: 'nav.demo', icon: Award, badge: 'nav.personas' },
    { id: 'help', key: 'nav.help', icon: HelpCircle, badge: '' },
  ];

  // In Elderly Mode, reduce down to 5 simple, high-impact items
  const elderlyNavItems = [
    { id: 'dashboard', key: 'nav.home', icon: Home, badge: '' },
    { id: 'copilot', key: 'nav.ask', icon: Bot, badge: 'AI' },
    { id: 'records', key: 'nav.documents', icon: FileText, badge: '' },
    { id: 'medications', key: 'nav.medicines', icon: Pill, badge: '' },
    { id: 'help', key: 'nav.emergencyHelp', icon: HelpCircle, badge: 'SOS' },
  ];

  const items = elderlyMode ? elderlyNavItems : allNavItems;

  return (
    <nav
      className="w-full md:w-64 bg-surface border-r border-border flex flex-col py-4 px-3 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto"
      aria-label={t('nav.aria')}
    >
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id as SectionId)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-theme text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-primary-contrast shadow-sm'
                  : 'text-text-muted hover:bg-surface-2 hover:text-text'
              } ${elderlyMode ? 'py-4 text-lg' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`${elderlyMode ? 'w-6 h-6' : 'w-5 h-5'}`} />
                <span>{t(item.key)}</span>
              </div>
              {item.badge && !elderlyMode && (
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-2 text-text-muted border border-border'
                  }`}
                >
                  {item.badge.includes('.') ? t(item.badge) : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!elderlyMode && (
        <div className="mt-auto pt-4 border-t border-border">
          <div className="p-3 rounded-theme bg-surface-2 border border-border text-xs text-text-muted">
            <div className="font-bold text-text">{translateStaticText("Vitalis Copilot 2.0")}</div>
            <div className="mt-0.5">{t('nav.footer')}</div>
          </div>
        </div>
      )}
    </nav>
  );
};
