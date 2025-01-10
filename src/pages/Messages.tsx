import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, query, where, orderBy, addDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';

interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: Date;
  otherUserName?: string;
  otherUserPhoto?: string;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
}

// First, let's create an interface for the raw chat data
interface ChatData {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: {
    toDate: () => Date;
  };
  otherUserName: string;
  otherUserPhoto: string;
}

export default function Messages() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const auth = getAuth();
  const location = useLocation();

  // Get chat ID from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chatUserId = params.get('chat');
    if (chatUserId && auth.currentUser) {
      // Check if chat exists or create new one
      initializeChat(chatUserId);
    }
  }, [location, auth.currentUser]);

  // Initialize or get existing chat
  const initializeChat = async (otherUserId: string) => {
    if (!auth.currentUser) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    let existingChat = querySnapshot.docs.find(
      doc => doc.data().participants.includes(otherUserId)
    );

    if (!existingChat) {
      // Create new chat
      const newChatRef = await addDoc(chatsRef, {
        participants: [auth.currentUser.uid, otherUserId],
        lastMessage: '',
        lastMessageTime: new Date()
      });
      setSelectedChat(newChatRef.id);
    } else {
      setSelectedChat(existingChat.id);
    }
  };

  // Fetch user's chats
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const otherUserId = data.participants.find(
          (id: string) => id !== auth.currentUser?.uid
        );
        
        // Get other user's details
        const userDoc = await getDocs(
          query(collection(db, 'users'), where('uid', '==', otherUserId))
        );
        const userData = userDoc.docs[0]?.data();

        return {
          id: doc.id,
          participants: data.participants || [],
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime,
          otherUserName: userData?.displayName || 'Unknown User',
          otherUserPhoto: userData?.photoURL || ''
        } as ChatData;
      }));

      const formattedChats: Chat[] = chatsData.map(doc => ({
        id: doc.id,
        participants: doc.participants,
        lastMessage: doc.lastMessage,
        lastMessageTime: doc.lastMessageTime ? doc.lastMessageTime.toDate() : new Date(),
        otherUserName: doc.otherUserName,
        otherUserPhoto: doc.otherUserPhoto
      }));

      setChats(formattedChats);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    const q = query(
      collection(db, `chats/${selectedChat}/messages`),
      orderBy('timestamp')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message))
      );
      
      // Scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    return () => unsubscribe();
  }, [selectedChat]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !auth.currentUser) return;

    try {
      await addDoc(collection(db, `chats/${selectedChat}/messages`), {
        text: newMessage,
        senderId: auth.currentUser.uid,
        timestamp: new Date()
      });

      // Update last message in chat
      await addDoc(collection(db, 'chats'), {
        lastMessage: newMessage,
        lastMessageTime: new Date()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Chat list sidebar */}
      <div className="w-80 border-r border-gray-800 overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Messages</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`w-full p-4 text-left hover:bg-gray-800 transition-colors ${
                selectedChat === chat.id ? 'bg-gray-800' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                {chat.otherUserPhoto ? (
                  <img 
                    src={chat.otherUserPhoto} 
                    alt="" 
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-lg text-gray-300">
                      {chat.otherUserName?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {chat.otherUserName}
                  </p>
                  <p className="text-sm text-gray-400 truncate">
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                {chats.find(c => c.id === selectedChat)?.otherUserPhoto ? (
                  <img 
                    src={chats.find(c => c.id === selectedChat)?.otherUserPhoto} 
                    alt="" 
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-lg text-gray-300">
                      {chats.find(c => c.id === selectedChat)?.otherUserName?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-medium text-white">
                  {chats.find(c => c.id === selectedChat)?.otherUserName}
                </h3>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.senderId === auth.currentUser?.uid
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-100'
                    }`}
                  >
                    <p>{message.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-800">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
} 