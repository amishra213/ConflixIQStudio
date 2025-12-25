import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2Icon } from 'lucide-react';
import { Condition, ConditionType } from '@/types/config';

interface ConditionFormProps {
  condition: Condition;
  onChange: (updatedCondition: Condition) => void;
  onRemove: () => void;
  isRemovable: boolean;
}

const conditionTypes: ConditionType[] = [
  'EQUAL',
  'NOT_EQUAL',
  'IN',
  'NOT_IN',
  'LESS_THAN',
  'GREATER_THAN',
  'BETWEEN',
  'STARTS_WITH',
  'ENDS_WITH',
  'DEFINED',
  'NOT_DEFINED',
  'CONTAINS',
  'NOT_CONTAINS',
  'AFTER',
  'BEFORE',
  'NOT_NULL',
  'BEFORE_WITHIN',
  'AFTER_WITHIN',
];

const durationUOMs = ['SECONDS', 'MINUTES', 'HOURS', 'DAYS'];

export const ConditionForm: React.FC<ConditionFormProps> = ({
  condition,
  onChange,
  onRemove,
  isRemovable,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({ ...condition, [name]: value });
  };

  const handleSelectChange = (name: keyof Condition, value: string) => {
    onChange({ ...condition, [name]: value });
  };

  const showDurationFields = ['BEFORE_WITHIN', 'AFTER_WITHIN', 'NOT_DEFINED'].includes(
    condition.conditionType
  );
  const showValueField = !['DEFINED', 'NOT_DEFINED', 'NOT_NULL'].includes(condition.conditionType);
  const showMessageField = true; // Always show message for validation conditions

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end p-3 bg-background border border-border rounded-md">
      <div className="md:col-span-2">
        <Label className="text-foreground text-xs">Name</Label>
        <Input
          name="name"
          value={condition.name}
          onChange={handleInputChange}
          placeholder="e.g., orderLines[].state"
          className="mt-1 h-9 bg-card text-foreground border-border"
        />
      </div>
      <div>
        <Label className="text-foreground text-xs">Condition Type</Label>
        <Select
          value={condition.conditionType}
          onValueChange={(value: ConditionType) => handleSelectChange('conditionType', value)}
        >
          <SelectTrigger className="mt-1 h-9 bg-card text-foreground border-border">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="bg-card text-foreground border-border">
            {conditionTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showValueField && (
        <div>
          <Label className="text-foreground text-xs">Value</Label>
          <Input
            name="value"
            value={condition.value}
            onChange={handleInputChange}
            placeholder="e.g., FULFILLED"
            className="mt-1 h-9 bg-card text-foreground border-border"
          />
        </div>
      )}
      {showDurationFields && (
        <>
          <div>
            <Label className="text-foreground text-xs">Duration</Label>
            <Input
              name="duration"
              type="number"
              value={condition.duration || ''}
              onChange={handleInputChange}
              placeholder="e.g., 1"
              className="mt-1 h-9 bg-card text-foreground border-border"
            />
          </div>
          <div>
            <Label className="text-foreground text-xs">UOM</Label>
            <Select
              value={condition.uom || ''}
              onValueChange={(value: string) => handleSelectChange('uom', value)}
            >
              <SelectTrigger className="mt-1 h-9 bg-card text-foreground border-border">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent className="bg-card text-foreground border-border">
                {durationUOMs.map((uom) => (
                  <SelectItem key={uom} value={uom}>
                    {uom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      {showMessageField && (
        <div className="md:col-span-2">
          <Label className="text-white text-xs">Message (for Validation)</Label>
          <Input
            name="message"
            value={condition.message || ''}
            onChange={handleInputChange}
            placeholder="e.g., Order line reached fulfilled"
            className="mt-1 h-9 bg-card text-foreground border-border"
          />
        </div>
      )}
      {isRemovable && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-500 hover:bg-red-500/10 hover:text-red-400 mt-1 h-9 w-9 p-0 md:col-span-1 md:self-end"
          title="Remove condition"
        >
          <Trash2Icon className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
