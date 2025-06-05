import { createSignal } from 'solid-js';

/**
 * ThemeGuide component to display available theme classes from Theme.css
 * This component can be used for development and documentation purposes
 */
export default function ThemeGuide() {
  const [activeTab, setActiveTab] = createSignal('buttons');

  return (
    <div class="p-6 bg-background-darker rounded-lg">
      <h2 class="text-2xl font-bold mb-6">Theme Style Guide</h2>
      
      <div class="flex mb-6 gap-2 border-b border-background-light/20 pb-2">
        <button 
          class={`px-4 py-2 rounded-t-md ${activeTab() === 'buttons' ? 'bg-primary text-white' : 'text-text-muted'}`}
          onClick={() => setActiveTab('buttons')}
        >
          Buttons
        </button>
        <button 
          class={`px-4 py-2 rounded-t-md ${activeTab() === 'inputs' ? 'bg-primary text-white' : 'text-text-muted'}`}
          onClick={() => setActiveTab('inputs')}
        >
          Inputs
        </button>
        <button 
          class={`px-4 py-2 rounded-t-md ${activeTab() === 'dialogs' ? 'bg-primary text-white' : 'text-text-muted'}`}
          onClick={() => setActiveTab('dialogs')}
        >
          Dialogs
        </button>
        <button 
          class={`px-4 py-2 rounded-t-md ${activeTab() === 'notifications' ? 'bg-primary text-white' : 'text-text-muted'}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
        <button 
          class={`px-4 py-2 rounded-t-md ${activeTab() === 'files' ? 'bg-primary text-white' : 'text-text-muted'}`}
          onClick={() => setActiveTab('files')}
        >
          Files
        </button>
      </div>
      
      {activeTab() === 'buttons' && (
        <div class="space-y-6">
          <h3 class="text-xl font-semibold mb-4">Button Variants</h3>
          <div class="flex flex-wrap gap-4">
            <button class="btn btn-primary">Primary Button</button>
            <button class="btn btn-secondary">Secondary Button</button>
            <button class="btn btn-danger">Danger Button</button>
            <button class="btn btn-success">Success Button</button>
            <button class="btn btn-ghost">Ghost Button</button>
          </div>
          
          <h3 class="text-xl font-semibold mb-4 mt-8">Button States</h3>
          <div class="flex flex-wrap gap-4">
            <button class="btn btn-primary" disabled>Disabled</button>
            <button class="btn btn-primary">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              With Icon
            </button>
          </div>
        </div>
      )}
      
      {activeTab() === 'inputs' && (
        <div class="space-y-6">
          <h3 class="text-xl font-semibold mb-4">Input Fields</h3>
          <div class="space-y-4 max-w-md">
            <div>
              <label class="block text-sm font-medium text-text mb-1.5">Regular Input</label>
              <input type="text" placeholder="Enter text..." />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-text mb-1.5">With Error</label>
              <input type="text" class="border-danger focus:border-danger focus:ring-danger/50" value="Invalid input" />
              <p class="mt-1.5 text-xs text-danger">This field is required</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-text mb-1.5">With Helper Text</label>
              <input type="text" placeholder="Enter password..." />
              <p class="mt-1.5 text-xs text-text-muted">Password must be at least 8 characters</p>
            </div>
          </div>
        </div>
      )}
      
      {activeTab() === 'dialogs' && (
        <div class="space-y-6">
          <h3 class="text-xl font-semibold mb-4">Dialog Examples</h3>
          <div class="dialog-content max-w-md mx-auto">
            <div class="flex justify-between items-center mb-4 pb-3 border-b border-background-light/20">
              <h3 class="text-lg font-semibold text-text">Dialog Title</h3>
              <button class="text-text-muted hover:text-text focus:outline-none rounded-full hover:bg-background-light/30 p-1.5 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div class="mt-3 mb-6">
              <p>This is an example dialog content. You can put any content here.</p>
            </div>
            
            <div class="mt-6 flex justify-end gap-3 pt-3 border-t border-background-light/20">
              <button class="btn btn-ghost">Cancel</button>
              <button class="btn btn-primary">Confirm</button>
            </div>
          </div>
        </div>
      )}
      
      {activeTab() === 'notifications' && (
        <div class="space-y-6">
          <h3 class="text-xl font-semibold mb-4">Notification Types</h3>
          <div class="space-y-4">
            <div class="notification notification-success">
              <div class="inline-flex items-center justify-center flex-shrink-0 mr-3">
                <svg class="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="text-sm font-normal">
                Success notification example
              </div>
            </div>
            
            <div class="notification notification-error">
              <div class="inline-flex items-center justify-center flex-shrink-0 mr-3">
                <svg class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="text-sm font-normal">
                Error notification example
              </div>
            </div>
            
            <div class="notification notification-warning">
              <div class="inline-flex items-center justify-center flex-shrink-0 mr-3">
                <svg class="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="text-sm font-normal">
                Warning notification example
              </div>
            </div>
            
            <div class="notification notification-info">
              <div class="inline-flex items-center justify-center flex-shrink-0 mr-3">
                <svg class="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="text-sm font-normal">
                Info notification example
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab() === 'files' && (
        <div class="space-y-6">
          <h3 class="text-xl font-semibold mb-4">File Items</h3>
          
          <div class="space-y-2">
            <div class="file-item">
              <div class="file-icon">
                <svg class="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              
              <div class="flex-grow min-w-0">
                <div class="text-sm font-medium truncate">
                  Example Folder
                </div>
                
                <div class="text-xs text-text-muted mt-1 flex space-x-2">
                  <span>--</span>
                  <span>•</span>
                  <span>Jan 1, 2023</span>
                </div>
              </div>
            </div>
            
            <div class="file-item selected">
              <div class="file-icon">
                <svg class="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <div class="flex-grow min-w-0">
                <div class="text-sm font-medium truncate">
                  Selected Document.docx
                </div>
                
                <div class="text-xs text-text-muted mt-1 flex space-x-2">
                  <span>256 KB</span>
                  <span>•</span>
                  <span>Jan 15, 2023</span>
                </div>
              </div>
            </div>
          </div>
          
          <h3 class="text-xl font-semibold mb-4 mt-8">Upload Zone</h3>
          <div class="upload-dropzone">
            <svg class="mx-auto h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p class="mt-2 text-sm text-text-muted">Drag and drop files here, or click to browse</p>
          </div>
          
          <h3 class="text-xl font-semibold mb-4 mt-8">Storage Usage</h3>
          <div class="max-w-md">
            <div class="flex justify-between items-center mb-2">
              <div class="text-sm font-semibold text-text">Storage Usage</div>
              <div class="text-xs font-medium text-text-muted">
                2.5 GB / 10 GB
              </div>
            </div>
            
            <div class="storage-bar">
              <div 
                class="storage-bar-fill bg-gradient-to-r from-green-500 to-green-600"
                style={{ width: '25%' }}
              />
            </div>
            
            <div class="flex justify-between items-center mt-2">
              <div class="text-xs font-medium text-text-muted">
                25% used
              </div>
              <div class="text-xs font-medium text-text-muted">
                7.5 GB free
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 