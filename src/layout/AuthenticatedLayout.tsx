import { createSignal, Show, JSX } from 'solid-js';
import { useLocation, A } from '@solidjs/router';
import { useTheme } from '../components/hooks/auth/useTheme';
import { useCurrentUser } from '../components/hooks/auth/useCurrentUser';

export default function AuthenticatedLayout(props: { children?: JSX.Element }) {
  const location = useLocation();

  const { user } = useCurrentUser();
  const { theme } = useTheme();

  const [isSidebarOpen, setIsSidebarOpen] = createSignal(false);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen());
  };

  return (
    <div class={`min-h-screen flex flex-col ${theme() === 'neon' ? 'neon-theme' : 'theme-dark'}`}>
      {/* Header */}
      <header class={`py-3 px-4 flex justify-between items-center shadow-md z-10 ${theme() === 'neon' ? 'bg-background-darkest border-b border-primary/20' : 'bg-background-darkest'}`}>
        <div class="flex items-center">
          <button 
            onClick={toggleSidebar} 
            class="mr-4 text-text-muted hover:text-text md:hidden"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <A href="/drive" class="flex items-center gap-2">
            <svg class="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
            </svg>
            <h1 class="text-xl font-bold text-text">Cloudy</h1>
          </A>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="hidden md:flex items-center gap-4">
            <A 
              href="/drive" 
              class={`text-sm ${location.pathname.startsWith('/drive') ? 'text-primary' : 'text-text-muted hover:text-text'}`}
            >
              Drive
            </A>
            <A 
              href="/bin" 
              class={`text-sm ${location.pathname === '/bin' ? 'text-primary' : 'text-text-muted hover:text-text'}`}
            >
              Bin
            </A>
            <A 
              href="/storage" 
              class={`text-sm ${location.pathname === '/storage' ? 'text-primary' : 'text-text-muted hover:text-text'}`}
            >
              Storage
            </A>
          </div>
          
          <div class="relative">
            <A href="/settings" class="flex items-center gap-2 text-text-muted hover:text-text">
              <span class="hidden md:inline text-sm">{user()?.email || 'User'}</span>
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </A>
          </div>
        </div>
      </header>
      
      {/* Sidebar and Main Content */}
      <div class="flex flex-1 relative">
        {/* Sidebar for authenticated users */}
        <aside 
          class={`
            w-64 shadow-lg flex-shrink-0 
            md:block fixed md:static h-full z-20 transition-transform duration-300
            ${isSidebarOpen() ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${theme() === 'neon' ? 'bg-background-darker border-r border-primary/20' : 'bg-background-darker'}
          `}
        >
          <div class="p-4 space-y-6">
            <div class="space-y-2">
              <h3 class="text-xs uppercase text-text-muted tracking-wider">VAULT</h3>
              <nav class="space-y-1">
                <A 
                  href="/drive" 
                  class={`flex items-center gap-2 p-2 rounded-md ${location.pathname.startsWith('/drive') ? 'bg-background text-primary' : 'text-text-muted hover:text-text hover:bg-background'}`}
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Drive
                </A>
                <A 
                  href="/bin" 
                  class={`flex items-center gap-2 p-2 rounded-md ${location.pathname === '/bin' ? 'bg-background text-primary' : 'text-text-muted hover:text-text hover:bg-background'}`}
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Bin
                </A>
              </nav>
            </div>
            
            <div class="space-y-2">
              <h3 class="text-xs uppercase text-text-muted tracking-wider">ACCOUNT</h3>
              <nav class="space-y-1">
                <A 
                  href="/storage" 
                  class={`flex items-center gap-2 p-2 rounded-md ${location.pathname === '/storage' ? 'bg-background text-primary' : 'text-text-muted hover:text-text hover:bg-background'}`}
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Storage
                </A>
                <A 
                  href="/settings" 
                  class={`flex items-center gap-2 p-2 rounded-md ${location.pathname === '/settings' ? 'bg-background text-primary' : 'text-text-muted hover:text-text hover:bg-background'}`}
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </A>
              </nav>
            </div>
          </div>
        </aside>
        
        {/* Overlay for sidebar in vertical screen */}
        <Show when={isSidebarOpen()}>
          <div 
            class="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        </Show>
        
        {/* Main Content */}
        <main class="flex-1 overflow-auto">

            {props.children}

        </main>
      </div>
    </div>
  );
} 