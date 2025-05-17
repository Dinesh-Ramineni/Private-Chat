import { ConnectionStatus } from '@/types';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  roomId: string;
  username?: string;
}

const Header = ({ connectionStatus, roomId, username }: HeaderProps) => {
  return (
    <header className="bg-[hsl(var(--surface))] px-4 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h1 className="text-xl font-bold">PrivateConnect</h1>
        {username && (
          <div className="ml-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
            {username}
          </div>
        )}
      </div>
      <div className="flex items-center">
        <span className="text-sm px-3 py-1 rounded-full bg-[hsl(var(--surface-light))] text-[hsl(var(--text-secondary))] flex items-center">
          {connectionStatus === ConnectionStatus.Connected ? (
            <>
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--success))] mr-2" />
              Connected
            </>
          ) : connectionStatus === ConnectionStatus.Connecting ? (
            <>
              <span className="h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
              Connecting
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--error))] mr-2 animate-pulse" />
              Disconnected
            </>
          )}
        </span>
      </div>
    </header>
  );
};

export default Header;
