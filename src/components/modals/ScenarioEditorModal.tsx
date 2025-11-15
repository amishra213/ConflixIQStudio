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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TestScenario } from '@/services/llmService';

interface ScenarioEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (scenario: TestScenario) => void;
  initialScenario?: TestScenario | null;
}

export function ScenarioEditorModal({
  open,
  onOpenChange,
  onSave,
  initialScenario,
}: ScenarioEditorModalProps) {
  const [formData, setFormData] = useState<Partial<TestScenario>>({
    name: '',
    description: '',
    targetNode: 'all',
    testType: 'happy_path',
  });

  useEffect(() => {
    if (open) {
      setFormData(initialScenario || {
        name: '',
        description: '',
        targetNode: 'all',
        testType: 'happy_path',
        status: 'pending',
      });
    }
  }, [open, initialScenario]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof TestScenario, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.targetNode || !formData.testType) {
      alert('Please fill in all required fields.');
      return;
    }

    const scenarioToSave: TestScenario = {
      id: initialScenario?.id || `user-scenario-${Date.now()}`,
      status: initialScenario?.status || 'pending',
      inputJson: initialScenario?.inputJson,
      executionResult: initialScenario?.executionResult,
      error: initialScenario?.error,
      ...formData,
    } as TestScenario; // Type assertion as we've validated required fields

    onSave(scenarioToSave);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1f2e] border-[#2a3142] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {initialScenario ? 'Edit Test Scenario' : 'Add New Test Scenario'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-white">Scenario Name</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={handleChange}
              required
              className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={handleChange}
              required
              className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
            />
          </div>
          <div>
            <Label htmlFor="targetNode" className="text-white">Target Node (Task Reference Name)</Label>
            <Input
              id="targetNode"
              value={formData.targetNode || ''}
              onChange={handleChange}
              required
              placeholder="e.g., http_request_1 or 'all'"
              className="mt-2 bg-[#0f1419] text-white border-[#2a3142]"
            />
          </div>
          <div>
            <Label htmlFor="testType" className="text-white">Test Type</Label>
            <Select
              value={formData.testType || 'happy_path'}
              onValueChange={(value) => handleSelectChange('testType', value)}
            >
              <SelectTrigger className="mt-2 bg-[#0f1419] text-white border-[#2a3142]">
                <SelectValue placeholder="Select a test type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f2e] text-white border-[#2a3142]">
                <SelectItem value="happy_path">Happy Path</SelectItem>
                <SelectItem value="edge_case">Edge Case</SelectItem>
                <SelectItem value="error_case">Error Case</SelectItem>
                <SelectItem value="boundary">Boundary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 border-[#2a3142] hover:bg-[#2a3142] hover:text-white"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-cyan-500 text-white hover:bg-cyan-600">
              {initialScenario ? 'Save Changes' : 'Add Scenario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
