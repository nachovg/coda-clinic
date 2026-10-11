import { codaMockData } from "@/src/lib/mock-data";

export async function getConversations() {
  return codaMockData.messages;
}

export async function getConversationById(conversationId: string) {
  return codaMockData.messages.find((conversation) => conversation.id === conversationId);
}
