export type TaskId = string;

export interface Subtask {
  id: TaskId;
  parentId: TaskId;
  title: string;
  description?: string;
  tags: string[];
  completedAt?: string; // ISO string
  isCompleted: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  subtasks: Subtask[];
}

export interface Task {
  id: TaskId;
  title: string;
  description?: string;
  tags: string[];
  completedAt?: string; // ISO string
  isCompleted: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  subtasks: Subtask[];
}
