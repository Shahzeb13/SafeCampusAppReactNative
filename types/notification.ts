export interface Notification {
  _id: string;
  userId: string;
  incidentId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}
