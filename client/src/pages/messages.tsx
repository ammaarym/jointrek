import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SendHorizonalIcon } from "lucide-react";
import { collection, query, where, onSnapshot, addDoc, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Message, Conversation } from "@/lib/types";

export default function Messages() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Load conversations
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, "conversations"),
        where("participants", "array-contains", currentUser.uid)
      ),
      (querySnapshot) => {
        const conversationsList: Conversation[] = [];
        querySnapshot.forEach((doc) => {
          conversationsList.push({
            id: doc.id,
            ...doc.data(),
          } as Conversation);
        });
        setConversations(conversationsList);
        setLoading(false);

        // Select first conversation by default
        if (conversationsList.length > 0 && !selectedConversation) {
          setSelectedConversation(conversationsList[0].id);
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, "messages"),
        where("conversationId", "==", selectedConversation),
        orderBy("timestamp", "asc")
      ),
      (querySnapshot) => {
        const messagesList: Message[] = [];
        querySnapshot.forEach((doc) => {
          messagesList.push({
            id: doc.id,
            ...doc.data(),
          } as Message);
        });
        setMessages(messagesList);
      }
    );

    return () => unsubscribe();
  }, [selectedConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    try {
      await addDoc(collection(db, "messages"), {
        conversationId: selectedConversation,
        senderId: currentUser.uid,
        text: newMessage,
        timestamp: Timestamp.now(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const getOtherParticipantName = (conversation: Conversation): string => {
    if (!currentUser) return "Unknown";
    
    const otherParticipantId = conversation.participants.find(id => id !== currentUser.uid);
    const otherParticipant = conversation.participantsData?.find(
      participant => participant.id === otherParticipantId
    );
    
    return otherParticipant?.displayName || "Unknown";
  };

  const getOtherParticipantPhoto = (conversation: Conversation): string => {
    if (!currentUser) return "";
    
    const otherParticipantId = conversation.participants.find(id => id !== currentUser.uid);
    const otherParticipant = conversation.participantsData?.find(
      participant => participant.id === otherParticipantId
    );
    
    return otherParticipant?.photoUrl || "";
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4">Login Required</h2>
            <p className="mb-4">Please log in to view your messages.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">Messages</h2>

      {loading ? (
        <div className="text-center py-8">Loading messages...</div>
      ) : conversations.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 text-center py-12">
            <h3 className="text-xl font-medium mb-2">No conversations yet</h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Book a ride or post your own to start messaging with other Gators.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex h-[600px] bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden">
          {/* Conversations List */}
          <div className="w-1/4 border-r border-neutral-200 dark:border-neutral-700 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
                  selectedConversation === conversation.id
                    ? "bg-neutral-100 dark:bg-neutral-700"
                    : ""
                }`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={getOtherParticipantPhoto(conversation)} />
                    <AvatarFallback>
                      {getInitials(getOtherParticipantName(conversation))}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-sm dark:text-white truncate">
                      {getOtherParticipantName(conversation)}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {conversation.lastMessage || "Start a conversation"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            {selectedConversation && (
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage
                      src={getOtherParticipantPhoto(
                        conversations.find((c) => c.id === selectedConversation)!
                      )}
                    />
                    <AvatarFallback>
                      {getInitials(
                        getOtherParticipantName(
                          conversations.find((c) => c.id === selectedConversation)!
                        )
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold dark:text-white">
                    {getOtherParticipantName(
                      conversations.find((c) => c.id === selectedConversation)!
                    )}
                  </h3>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === currentUser.uid ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      message.senderId === currentUser.uid
                        ? "bg-primary-blue text-white"
                        : "bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white"
                    }`}
                  >
                    <p>{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp?.toDate().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="bg-primary-orange text-white">
                  <SendHorizonalIcon className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
