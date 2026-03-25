export type TaskStatus = 'backlog' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  parentId?: string | null;
  order: number;
  tagIds: string[];
  scheduledDay?: string | null; // ISO date e.g. "2026-03-25"
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  id?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  parentId?: string;
  order?: number;
  tagIds?: string[];
  scheduledDay?: string;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  parentId?: string | null;
  order?: number;
  tagIds?: string[];
  scheduledDay?: string | null;
  dueDate?: string | null;
}

export interface ReorderRequest {
  parentId?: string;
  orderedIds: string[];
}
