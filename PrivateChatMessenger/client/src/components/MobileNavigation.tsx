import { View } from '@/types';

interface MobileNavigationProps {
  activeView: View;
  setActiveView: (view: View) => void;
  callActive: boolean;
}

const MobileNavigation = ({
  activeView,
  setActiveView,
  callActive,
}: MobileNavigationProps) => {
  return (
    <nav className="md:hidden flex bg-[hsl(var(--surface))] border-t border-[hsl(var(--surface-light))]">
      <button 
        onClick={() => setActiveView('connection')}
        className={`flex-1 flex flex-col items-center py-3 ${activeView === 'connection' ? 'text-primary' : 'text-[hsl(var(--text-secondary))]'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-xs mt-1">Connect</span>
      </button>
      
      <button 
        onClick={() => setActiveView('chat')}
        className={`flex-1 flex flex-col items-center py-3 ${activeView === 'chat' ? 'text-primary' : 'text-[hsl(var(--text-secondary))]'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="text-xs mt-1">Chat</span>
      </button>
      
      {callActive && (
        <button 
          onClick={() => setActiveView('call')}
          className={`flex-1 flex flex-col items-center py-3 ${activeView === 'call' ? 'text-primary' : 'text-[hsl(var(--text-secondary))]'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="text-xs mt-1">Call</span>
        </button>
      )}
    </nav>
  );
};

export default MobileNavigation;
