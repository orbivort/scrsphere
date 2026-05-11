/**
 * Mock Data Utility Functions
 *
 * Provides utility functions for generating IDs, dates, and validating
 * mock data entities in the frontend application.
 */

import type { TeamMember } from '../types';

import { mockUsers, mockTeams, mockSprints, mockProductBacklogItems } from './mockData';

// ==================== ID Generation Functions ====================

/**
 * Generates a UUID using the Web Crypto API.
 * @returns A unique identifier string
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Generates an entity ID with a given prefix using timestamp.
 * @param prefix - The prefix for the ID (e.g., 'user', 'team', 'sprint')
 * @returns An ID in the format 'prefix-timestamp'
 */
export function generateEntityId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

// ==================== Date Utility Functions ====================

/**
 * Returns the current date.
 * @returns Current date object
 */
export function mockNow(): Date {
  return new Date();
}

/**
 * Returns today's date in YYYY-MM-DD format.
 * @returns Today's date string
 */
export function mockToday(): string {
  const now = mockNow();
  return now.toISOString().split('T')[0] ?? '';
}

/**
 * Converts a Date object to ISO string format.
 * @param date - The date to convert
 * @returns ISO string representation of the date
 */
export function mockIso(date: Date): string {
  return date.toISOString();
}

/**
 * Returns an ISO string for N days ago from now.
 * @param days - Number of days in the past
 * @returns ISO string for the date N days ago
 */
export function mockDaysAgo(days: number): string {
  const date = mockNow();
  date.setDate(date.getDate() - days);
  return mockIso(date);
}

/**
 * Returns an ISO string for N days from now.
 * @param days - Number of days in the future
 * @returns ISO string for the date N days from now
 */
export function mockDaysFromNow(days: number): string {
  const date = mockNow();
  date.setDate(date.getDate() + days);
  return mockIso(date);
}

// ==================== Validation Helpers ====================

/**
 * Validates if a user exists in the mock data.
 * @param userId - The user ID to validate
 * @returns True if the user exists, false otherwise
 */
export function validateUserExists(userId: string): boolean {
  return mockUsers.some((user) => user.id === userId);
}

/**
 * Validates if a team exists in the mock data.
 * @param teamId - The team ID to validate
 * @returns True if the team exists, false otherwise
 */
export function validateTeamExists(teamId: string): boolean {
  return mockTeams.some((team) => team.id === teamId);
}

/**
 * Validates if a sprint exists in the mock data.
 * @param sprintId - The sprint ID to validate
 * @returns True if the sprint exists, false otherwise
 */
export function validateSprintExists(sprintId: string): boolean {
  return mockSprints.some((sprint) => sprint.id === sprintId);
}

/**
 * Validates if a product backlog item exists in the mock data.
 * @param pbiId - The product backlog item ID to validate
 * @returns True if the PBI exists, false otherwise
 */
export function validatePBIExists(pbiId: string): boolean {
  return mockProductBacklogItems.some((pbi) => pbi.id === pbiId);
}

// ==================== Relational Integrity Helpers ====================

/**
 * Returns all team members for a given team.
 * @param teamId - The team ID to get members for
 * @returns Array of TeamMember objects, or empty array if team not found
 */
export function getTeamMembers(teamId: string): TeamMember[] {
  const team = mockTeams.find((t) => t.id === teamId);
  return team?.members ?? [];
}

/**
 * Checks if a user is a member of a specific team.
 * @param userId - The user ID to check
 * @param teamId - The team ID to check
 * @returns True if the user is in the team, false otherwise
 */
export function isUserInTeam(userId: string, teamId: string): boolean {
  const members = getTeamMembers(teamId);
  return members.some((member) => member.userId === userId);
}
