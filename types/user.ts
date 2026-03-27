export type UserRole = "student" | "staff" | "admin";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  token?: string;
  // University specific fields
  rollNumber?: string;
  universityName?: string;
  departmentName?: string;
  program?: string;
  semester?: string;
  section?: string;
}
