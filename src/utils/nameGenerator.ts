/**
 * Generates a unique name with timestamp and random digits
 * Format: <prefix>_ddMMyyyyHHMMss_<Random3Digits>
 *
 * @param prefix - The prefix for the name (e.g., 'NewWorkflow', 'HTTP_Task', 'SIMPLE_Task')
 * @returns A unique name string without spaces
 *
 * @example
 * generateUniqueName('NewWorkflow') // 'NewWorkflow_19112025143045_742'
 * generateUniqueName('HTTP_Task') // 'HTTP_Task_19112025143045_128'
 */
export function generateUniqueName(prefix: string): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random3Digits = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

  return `${prefix}_${day}${month}${year}${hours}${minutes}${seconds}_${random3Digits}`;
}

/**
 * Generates a unique workflow name
 * Format: NewWorkflow_ddMMyyyyHHMMss_<Random3Digits>
 *
 * @returns A unique workflow name
 */
export function generateUniqueWorkflowName(): string {
  return generateUniqueName('NewWorkflow');
}

/**
 * Generates a unique task name based on task type
 * Format: <TaskType>_Task_ddMMyyyyHHMMss_<Random3Digits>
 *
 * @param taskType - The type of task (e.g., 'SIMPLE', 'HTTP', 'KAFKA_PUBLISH')
 * @returns A unique task name
 */
export function generateUniqueTaskName(taskType: string): string {
  return generateUniqueName(`${taskType}_Task`);
}
