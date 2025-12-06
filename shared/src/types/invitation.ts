export type InvitationType = 'student' | 'parent'

export interface Invitation {
  id: string
  type: InvitationType
  teacherId: string
  studentId?: string
  subjectId?: string
  token: string
  usedAt?: string
  expiresAt: string
  createdAt: string
}

export interface InvitationResponse {
  invitationId: string
  inviteUrl: string
  expiresAt: string
}

export interface TeacherInviteLink {
  referralCode: string
  inviteUrl: string
  fallbackUrl: string
}

export interface ParentInviteLink {
  parentInviteCode: string
  inviteUrl: string
  fallbackUrl: string
}

