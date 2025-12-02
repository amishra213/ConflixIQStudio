import { useState } from 'react';
import { SearchIcon, BellIcon, UserIcon, ServerIcon } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils'; // Import cn from utils

export default function HeaderBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const notificationCount = 3;
  const conductorSettings = useSettingsStore((state) => state.conductorSettings);

  const getConnectionColor = () => {
    return conductorSettings.isConnected ? 'bg-success' : 'bg-muted';
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 lg:h-20 lg:px-12">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <SearchIcon
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            type="search"
            placeholder="SearchIcon workflows, tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background pl-10 text-foreground placeholder:text-muted-foreground border-border focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={cn('h-2 w-2 rounded-full', getConnectionColor())} />
          <ServerIcon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <span className="hidden text-sm text-muted-foreground lg:inline">
            {conductorSettings.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Notifications"
          title="Notifications"
        >
          <BellIcon className="h-5 w-5" strokeWidth={1.5} />
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs bg-tertiary text-tertiary-foreground"
            >
              {notificationCount}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="inline-flex items-center justify-center rounded-full h-9 w-9 bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="User menu"
              title="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <UserIcon className="h-4 w-4" strokeWidth={1.5} />
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-popover text-popover-foreground border-border"
          >
            <DropdownMenuLabel className="text-foreground">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
