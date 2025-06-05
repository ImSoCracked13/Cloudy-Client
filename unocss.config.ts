import { defineConfig, presetAttributify, presetUno } from 'unocss';
import { presetMini } from '@unocss/preset-mini';
import { presetIcons } from '@unocss/preset-icons';
import { presetWebFonts } from '@unocss/preset-web-fonts';

export default defineConfig({
  presets: [
    presetMini(),
    presetAttributify(),
    presetUno(),
    presetWebFonts({
      fonts: {
        sans: 'Inter:400,500,600,700',
        mono: 'JetBrains Mono:400,500',
      },
    }),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  theme: {
    colors: {
      // Discord-like dark theme colors
      primary: {
        DEFAULT: '#5865F2', // Discord blurple
        hover: '#4752c4',
        light: '#7983f5',
        dark: '#3c45a5',
      },
      secondary: {
        DEFAULT: '#4f545c',
        hover: '#686d78',
      },
      danger: {
        DEFAULT: '#ED4245', // Discord red
        hover: '#c23235',
      },
      success: {
        DEFAULT: '#3BA55C', // Discord green
        hover: '#2d8045',
      },
      warning: {
        DEFAULT: '#FAA61A', // Discord yellow/orange
        hover: '#d48a0f',
      },
      background: {
        DEFAULT: '#313338', // Main background
        darker: '#2B2D31', // Sidebar background
        darkest: '#1E1F22', // Server list background
        light: '#383A40', // Input background
      },
      text: {
        DEFAULT: '#DCDDDE', // Primary text
        muted: '#96989D', // Secondary text
        link: '#00AFF4', // Link color
      },
      input: {
        bg: '#1E1F22',
        border: '#222327',
        placeholder: '#72767D',
      },
      modal: {
        bg: '#313338',
        overlay: 'rgba(0, 0, 0, 0.7)',
      }
    },
    fontFamily: {
      sans: 'Inter, gg sans, Noto Sans, Helvetica Neue, Helvetica, Arial, sans-serif',
      mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    borderRadius: {
      sm: '3px',
      DEFAULT: '4px',
      md: '8px',
      lg: '16px',
    },
    boxShadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      DEFAULT: '0 2px 10px 0 rgba(0, 0, 0, 0.2)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 8px 16px rgba(0, 0, 0, 0.24)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      none: 'none',
    },
  },
  // Define keyframes separately
  preflights: [
    {
      getCSS: () => `
        @keyframes dialog-enter {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes dialog-leave {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.95); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slide-out-right {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes slide-in-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slide-out-down {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100%); opacity: 0; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        :root {
          color-scheme: dark;
          
          /* CSS Variables for Theme */
          --color-primary: #5865F2;
          --color-primary-hover: #4752C4;
          --color-secondary: #4f545c;
          --color-secondary-hover: #686d78;
          --color-background: #313338;
          --color-background-darker: #2B2D31;
          --color-background-darkest: #1E1F22;
          --color-background-light: #383A40;
          --color-text: #DCDDDE;
          --color-text-muted: #96989D;
          --color-text-link: #00AFF4;
          --color-success: #3BA55C;
          --color-danger: #ED4245;
          --color-warning: #FAA61A;
        }
        
        html, body {
          background-color: var(--color-background);
          color: var(--color-text);
          font-family: Inter, 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        
        /* Custom scrollbar for webkit browsers */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: var(--color-background-light);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: var(--color-secondary);
        }
        
        /* Focus outline styles */
        :focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
      `
    }
  ],
  shortcuts: {
    // Common UI components
    'btn': 'py-2 px-4 rounded font-medium focus:outline-none transition-colors duration-200',
    'btn-primary': 'bg-primary text-white hover:bg-primary-hover',
    'btn-secondary': 'bg-secondary text-white hover:bg-secondary-hover',
    'btn-danger': 'bg-danger text-white hover:opacity-90',
    'btn-success': 'bg-success text-white hover:bg-success-hover',
    'btn-ghost': 'bg-transparent hover:bg-background-light/30 text-text-muted hover:text-text',
    'btn-link': 'bg-transparent text-text-link hover:underline p-0',
    'input-field': 'bg-input-bg text-text border border-input-border rounded p-2 w-full focus:outline-none focus:border-primary',
    'card': 'bg-background-darker rounded-md p-4 shadow',
    'modal': 'bg-modal-bg rounded-md shadow-lg p-6',
    'nav-link': 'text-text-muted hover:text-text transition-colors duration-200',
    'icon-btn': 'flex items-center justify-center rounded-full p-2 hover:bg-background-light transition-colors duration-200',
    
    // Discord-specific components
    'discord-menu-item': 'w-full text-left px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-background flex items-center gap-2 transition-colors rounded',
    'discord-divider': 'border-t border-background-light my-1',
    'discord-container': 'bg-background-darker rounded-md border border-background-light/20 shadow-md',
    'discord-scrollbar': 'scrollbar-thin scrollbar-thumb-background-light scrollbar-track-transparent',
    'discord-hover': 'hover:bg-background-light/30 transition-colors duration-150',
    'discord-selected': 'bg-primary/20 text-primary',
    'discord-card': 'bg-background-darker rounded-md border border-background-light/10',
    'discord-input': 'bg-input-bg text-text border border-input-border rounded-md p-2 w-full focus:outline-none focus:border-primary/50 transition-colors',
    'discord-sidebar-item': 'flex items-center gap-2 p-2 rounded-md text-text-muted hover:text-text hover:bg-background-light/30 transition-colors',
    'discord-tooltip': 'bg-background-darkest text-text text-xs py-1 px-2 rounded shadow-lg',
    'discord-focus-ring': 'ring-2 ring-primary/50 ring-offset-1 ring-offset-background-darker',
  },
  rules: [
    // Custom rules for improved contrast and visibility
    ['text-high-contrast', { color: '#FFFFFF' }],
    ['bg-interactive-hover', { 'background-color': 'rgba(79, 84, 92, 0.32)' }],
    ['bg-mentioned', { 'background-color': 'rgba(250, 166, 26, 0.1)' }],
    ['border-mentioned', { 'border-left': '2px solid #FAA61A' }],
    
    // Custom animations
    ['animate-dialog-enter', { animation: 'dialog-enter 0.2s ease-out' }],
    ['animate-dialog-leave', { animation: 'dialog-leave 0.15s ease-in forwards' }],
    ['animate-fade-in', { animation: 'fade-in 0.2s ease-out' }],
    ['animate-fade-out', { animation: 'fade-out 0.15s ease-in forwards' }],
    ['animate-slide-in-right', { animation: 'slide-in-right 0.2s ease-out' }],
    ['animate-slide-out-right', { animation: 'slide-out-right 0.15s ease-in forwards' }],
    ['animate-slide-in-up', { animation: 'slide-in-up 0.2s ease-out' }],
    ['animate-slide-out-down', { animation: 'slide-out-down 0.15s ease-in forwards' }],
    ['animate-pulse', { animation: 'pulse 2s ease-in-out infinite' }],
    ['animate-bounce-subtle', { animation: 'bounce-subtle 1s ease-in-out infinite' }],
  ],
});
