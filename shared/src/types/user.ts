export type UserRole = 'teacher' | 'student' | 'parent'

export interface User {
  id: string
  telegramId: number
  role: UserRole
  firstName?: string
  lastName?: string
  username?: string
  createdAt: string
  updatedAt: string
}

export interface UserWithRoles extends Omit<User, 'role'> {
  roles: UserRole[]
}

