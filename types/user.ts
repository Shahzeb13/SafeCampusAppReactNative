export type UserRole = "student" | "staff" | "admin";

export interface PersonalContact {
  name: string;
  phoneNumber: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  token?: string;
  personalEmergencyContacts?: PersonalContact[];
  // University specific fields
  rollNumber?: string;
  universityName?: string;
  departmentName?: string;
  program?: string;
  semester?: string;
  section?: string;
}
