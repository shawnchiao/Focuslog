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