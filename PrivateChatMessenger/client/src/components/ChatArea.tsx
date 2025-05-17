import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import MessageItem from '@/components/MessageItem';
import { Message, ConnectionStatus } from '@/types';
import { formatTime } from '@/lib/helpers';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onSendFile: (file: File) => void;
  connectionStatus: ConnectionStatus;
  roomId: string;
}

const ChatArea = ({
  messages,
  onSendMessage,
  onSendFile,
  connectionStatus,
  roomId,
}: ChatAreaProps) => {
  const [messageText, setMessageText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const isConnected = connectionStatus === ConnectionStatus.Connected;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !isConnected) return;
    
    onSendMessage(messageText.trim());
    setMessageText('');
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isConnected) {
      onSendFile(file);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <>
      {/* Chat Header */}
      <div className="p-4 border-b border-[hsl(var(--surface-light))] flex items-center">
        <div className="flex-1">
          <h2 className="font-semibold">Private Chat</h2>
          <div className="flex items-center text-sm text-[hsl(var(--text-secondary))]">
            <span 
              className={`h-2 w-2 rounded-full ${isConnected ? 'bg-[hsl(var(--success))]' : 'bg-[hsl(var(--error))]'} mr-2`}
            />
            <span>
              {isConnected 
                ? `Connected to Room: ${roomId}`
                : 'Not connected'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative fade-edge"
      >
        {/* System message showing connection time */}
        {messages.length > 0 && (
          <div className="bg-[hsl(var(--surface-light))]/50 text-[hsl(var(--text-secondary))] text-sm px-4 py-2 rounded-lg max-w-xs mx-auto text-center">
            Connection established at {formatTime(new Date().toISOString())}
          </div>
        )}

        {/* Message List */}
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}

        {/* Typing indicator would go here */}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area */}
      <div className="p-4 border-t border-[hsl(var(--surface-light))]">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <button 
            type="button" 
            onClick={handleFileSelect}
            disabled={!isConnected}
            className={`p-2 ${isConnected ? 'text-[hsl(var(--text-secondary))] hover:text-primary' : 'text-[hsl(var(--text-secondary))]/50 cursor-not-allowed'} flex-shrink-0`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <div className="relative flex-1">
            <Textarea
              value={messageText}
              onChange={handleTextareaChange}
              disabled={!isConnected}
              rows={1}
              placeholder={isConnected ? "Type a message..." : "Connect to start chatting..."}
              className="w-full px-4 py-3 bg-[hsl(var(--surface-light))] border border-[hsl(var(--surface-light))] focus:border-primary rounded-lg resize-none focus:outline-none min-h-[3rem] max-h-[150px]"
            />
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden"
              accept="image/*,audio/*,video/*,application/*"
              onChange={handleFileChange}
            />
          </div>
          <Button
            type="submit"
            disabled={!isConnected || !messageText.trim()}
            className="p-2 rounded-lg flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </form>
      </div>
    </>
  );
};

export default ChatArea;
