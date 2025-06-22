/**
 * Format a date string or timestamp to a readable format
 */
export function formatDate(date: string | number | Date): string {
  if (!date) return 'Invalid Date';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    // Get current date for comparison
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    // If date is today
    if (dateObj.toDateString() === now.toDateString()) {
      return dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    
    // If date is yesterday
    if (dateObj.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // If date is this year
    if (dateObj.getFullYear() === now.getFullYear()) {
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
    
    // If date is before this year
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a date to show relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  
  // Less than a month
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  // Less than a year
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  
  // More than a year
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

/**
 * Format a date string to a formatted date
 */
export function formatDateString(dateString: string): string {
  const date = new Date(dateString);
  return formatDate(date);
}

/**
 * Format a date string to relative time
 */
export function formatDateStringToRelative(dateString: string): string {
  const date = new Date(dateString);
  return formatRelativeTime(date);
}

/**
 * Format a date to ISO string for API requests
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString();
}

/**
 * Format a timestamp to a human-readable date
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return formatDate(date);
} 