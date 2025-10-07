import { useState } from 'react';
import { useSettings } from '@/hooks/useSettingsContext';
import type { SettingsSection } from '@/types';
import {
  SettingsSidebar,
  GeneralSettings,
  OrchestratorSettingsPanel,
  InstancesSettingsPanel,
  EditorSettingsPanel,
  NotificationsSettings,
  SecuritySettingsPanel,
  AdvancedSettingsPanel,
  AboutSection,
} from '@/components/settings';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { ResetConfirmDialog } from '@/components/settings/ResetConfirmDialog';
import { SettingsSearch } from '@/components/settings/SettingsSearch';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

const Settings = () => {
  const {
    settings,
    updateSettings,
    resetSettings,
    exportSettings,
    isSaving,
    lastSaved,
  } = useSettings();

  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleReset = () => {
    setShowResetDialog(true);
  };

  const handleResetConfirm = () => {
    resetSettings();
    setShowResetDialog(false);
    toast.success('Settings reset to defaults');
  };

  const handleExport = () => {
    exportSettings('json');
    toast.success('Settings exported successfully');
  };

  const getSectionTitle = (section: SettingsSection): string => {
    const titles: Record<SettingsSection, string> = {
      general: 'General',
      orchestrator: 'Orchestrator',
      instances: 'Instances',
      editor: 'Editor',
      notifications: 'Notifications',
      security: 'Security',
      advanced: 'Advanced',
      about: 'About',
    };
    return titles[section];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Settings Search (Cmd/Ctrl+K) */}
      <SettingsSearch onNavigate={setActiveSection} />

      <div className="flex">
        {/* Sidebar Navigation */}
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8 pb-24">
            {/* Header */}
            <SettingsHeader 
              onExport={handleExport} 
              onReset={handleReset}
              isSaving={isSaving}
              lastSaved={lastSaved}
            />

            {/* Breadcrumbs */}
            <div className="mb-6">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Settings</BreadcrumbPage>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{getSectionTitle(activeSection)}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Section Content */}
            {activeSection === 'general' && (
              <GeneralSettings
                appearance={settings.appearance}
                dashboard={settings.dashboard}
                onAppearanceChange={(updates) => updateSettings('appearance', updates)}
                onDashboardChange={(updates) => updateSettings('dashboard', updates)}
              />
            )}

            {activeSection === 'orchestrator' && (
              <OrchestratorSettingsPanel
                settings={settings.orchestrator}
                onChange={(updates) => updateSettings('orchestrator', updates)}
              />
            )}

            {activeSection === 'instances' && (
              <InstancesSettingsPanel
                settings={settings.instances}
                onChange={(updates) => updateSettings('instances', updates)}
              />
            )}

            {activeSection === 'editor' && (
              <EditorSettingsPanel
                settings={settings.editor}
                onChange={(updates) => updateSettings('editor', updates)}
              />
            )}

            {activeSection === 'notifications' && (
              <NotificationsSettings
                settings={settings.notifications}
                onChange={(updates) => updateSettings('notifications', updates)}
              />
            )}

            {activeSection === 'security' && (
              <SecuritySettingsPanel
                settings={settings.security}
                onChange={(updates) => updateSettings('security', updates)}
              />
            )}

            {activeSection === 'advanced' && (
              <AdvancedSettingsPanel
                settings={settings.advanced}
                onChange={(updates) => updateSettings('advanced', updates)}
              />
            )}

            {activeSection === 'about' && <AboutSection />}
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ResetConfirmDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onConfirm={handleResetConfirm}
      />
    </div>
  );
};

export default Settings;
