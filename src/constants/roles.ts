export const ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  EMPLOYEE: 'employee',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const isAdmin = (role?: string) => role === ROLES.ADMIN;

export const isHR = (role?: string) => role === ROLES.HR;

export const isEmployee = (role?: string) => role === ROLES.EMPLOYEE;

export const isAdminOrHR = (role?: string) =>
  role === ROLES.ADMIN || role === ROLES.HR;