import { codaMockData } from "@/src/lib/mock-data";
import { getPatientById } from "@/src/lib/repositories/patients.repository";
import type {
  Conversation,
  ConversationStatus,
  Message,
  Notification,
  NotificationPriority,
  NotificationType,
} from "@/src/types/domain";

const storageKey = "coda.messagesState";

interface MessagesState {
  createdConversations: Conversation[];
  updatedConversations: Record<string, Conversation>;
  updatedNotifications: Record<string, Notification>;
}

export interface NewConversationInput {
  patientId: string;
  subject: string;
  body: string;
  senderId: string;
}

const emptyState = (): MessagesState => ({
  createdConversations: [],
  updatedConversations: {},
  updatedNotifications: {},
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMessage(value: unknown): value is Message {
  return isRecord(value)
    && typeof value.id === "string"
    && (value.senderType === "OWNER" || value.senderType === "STAFF")
    && typeof value.senderId === "string"
    && typeof value.body === "string"
    && typeof value.sentAt === "string";
}

function isConversation(value: unknown): value is Conversation {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.clinicId === "string"
    && typeof value.ownerId === "string"
    && typeof value.patientId === "string"
    && typeof value.subject === "string"
    && typeof value.preview === "string"
    && typeof value.lastMessageAt === "string"
    && (value.status === "READ" || value.status === "UNREAD")
    && value.priority === "NORMAL"
    && Array.isArray(value.messages)
    && value.messages.every(isMessage);
}

function isNotification(value: unknown): value is Notification {
  const types: NotificationType[] = ["MESSAGE", "EMERGENCY_CHECK_IN", "LAB_RESULT", "SYSTEM", "APPOINTMENT"];
  const priorities: NotificationPriority[] = ["NORMAL", "HIGH", "LOW"];
  return isRecord(value)
    && typeof value.id === "string"
    && types.includes(value.type as NotificationType)
    && typeof value.title === "string"
    && typeof value.body === "string"
    && priorities.includes(value.priority as NotificationPriority)
    && typeof value.read === "boolean"
    && typeof value.createdAt === "string"
    && (value.ownerId === undefined || typeof value.ownerId === "string")
    && (value.patientId === undefined || typeof value.patientId === "string");
}

function readState(): MessagesState {
  if (typeof window === "undefined") return emptyState();
  let stored: string | null;
  try {
    stored = window.localStorage.getItem(storageKey);
  } catch {
    throw new Error("Message storage is unavailable in this browser.");
  }
  if (stored === null) return emptyState();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    throw new Error("Message storage is corrupted. Clear or repair the local message data before continuing.");
  }
  if (!isRecord(parsed)) throw new Error("Message storage has an invalid format.");

  const updatedConversations: Record<string, Conversation> = {};
  if (isRecord(parsed.updatedConversations)) {
    for (const [id, value] of Object.entries(parsed.updatedConversations)) {
      if (isConversation(value) && value.id === id) updatedConversations[id] = value;
    }
  }
  const updatedNotifications: Record<string, Notification> = {};
  if (isRecord(parsed.updatedNotifications)) {
    for (const [id, value] of Object.entries(parsed.updatedNotifications)) {
      if (isNotification(value) && value.id === id) updatedNotifications[id] = value;
    }
  }
  return {
    createdConversations: Array.isArray(parsed.createdConversations)
      ? parsed.createdConversations.filter(isConversation)
      : [],
    updatedConversations,
    updatedNotifications,
  };
}

function writeState(state: MessagesState): void {
  if (typeof window === "undefined") throw new Error("Message storage is only available in the browser.");
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    throw new Error("Message changes could not be saved. Check browser storage and try again.");
  }
}

function allConversations(state: MessagesState): Conversation[] {
  const originalIds = new Set(codaMockData.messages.map(({ id }) => id));
  const originals = codaMockData.messages.map((conversation) => state.updatedConversations[conversation.id] ?? conversation);
  return [...originals, ...state.createdConversations.filter(({ id }) => !originalIds.has(id))];
}

function allNotifications(state: MessagesState): Notification[] {
  return codaMockData.notifications.map((notification) => state.updatedNotifications[notification.id] ?? notification);
}

export async function getConversations(): Promise<Conversation[]> {
  return allConversations(readState());
}

export async function getConversationById(conversationId: string): Promise<Conversation | undefined> {
  return allConversations(readState()).find(({ id }) => id === conversationId);
}

export async function getNotifications(): Promise<Notification[]> {
  return allNotifications(readState());
}

export async function updateConversationStatus(
  conversationId: string,
  status: ConversationStatus,
): Promise<Conversation> {
  const state = readState();
  const conversation = allConversations(state).find(({ id }) => id === conversationId);
  if (!conversation) throw new Error("Conversation not found.");
  if (conversation.status === status) return conversation;
  const updated = { ...conversation, status };
  if (codaMockData.messages.some(({ id }) => id === conversationId)) {
    state.updatedConversations[conversationId] = updated;
  } else {
    state.createdConversations = state.createdConversations.map((item) => item.id === conversationId ? updated : item);
  }
  writeState(state);
  return updated;
}

export async function replyToConversation(conversationId: string, body: string, senderId: string): Promise<Conversation> {
  const messageBody = body.trim();
  if (!messageBody) throw new Error("Write a message before sending.");
  const state = readState();
  const conversation = allConversations(state).find(({ id }) => id === conversationId);
  if (!conversation) throw new Error("Conversation not found.");
  const message: Message = {
    id: `message_${crypto.randomUUID()}`,
    senderType: "STAFF",
    senderId,
    body: messageBody,
    sentAt: new Date().toISOString(),
  };
  const updated: Conversation = {
    ...conversation,
    preview: messageBody,
    lastMessageAt: message.sentAt,
    status: "READ",
    messages: [...conversation.messages, message],
  };
  if (codaMockData.messages.some(({ id }) => id === conversationId)) {
    state.updatedConversations[conversationId] = updated;
  } else {
    state.createdConversations = state.createdConversations.map((item) => item.id === conversationId ? updated : item);
  }
  writeState(state);
  return updated;
}

export async function createConversation(input: NewConversationInput): Promise<Conversation> {
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!subject || !body) throw new Error("Subject and message are required.");
  const patient = await getPatientById(input.patientId);
  if (!patient) throw new Error("Select a patient from the clinic.");
  const owner = codaMockData.owners.find(({ id }) => id === patient.ownerId);
  if (!owner) throw new Error("The selected patient does not have a valid owner in the clinic records.");

  const state = readState();
  const now = new Date().toISOString();
  const message: Message = {
    id: `message_${crypto.randomUUID()}`,
    senderType: "STAFF",
    senderId: input.senderId,
    body,
    sentAt: now,
  };
  const conversation: Conversation = {
    id: `conversation_${crypto.randomUUID()}`,
    clinicId: patient.clinicId,
    ownerId: owner.id,
    patientId: patient.id,
    subject,
    preview: body,
    lastMessageAt: now,
    status: "READ",
    priority: "NORMAL",
    messages: [message],
  };
  state.createdConversations = [...state.createdConversations, conversation];
  writeState(state);
  return conversation;
}

export async function updateNotificationRead(notificationId: string, read: boolean): Promise<Notification> {
  const state = readState();
  const notification = allNotifications(state).find(({ id }) => id === notificationId);
  if (!notification) throw new Error("Alert not found.");
  if (notification.read === read) return notification;
  const updated = { ...notification, read };
  state.updatedNotifications[notificationId] = updated;
  writeState(state);
  return updated;
}
