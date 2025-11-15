import { useState, useEffect } from 'react';
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogFooter,
    } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Label } from '@/components/ui/label';
    import { Input } from '@/components/ui/input';
    import { Textarea } from '@/components/ui/textarea';
    import { Card } from '@/components/ui/card';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Switch } from '@/components/ui/switch';
    import { PlusIcon, Trash2Icon, AlertCircleIcon } from 'lucide-react';
    import { v4 as uuidv4 } from 'uuid';
    import { Config, AlertConfig, ConditionGroup, FilterConditions, ValidationConditions, JoinType } from '@/types/config';
    import { ConditionGroupForm } from '@/components/alert-config/ConditionGroupForm';

    interface AlertConfigModalProps {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      onSave: (config: Config) => void; // Changed to generic Config
      initialConfig?: AlertConfig | null; // Still expects AlertConfig for initial values
    }

    const defaultFilterConditions: FilterConditions = {
      conditionGroups: [{ id: uuidv4(), conditions: [{ id: uuidv4(), name: '', conditionType: 'EQUAL', value: '' }], joinType: 'AND' }],
      joinType: 'AND',
    };

    const defaultValidationConditions: ValidationConditions = {
      conditionGroups: [{ id: uuidv4(), conditions: [{ id: uuidv4(), name: '', conditionType: 'EQUAL', value: '' }], joinType: 'AND' }],
      joinType: 'AND',
    };

    export function AlertConfigModal({
      open,
      onOpenChange,
      onSave,
      initialConfig,
    }: AlertConfigModalProps) {
      const [config, setConfig] = useState<AlertConfig>(() => ({
        id: uuidv4(),
        configurationId: '',
        configurationType: 'VALIDATION_RULES',
        effectiveEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        effectiveStart: new Date().toISOString().split('T')[0],
        enabled: true,
        entity: 'ORDER',
        filterConditions: defaultFilterConditions,
        operationType: 'ALERT',
        orgId: 'ORG001',
        priority: 1,
        updateTime: new Date().toISOString(),
        updateUser: 'COV',
        validationConditions: [defaultValidationConditions],
        version: 1,
        customEvaluation: false,
        customEvaluatorParams: {},
      }));

      const [jsonError, setJsonError] = useState('');
      const [customEvaluatorParamsJson, setCustomEvaluatorParamsJson] = useState('{}');

      useEffect(() => {
        if (open) {
          if (initialConfig) {
            setConfig({
              ...initialConfig,
              effectiveStart: initialConfig.effectiveStart.split('T')[0],
              effectiveEnd: initialConfig.effectiveEnd.split('T')[0],
            });
            setCustomEvaluatorParamsJson(JSON.stringify(initialConfig.customEvaluatorParams || {}, null, 2));
          } else {
            const newId = uuidv4();
            setConfig({
              id: newId,
              configurationId: `ALERT_RULE_${newId.substring(0, 8).toUpperCase()}`,
              configurationType: 'VALIDATION_RULES',
              effectiveEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
              effectiveStart: new Date().toISOString().split('T')[0],
              enabled: true,
              entity: 'ORDER',
              filterConditions: defaultFilterConditions,
              operationType: 'ALERT',
              orgId: 'ORG001',
              priority: 1,
              updateTime: new Date().toISOString(),
              updateUser: 'COV',
              validationConditions: [defaultValidationConditions],
              version: 1,
              customEvaluation: false,
              customEvaluatorParams: {},
            });
            setCustomEvaluatorParamsJson('{}');
          }
          setJsonError('');
        }
      }, [open, initialConfig]);

      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setConfig((prev) => ({ ...prev, [name]: value }));
      };

      const handleSelectChange = (name: keyof AlertConfig, value: string | boolean | number) => {
        setConfig((prev) => ({ ...prev, [name]: value }));
      };

      const handleDateChange = (name: 'effectiveStart' | 'effectiveEnd', value: string) => {
        setConfig((prev) => ({ ...prev, [name]: value }));
      };

      const handleFilterGroupChange = (updatedGroup: ConditionGroup) => {
        setConfig((prev) => ({
          ...prev,
          filterConditions: {
            ...prev.filterConditions,
            conditionGroups: prev.filterConditions.conditionGroups.map((group) =>
              group.id === updatedGroup.id ? updatedGroup : group
            ),
          },
        }));
      };

      const handleAddFilterGroup = () => {
        setConfig((prev) => ({
          ...prev,
          filterConditions: {
            ...prev.filterConditions,
            conditionGroups: [...prev.filterConditions.conditionGroups, { id: uuidv4(), conditions: [{ id: uuidv4(), name: '', conditionType: 'EQUAL', value: '' }], joinType: 'AND' }],
          },
        }));
      };

      const handleRemoveFilterGroup = (id: string) => {
        setConfig((prev) => ({
          ...prev,
          filterConditions: {
            ...prev.filterConditions,
            conditionGroups: prev.filterConditions.conditionGroups.filter((group) => group.id !== id),
          },
        }));
      };

      const handleValidationGroupChange = (updatedGroup: ConditionGroup, index: number) => {
        setConfig((prev) => {
          const newValidationConditions = [...prev.validationConditions];
          newValidationConditions[index] = {
            ...newValidationConditions[index],
            conditionGroups: newValidationConditions[index].conditionGroups.map((group) =>
              group.id === updatedGroup.id ? updatedGroup : group
            ),
          };
          return { ...prev, validationConditions: newValidationConditions };
        });
      };

      const handleAddValidationGroup = (validationIndex: number) => {
        setConfig((prev) => {
          const newValidationConditions = [...prev.validationConditions];
          newValidationConditions[validationIndex] = {
            ...newValidationConditions[validationIndex],
            conditionGroups: [...newValidationConditions[validationIndex].conditionGroups, { id: uuidv4(), conditions: [{ id: uuidv4(), name: '', conditionType: 'EQUAL', value: '' }], joinType: 'AND' }],
          };
          return { ...prev, validationConditions: newValidationConditions };
        });
      };

      const handleRemoveValidationGroup = (validationIndex: number, groupId: string) => {
        setConfig((prev) => {
          const newValidationConditions = [...prev.validationConditions];
          newValidationConditions[validationIndex] = {
            ...newValidationConditions[validationIndex],
            conditionGroups: newValidationConditions[validationIndex].conditionGroups.filter((group) => group.id !== groupId),
          };
          return { ...prev, validationConditions: newValidationConditions };
        });
      };

      const handleAddValidationConditionSet = () => {
        setConfig((prev) => ({
          ...prev,
          validationConditions: [...prev.validationConditions, defaultValidationConditions],
        }));
      };

      const handleRemoveValidationConditionSet = (index: number) => {
        setConfig((prev) => ({
          ...prev,
          validationConditions: prev.validationConditions.filter((_, i) => i !== index),
        }));
      };

      const validateJson = (value: string) => {
        try {
          if (value.trim() === '') {
            setJsonError('');
            return true;
          }
          JSON.parse(value);
          setJsonError('');
          return true;
        } catch (error) {
          setJsonError(error instanceof Error ? error.message : 'Invalid JSON format');
          return false;
        }
      };

      const handleCustomEvaluatorParamsChange = (value: string) => {
        setCustomEvaluatorParamsJson(value);
        validateJson(value);
      };

      const handleSave = () => {
        if (!config.configurationId || !config.orgId || !config.entity) {
          alert('Please fill in all required fields: Configuration ID, Organization ID, Entity');
          return;
        }

        if (config.customEvaluation && !validateJson(customEvaluatorParamsJson)) {
          alert('Please fix JSON errors in Custom Evaluator Params.');
          return;
        }

        try {
          const parsedCustomEvaluatorParams = config.customEvaluation && customEvaluatorParamsJson.trim()
            ? JSON.parse(customEvaluatorParamsJson)
            : {};

          const finalConfig: AlertConfig = {
            ...config,
            priority: Number(config.priority),
            version: Number(config.version),
            updateTime: new Date().toISOString(),
            customEvaluatorParams: parsedCustomEvaluatorParams,
          };
          onSave(finalConfig as Config); // Cast to generic Config type
          onOpenChange(false);
        } catch (error) {
          setJsonError('Failed to parse Custom Evaluator Params JSON.');
        }
      };

      const getJsonPreview = () => {
        const parsedCustomEvaluatorParams = config.customEvaluation && customEvaluatorParamsJson.trim()
          ? JSON.parse(customEvaluatorParamsJson)
          : {};

        return {
          ...config,
          priority: Number(config.priority),
          version: Number(config.version),
          updateTime: new Date().toISOString(),
          customEvaluatorParams: parsedCustomEvaluatorParams,
        };
      };

      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-6xl h-[95vh] bg-[#1a1f2e] border-[#2a3142] text-white flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#2a3142] flex-shrink-0">
              <DialogTitle className="text-2xl font-semibold text-white">
                {initialConfig ? 'Edit Alert Configuration' : 'Create New Alert Configuration'}
              </DialogTitle>
              <p className="text-sm text-gray-400 mt-2">
                Configure rules to trigger alerts for important events.
              </p>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6">
              <Tabs defaultValue="basic" className="space-y-4 py-4">
                <TabsList className="bg-[#0f1419]">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="filter">Filter Conditions</TabsTrigger>
                  <TabsTrigger value="validation">Validation Conditions</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="json">JSON Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                    <h3 className="text-lg font-semibold text-white mb-4">General Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="configurationId" className="text-white">Configuration ID *</Label>
                        <Input
                          id="configurationId"
                          name="configurationId"
                          value={config.configurationId}
                          onChange={handleInputChange}
                          placeholder="e.g., ALERT_RULE_FOR_LINE_FULFILLED"
                          className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                        />
                      </div>
                      <div>
                        <Label htmlFor="orgId" className="text-white">Organization ID *</Label>
                        <Input
                          id="orgId"
                          name="orgId"
                          value={config.orgId}
                          onChange={handleInputChange}
                          placeholder="e.g., ORG001"
                          className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                        />
                      </div>
                      <div>
                        <Label htmlFor="entity" className="text-white">Entity *</Label>
                        <Input
                          id="entity"
                          name="entity"
                          value={config.entity}
                          onChange={handleInputChange}
                          placeholder="e.g., ORDER"
                          className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority" className="text-white">Priority</Label>
                        <Input
                          id="priority"
                          name="priority"
                          type="number"
                          value={config.priority}
                          onChange={handleInputChange}
                          className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                        />
                      </div>
                      <div>
                        <Label htmlFor="effectiveStart" className="text-white">Effective Start Date</Label>
                        <Input
                          id="effectiveStart"
                          name="effectiveStart"
                          type="date"
                          value={config.effectiveStart}
                          onChange={handleInputChange}
                          className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                        />
                      </div>
                      <div>
                        <Label htmlFor="effectiveEnd" className="text-white">Effective End Date</Label>
                        <Input
                          id="effectiveEnd"
                          name="effectiveEnd"
                          type="date"
                          value={config.effectiveEnd}
                          onChange={handleInputChange}
                          className="mt-2 bg-[#1a1f2e] text-white border-[#2a3142]"
                        />
                      </div>
                      <div className="flex items-center justify-between col-span-2 pt-2">
                        <Label htmlFor="enabled" className="text-white">Enabled</Label>
                        <Switch
                          id="enabled"
                          checked={config.enabled}
                          onCheckedChange={(checked) => handleSelectChange('enabled', checked)}
                        />
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="filter" className="space-y-4">
                  <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Filter Conditions</h3>
                      <Button
                        type="button"
                        onClick={handleAddFilterGroup}
                        className="bg-cyan-500 text-white hover:bg-cyan-600 h-9 px-4 text-sm"
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Condition Group
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {config.filterConditions.conditionGroups.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">No filter conditions defined.</p>
                      ) : (
                        config.filterConditions.conditionGroups.map((group, index) => (
                          <ConditionGroupForm
                            key={group.id}
                            group={group}
                            onChange={handleFilterGroupChange}
                            onRemove={() => handleRemoveFilterGroup(group.id)}
                            isRemovable={config.filterConditions.conditionGroups.length > 1}
                            title={`Filter Group ${index + 1}`}
                          />
                        ))
                      )}
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                      <Label className="text-white text-xs">Overall Join Type</Label>
                      <Select
                        value={config.filterConditions.joinType}
                        onValueChange={(value: JoinType) =>
                          setConfig((prev) => ({
                            ...prev,
                            filterConditions: { ...prev.filterConditions, joinType: value },
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 w-24 bg-[#1a1f2e] text-white border-[#2a3142]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                          <SelectItem value="AND">AND</SelectItem>
                          <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="validation" className="space-y-4">
                  <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Validation Conditions</h3>
                      <Button
                        type="button"
                        onClick={handleAddValidationConditionSet}
                        className="bg-cyan-500 text-white hover:bg-cyan-600 h-9 px-4 text-sm"
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Validation Set
                      </Button>
                    </div>
                    <div className="space-y-6">
                      {config.validationConditions.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">No validation conditions defined.</p>
                      ) : (
                        config.validationConditions.map((validationSet, validationIndex) => (
                          <div key={validationIndex} className="p-4 bg-[#1a1f2e] border border-[#2a3142] rounded-lg space-y-4">
                            <div className="flex items-center justify-between border-b border-[#2a3142] pb-3 mb-3">
                              <h4 className="text-md font-semibold text-white">Validation Set {validationIndex + 1}</h4>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <Label className="text-white text-xs">Overall Join Type</Label>
                                  <Select
                                    value={validationSet.joinType}
                                    onValueChange={(value: JoinType) =>
                                      setConfig((prev) => {
                                        const newValidationConditions = [...prev.validationConditions];
                                        newValidationConditions[validationIndex] = { ...newValidationConditions[validationIndex], joinType: value };
                                        return { ...prev, validationConditions: newValidationConditions };
                                      })
                                    }
                                  >
                                    <SelectTrigger className="h-8 w-24 bg-[#0f1419] text-white border-[#2a3142]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                                      <SelectItem value="AND">AND</SelectItem>
                                      <SelectItem value="OR">OR</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  type="button"
                                  onClick={() => handleAddValidationGroup(validationIndex)}
                                  className="bg-cyan-500 text-white hover:bg-cyan-600 h-8 px-3 text-xs"
                                >
                                  <PlusIcon className="w-4 h-4 mr-1" />
                                  Add Group
                                </Button>
                                {config.validationConditions.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveValidationConditionSet(validationIndex)}
                                    className="text-red-500 border-red-500/50 hover:bg-red-500/10 h-8 px-3 text-xs"
                                  >
                                    <Trash2Icon className="w-4 h-4 mr-1" />
                                    Remove Set
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-4">
                              {validationSet.conditionGroups.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-4">No condition groups defined in this set.</p>
                              ) : (
                                validationSet.conditionGroups.map((group, groupIndex) => (
                                  <ConditionGroupForm
                                    key={group.id}
                                    group={group}
                                    onChange={(updatedGroup) => handleValidationGroupChange(updatedGroup, validationIndex)}
                                    onRemove={() => handleRemoveValidationGroup(validationIndex, group.id)}
                                    isRemovable={validationSet.conditionGroups.length > 1}
                                    title={`Validation Group ${groupIndex + 1}`}
                                  />
                                ))
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                    <h3 className="text-lg font-semibold text-white mb-4">Advanced Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="customEvaluation" className="text-white">Custom Evaluation</Label>
                        <Switch
                          id="customEvaluation"
                          checked={config.customEvaluation}
                          onCheckedChange={(checked) => handleSelectChange('customEvaluation', checked)}
                        />
                      </div>
                      {config.customEvaluation && (
                        <div>
                          <Label htmlFor="customEvaluatorParams" className="text-white">Custom Evaluator Parameters (JSON)</Label>
                          {jsonError && (
                            <div className="mt-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                              <p className="text-sm text-red-400">{jsonError}</p>
                            </div>
                          )}
                          <Textarea
                            id="customEvaluatorParams"
                            value={customEvaluatorParamsJson}
                            onChange={(e) => handleCustomEvaluatorParamsChange(e.target.value)}
                            placeholder='{\n  "param1": "value1",\n  "param2": "value2"\n}'
                            className="mt-2 font-mono text-sm bg-[#1a1f2e] text-white border-[#2a3142] min-h-[150px]"
                          />
                          <p className="text-xs text-gray-400 mt-2">
                            Inputs for custom evaluation logic. Only applicable if customEvaluation is true and handled in code.
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="json" className="space-y-4">
                  <Card className="p-6 bg-[#0f1419] border-[#2a3142]">
                    <h3 className="text-lg font-semibold text-white mb-4">Complete Configuration JSON</h3>
                    {jsonError && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                        <p className="text-sm text-red-400">{jsonError}</p>
                      </div>
                    )}
                    <pre className="text-xs text-gray-300 font-mono bg-[#1a1f2e] p-4 rounded-lg border border-[#2a3142] overflow-x-auto max-h-[500px] overflow-y-auto">
                      {JSON.stringify(getJsonPreview(), null, 2)}
                    </pre>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="border-t border-[#2a3142] px-6 py-4 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="text-gray-400 border-[#2a3142] hover:bg-[#2a3142] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!!jsonError}
                className="bg-cyan-500 text-white hover:bg-cyan-600 font-medium disabled:opacity-50"
              >
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }
