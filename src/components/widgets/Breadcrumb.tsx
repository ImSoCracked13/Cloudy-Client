import { For, Show } from 'solid-js';

export interface BreadcrumbItem {
  id: string;
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  class?: string;
  separator?: string;
  maxItems?: number;
  onNavigate?: (path: string) => void;
}

export default function Breadcrumb(props: BreadcrumbProps) {
  const separator = props.separator || '/';
  const maxItems = props.maxItems || 0;
  
  const visibleItems = () => {
    const items = [...props.items];
    
    // If maxItems is set and we have more items than maxItems,
    // show first item, ellipsis, and last (maxItems - 2) items
    if (maxItems > 0 && items.length > maxItems) {
      const firstItem = items[0];
      const lastItems = items.slice(-(maxItems - 1));
      return [firstItem, { id: 'ellipsis', label: '...' }, ...lastItems];
    }
    
    return items;
  };

  const handleClick = (item: BreadcrumbItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (props.onNavigate) {
      props.onNavigate(item.id);
    }
  };
  
  return (
    <nav aria-label="Breadcrumb" class={`flex items-center ${props.class || ''}`}>
      <ol class="flex items-center flex-wrap">
        <For each={visibleItems()}>
          {(item, index) => (
            <>
              <li class="flex items-center">
                <Show
                  when={(item.onClick || props.onNavigate) && item.id !== 'ellipsis'}
                  fallback={
                    <span 
                      class={`
                        text-sm
                        ${index() === visibleItems().length - 1 
                          ? 'font-medium text-text' 
                          : 'text-text-muted hover:text-text-muted'}
                      `}
                      aria-current={index() === visibleItems().length - 1 ? 'page' : undefined}
                    >
                      {item.label}
                    </span>
                  }
                >
                  <button
                    onClick={() => handleClick(item)}
                    class={`
                      text-sm text-text-link hover:text-text-link-hover transition-colors
                      hover:underline focus:outline-none focus:underline
                    `}
                  >
                    {item.label}
                  </button>
                </Show>
              </li>
              
              {/* Separator */}
              {index() < visibleItems().length - 1 && (
                <li class="mx-2 text-text-muted">
                  <span aria-hidden="true">{separator}</span>
                </li>
              )}
            </>
          )}
        </For>
      </ol>
    </nav>
  );
} 