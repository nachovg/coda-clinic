import { codaMockData } from "@/src/lib/mock-data";
import type { Conversation } from "@/src/types/domain";

const conversations = codaMockData.messages as Conversation[];

export async function getConversations(): Promise<Conversation[]> {
  return conversations;
}

export async function getConversationById(conversationId: string): Promise<Conversation | undefined> {
  return conversations.find((conversation) => conversation.id === conversationId);
}
