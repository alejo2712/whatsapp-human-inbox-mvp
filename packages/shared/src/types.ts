import { ConversationStatus, MessageDirection, MessageStatus, UserRole } from './enums';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface ContactDto {
  id: string;
  phone: string;
  name: string | null;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  body: string;
  status: MessageStatus;
  waMessageId: string | null;
  createdAt: string;
}

export interface ConversationDto {
  id: string;
  contact: ContactDto;
  status: ConversationStatus;
  assignedUser: UserDto | null;
  lastMessageAt: string | null;
  unreadCount: number;
  lastMessage: MessageDto | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
