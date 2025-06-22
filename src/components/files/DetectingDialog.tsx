import { For, Show } from 'solid-js';
import Dialog from '../widgets/Dialog';
import Button from '../widgets/Button';

export type DuplicateAction = 'keep-both' | 'overwrite' | 'cancel';

export interface DuplicateDialogProps {
  isOpen: boolean;
  title?: string;
  itemType: 'file' | 'folder';
  itemNames: string[];
  onAction: (action: DuplicateAction) => void;
  onClose: () => void;
}

export default function DuplicateDialog(props: DuplicateDialogProps) {
  const itemTypeText = props.itemType === 'file' ? 'file' : 'folder';
  const itemTypeTextPlural = props.itemType === 'file' ? 'files' : 'folders';
  
  const title = props.title || `Duplicate ${props.itemNames.length > 1 ? itemTypeTextPlural.charAt(0).toUpperCase() + itemTypeTextPlural.slice(1) : itemTypeText.charAt(0).toUpperCase() + itemTypeText.slice(1)}`;
  
  return (
    <Dialog
      title={title}
      isOpen={props.isOpen}
      onClose={props.onClose}
    >
      <div class="p-4">
        <Show
          when={props.itemNames.length > 1}
          fallback={
            <p class="mb-4">
              A {itemTypeText} named "{props.itemNames[0]}" already exists in this location. 
              What would you like to do?
            </p>
          }
        >
          <p class="mb-4">Some {itemTypeTextPlural} already exist in this location:</p>
          <ul class="list-disc list-inside mb-4 max-h-40 overflow-y-auto">
            <For each={props.itemNames}>
              {(name) => <li class="text-text-muted">{name}</li>}
            </For>
          </ul>
        </Show>
        
        <div class="flex flex-col gap-4">
          <div 
            class="flex items-start gap-3 p-3 border border-background-light rounded-md hover:bg-background-light cursor-pointer"
            onClick={() => props.onAction('keep-both')}
          >
            <div class="mt-1 text-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h3 class="font-medium">Keep Both</h3>
              <p class="text-sm text-text-muted">
                {props.itemType === 'file' 
                  ? 'Create new files with unique names' 
                  : 'Create new folders with unique names'}
              </p>
            </div>
          </div>
          
          <div 
            class="flex items-start gap-3 p-3 border border-background-light rounded-md hover:bg-background-light cursor-pointer"
            onClick={() => props.onAction('overwrite')}
          >
            <div class="mt-1 text-warning">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 class="font-medium">Overwrite</h3>
              <p class="text-sm text-text-muted">
                Replace the existing {props.itemNames.length > 1 ? itemTypeTextPlural : itemTypeText}
              </p>
            </div>
          </div>
          
          <div 
            class="flex items-start gap-3 p-3 border border-background-light rounded-md hover:bg-background-light cursor-pointer"
            onClick={() => props.onAction('cancel')}
          >
            <div class="mt-1 text-text-muted">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h3 class="font-medium">Cancel</h3>
              <p class="text-sm text-text-muted">
                Don't {props.itemType === 'file' ? 'upload' : 'create'} anything
              </p>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
} 