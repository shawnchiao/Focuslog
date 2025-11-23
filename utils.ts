import { Task, Subtask } from './types';

// Generate a random ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

// Parse tags from a string (e.g., "Buy milk #groceries #urgent")
// Returns the cleaned title and the array of tags.
export const parseTaskInput = (input: string) => {
  const tagRegex = /#[\w-]+/g;
  const tags = (input.match(tagRegex) || []).map(tag => tag.substring(1)); // Remove #
  const title = input.replace(tagRegex, '').trim();
  
  return { title: title || input, tags }; // If title becomes empty (only tags), keep original or handle gracefully
};

export const formatDate = (isoDate: string): string => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
};

export const getISODateOnly = (date: Date = new Date()) => {
  return date.toISOString().split('T')[0];
}

// Recursive Tree Helpers

export const toggleInTree = <T extends Task | Subtask>(items: T[], id: string): T[] => {
    return items.map(item => {
        if (item.id === id) {
            const isCompleted = !item.isCompleted;
            return {
                ...item,
                isCompleted,
                completedAt: isCompleted ? new Date().toISOString() : undefined,
                updatedAt: new Date().toISOString()
            };
        }
        if (item.subtasks && item.subtasks.length > 0) {
            return { ...item, subtasks: toggleInTree(item.subtasks, id) };
        }
        return item;
    });
};

export const updateInTree = <T extends Task | Subtask>(items: T[], id: string, updates: Partial<Subtask>): T[] => {
    return items.map(item => {
        if (item.id === id) {
            return { ...item, ...updates, updatedAt: new Date().toISOString() };
        }
        if (item.subtasks && item.subtasks.length > 0) {
            return { ...item, subtasks: updateInTree(item.subtasks, id, updates) };
        }
        return item;
    });
};

export const deleteFromTree = <T extends Task | Subtask>(items: T[], id: string): T[] => {
    return items
        .filter(item => item.id !== id)
        .map(item => {
             if (item.subtasks && item.subtasks.length > 0) {
                 return { ...item, subtasks: deleteFromTree(item.subtasks, id) };
             }
             return item;
        });
};

export const addToTree = <T extends Task | Subtask>(items: T[], parentId: string, newSubtask: Subtask): T[] => {
    return items.map(item => {
        if (item.id === parentId) {
            const currentSubtasks = item.subtasks || [];
            return { ...item, subtasks: [...currentSubtasks, newSubtask] };
        }
        if (item.subtasks && item.subtasks.length > 0) {
             return { ...item, subtasks: addToTree(item.subtasks, parentId, newSubtask) };
        }
        return item;
    });
};
