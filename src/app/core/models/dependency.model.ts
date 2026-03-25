export interface TaskDependency {
  id: string;
  prerequisiteId: string;
  dependentId: string;
  createdAt: string;
}

export interface CreateDependencyRequest {
  prerequisiteId: string;
  dependentId: string;
}

export interface TaskDependencySummary {
  taskId: string;
  prerequisites: { id: string; taskId: string }[];
  dependents:    { id: string; taskId: string }[];
}

export interface CanvasPosition {
  taskId: string;
  x: number;
  y: number;
  updatedAt: string;
}

export interface CanvasPositionRequest {
  x: number;
  y: number;
}
