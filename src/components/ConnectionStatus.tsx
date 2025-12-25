import { useSettingsStore } from '@/stores/settingsStore';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { XCircleIcon, SettingsIcon } from 'lucide-react';

export default function ConnectionStatus() {
  const { conductorSettings } = useSettingsStore();
  const navigate = useNavigate();

  if (conductorSettings.isConnected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <XCircleIcon className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-foreground">Not Connected to Conductor</p>
            <p className="text-xs text-muted-foreground">
              Configure your Netflix Conductor connection to start managing workflows.
            </p>
            <Button
              size="sm"
              onClick={() => navigate('/settings')}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <SettingsIcon className="h-3 w-3 mr-2" strokeWidth={1.5} />
              Configure Connection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
