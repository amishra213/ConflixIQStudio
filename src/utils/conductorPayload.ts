/**
 * Conductor API Payload Utilities
 * Ensures payloads are correctly formatted for Conductor server endpoints
 */

import type { WorkflowDefinition } from './workflowConverter';

/**
 * Wraps a single workflow definition in an array format required by Conductor API
 * The Conductor REST endpoints (POST and PUT /api/metadata/workflow) expect an array
 * @param workflow - Single workflow definition to wrap
 * @returns Array containing the workflow
 */
export function wrapWorkflowForConductor(workflow: WorkflowDefinition): WorkflowDefinition[] {
  return Array.isArray(workflow) ? workflow : [workflow];
}

/**
 * Ensures workflow has all required fields for Conductor deserialization
 * Adds missing required fields that Conductor expects
 * @param workflow - Workflow definition to validate and normalize
 * @returns Normalized workflow with all required fields
 */
export function normalizeWorkflowForConductor(workflow: WorkflowDefinition): WorkflowDefinition {
  return {
    // Ensure all required fields are present with defaults
    name: workflow.name || 'Unnamed Workflow',
    version: workflow.version ?? 1,
    description: workflow.description || '',

    // Ensure arrays are properly formatted
    tasks: Array.isArray(workflow.tasks) ? workflow.tasks : [],
    inputParameters: Array.isArray(workflow.inputParameters) ? workflow.inputParameters : [],

    // Ensure objects are properly formatted
    outputParameters: workflow.outputParameters || {},

    // Ensure default values for boolean fields
    restartable: workflow.restartable ?? true,
    workflowStatusListenerEnabled: workflow.workflowStatusListenerEnabled ?? false,

    // Ensure numeric defaults
    schemaVersion: workflow.schemaVersion || 2,
    timeoutSeconds: workflow.timeoutSeconds || 3600,
    timeoutPolicy: workflow.timeoutPolicy || 'TIME_OUT_WF',

    // Include optional fields if present, with defaults
    ownerEmail: workflow.ownerEmail || 'ConflixIQStudio@DefaultMail.com',
  };
}

/**
 * Prepares a workflow for sending to Conductor server
 * Combines normalization and wrapping
 * @param workflow - Workflow definition to prepare
 * @returns Array of normalized workflow definitions ready for Conductor
 */
export function prepareWorkflowForConductor(workflow: WorkflowDefinition): WorkflowDefinition[] {
  const normalized = normalizeWorkflowForConductor(workflow);
  return wrapWorkflowForConductor(normalized);
}
