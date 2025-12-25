import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { ConditionGroup, JoinType, Condition } from '@/types/config';
import { ConditionForm } from './ConditionForm';
import { v4 as uuidv4 } from 'uuid';

interface ConditionGroupFormProps {
  group: ConditionGroup;
  onChange: (updatedGroup: ConditionGroup) => void;
  onRemove: () => void;
  isRemovable: boolean;
  title: string;
}

export const ConditionGroupForm: React.FC<ConditionGroupFormProps> = ({
  group,
  onChange,
  onRemove,
  isRemovable,
  title,
}) => {
  const handleAddCondition = () => {
    const newCondition: Condition = {
      id: uuidv4(),
      name: '',
      conditionType: 'EQUAL',
      value: '',
    };
    onChange({ ...group, conditions: [...group.conditions, newCondition] });
  };

  const handleUpdateCondition = (updatedCondition: Condition) => {
    onChange({
      ...group,
      conditions: group.conditions.map((cond) =>
        cond.id === updatedCondition.id ? updatedCondition : cond
      ),
    });
  };

  const handleRemoveCondition = (id: string) => {
    onChange({
      ...group,
      conditions: group.conditions.filter((cond) => cond.id !== id),
    });
  };

  const handleJoinTypeChange = (value: JoinType) => {
    onChange({ ...group, joinType: value });
  };

  return (
    <div className="p-4 bg-card border border-border rounded-lg space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
        <h4 className="text-md font-semibold text-foreground">{title}</h4>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-foreground text-xs">Join Type</Label>
            <Select value={group.joinType} onValueChange={handleJoinTypeChange}>
              <SelectTrigger className="h-8 w-24 bg-background text-foreground border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card text-foreground border-border">
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            onClick={handleAddCondition}
            className="bg-cyan-500 text-white hover:bg-cyan-600 h-8 px-3 text-xs"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add Condition
          </Button>
          {isRemovable && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRemove}
              className="text-red-500 border-red-500/50 hover:bg-red-500/10 h-8 px-3 text-xs"
            >
              <Trash2Icon className="w-4 h-4 mr-1" />
              Remove Group
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {group.conditions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            No conditions defined in this group.
          </p>
        ) : (
          group.conditions.map((condition) => (
            <ConditionForm
              key={condition.id}
              condition={condition}
              onChange={handleUpdateCondition}
              onRemove={() => handleRemoveCondition(condition.id)}
              isRemovable={group.conditions.length > 1}
            />
          ))
        )}
      </div>
    </div>
  );
};
