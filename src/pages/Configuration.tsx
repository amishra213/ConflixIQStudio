import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, EditIcon, Trash2Icon, SlidersHorizontalIcon } from 'lucide-react';
import { useConfigStore } from '@/stores/configStore';
import { AlertConfigModal } from '@/components/modals/AlertConfigModal';
import { Config, AlertConfig } from '@/types/config';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Configuration() {
  const { configs, addConfig, updateConfig, deleteConfig } = useConfigStore();
  const { toast } = useToast();
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [filterType, setFilterType] = useState('all');

  const handleCreateConfig = (type: string) => {
    setEditingConfig(null);
    if (type === 'ALERT') {
      setIsAlertModalOpen(true);
    }
    // Add more config types here as needed
  };

  const handleEditConfig = (config: Config) => {
    setEditingConfig(config);
    if (config.configurationType === 'VALIDATION_RULES') { // Assuming ALERTs are VALIDATION_RULES
      setIsAlertModalOpen(true);
    }
    // Add more config types here as needed
  };

  const handleSaveConfig = (config: Config) => {
    if (configs.some((c) => c.id === config.id)) {
      updateConfig(config.id, config);
      toast({ title: 'Configuration updated', description: `Config "${config.configurationId}" has been updated.` });
    } else {
      addConfig(config);
      toast({ title: 'Configuration created', description: `Config "${config.configurationId}" has been created.` });
    }
  };

  const handleDeleteConfig = (id: string, configurationId: string) => {
    deleteConfig(id);
    toast({ title: 'Configuration deleted', description: `Config "${configurationId}" has been deleted.` });
  };

  const filteredConfigs = useMemo(() => {
    if (filterType === 'all') {
      return configs;
    }
    return configs.filter(config => config.configurationType === filterType);
  }, [configs, filterType]);

  const configTypes = useMemo(() => {
    const types = new Set(configs.map(config => config.configurationType));
    return ['all', ...Array.from(types)];
  }, [configs]);

  return (
    <div className="p-8 space-y-8 bg-[#0f1419]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Configuration</h1>
          <p className="text-base text-gray-400">Manage various application configurations</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-cyan-500 text-white hover:bg-cyan-600 shadow-sm font-medium">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Config
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
            <DropdownMenuItem onClick={() => handleCreateConfig('ALERT')} className="cursor-pointer">
              Alert
            </DropdownMenuItem>
            {/* Add more config types here */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {configs.length === 0 ? (
        <Card className="p-16 bg-[#1a1f2e] border-[#2a3142] text-center shadow-sm">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-cyan-500/10 rounded-2xl mx-auto flex items-center justify-center">
              <SlidersHorizontalIcon className="w-10 h-10 text-cyan-500" />
            </div>
            <h3 className="text-2xl font-semibold text-white">No Configurations Yet</h3>
            <p className="text-base text-gray-400">
              Define various application-wide configurations, such as alerts, feature flags, and more.
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-cyan-500 text-white hover:bg-cyan-600 shadow-sm font-medium">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create First Config
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                <DropdownMenuItem onClick={() => handleCreateConfig('ALERT')} className="cursor-pointer">
                  Alert
                </DropdownMenuItem>
                {/* Add more config types here */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <span className="text-white text-sm">Filter by Type:</span>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px] bg-[#1a1f2e] text-white border-[#2a3142]">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                {configTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.replace(/_/g, ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-[#1a1f2e] border-[#2a3142] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0f1419]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Entity</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Org ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a3142]">
                  {filteredConfigs.map((config) => (
                    <tr key={config.id} className="hover:bg-[#2a3142]/30 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-white">{config.configurationId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/50 font-medium">
                          {config.configurationType.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400">{config.entity}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400">{config.orgId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            config.enabled
                              ? 'bg-green-500/20 text-green-400 border border-green-500/50 font-medium'
                              : 'bg-red-500/20 text-red-400 border border-red-500/50 font-medium'
                          }
                        >
                          {config.enabled ? 'ENABLED' : 'DISABLED'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditConfig(config)}
                            className="text-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-400"
                            title="Edit Configuration"
                          >
                            <EditIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteConfig(config.id, config.configurationId)}
                            className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                            title="Delete Configuration"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <AlertConfigModal
        open={isAlertModalOpen}
        onOpenChange={setIsAlertModalOpen}
        onSave={handleSaveConfig}
        initialConfig={editingConfig?.configurationType === 'VALIDATION_RULES' ? editingConfig as AlertConfig : null}
      />
    </div>
  );
}
