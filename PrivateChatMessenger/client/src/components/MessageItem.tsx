import { Message } from '@/types';
import { formatTime, formatFileSize } from '@/lib/helpers';

interface MessageItemProps {
  message: Message;
}

const MessageItem = ({ message }: MessageItemProps) => {
  const isSelf = message.sender === 'self';
  
  if (message.type === 'text') {
    return (
      <div className={`flex items-end gap-2 ${isSelf ? 'flex-row-reverse text-right' : 'text-left'}`}>
        <div className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden flex-shrink-0">
          <img 
            src={isSelf 
              ? "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100" 
              : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100"
            } 
            alt={`${isSelf ? 'Your' : 'Contact'} avatar`} 
            className="w-full h-full object-cover" 
          />
        </div>
        <div className={`max-w-[75%] ${isSelf 
          ? 'bg-primary rounded-t-lg rounded-bl-lg' 
          : 'bg-[hsl(var(--surface-light))] rounded-t-lg rounded-br-lg'} px-4 py-2 shadow-sm`}
        >
          <p>{message.content}</p>
          <div className={`text-xs ${isSelf ? 'text-white/70' : 'text-[hsl(var(--text-secondary))]'} mt-1`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    );
  }
  
  if (message.type === 'image') {
    return (
      <div className={`flex items-end gap-2 ${isSelf ? 'flex-row-reverse text-right' : 'text-left'}`}>
        <div className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden flex-shrink-0">
          <img 
            src={isSelf 
              ? "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100" 
              : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100"
            } 
            alt={`${isSelf ? 'Your' : 'Contact'} avatar`} 
            className="w-full h-full object-cover" 
          />
        </div>
        <div className={`max-w-[75%] ${isSelf 
          ? 'bg-primary rounded-t-lg rounded-bl-lg' 
          : 'bg-[hsl(var(--surface-light))] rounded-t-lg rounded-br-lg'} px-4 py-2 shadow-sm`}
        >
          <img 
            src={message.content} 
            alt="Shared image" 
            className="w-full h-auto rounded-md" 
          />
          <div className={`text-xs ${isSelf ? 'text-white/70' : 'text-[hsl(var(--text-secondary))]'} mt-1`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    );
  }
  
  // File message (non-image)
  return (
    <div className={`flex items-end gap-2 ${isSelf ? 'flex-row-reverse text-right' : 'text-left'}`}>
      <div className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden flex-shrink-0">
        <img 
          src={isSelf 
            ? "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100" 
            : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100"
          } 
          alt={`${isSelf ? 'Your' : 'Contact'} avatar`} 
          className="w-full h-full object-cover" 
        />
      </div>
      <div className={`max-w-[75%] ${isSelf 
        ? 'bg-primary rounded-t-lg rounded-bl-lg' 
        : 'bg-[hsl(var(--surface-light))] rounded-t-lg rounded-br-lg'} px-4 py-2 shadow-sm`}
      >
        <div className={`flex items-center p-2 ${isSelf ? 'bg-[hsl(var(--surface-light))]/20' : 'bg-background'} rounded-md`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${isSelf ? 'text-white' : 'text-primary'} mr-2`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-left">
            <div className="text-sm font-medium">{message.fileName}</div>
            <div className={`text-xs ${isSelf ? 'text-white/70' : 'text-[hsl(var(--text-secondary))]'}`}>
              {message.fileSize && formatFileSize(message.fileSize)} · {message.fileType || 'File'}
            </div>
          </div>
        </div>
        <div className={`text-xs ${isSelf ? 'text-white/70' : 'text-[hsl(var(--text-secondary))]'} mt-1`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
