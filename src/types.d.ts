// Fix for @antfu/utils PInstance.then error
declare module '@antfu/utils' {
  export type Awaitable<T> = T | Promise<T>;
  
  interface PInstance<T> extends Promise<Awaited<T>[]> {
    then<TResult1 = Awaited<T>[], TResult2 = never>(
      onfulfilled?: ((value: Awaited<T>[]) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
    ): Promise<TResult1 | TResult2>;
  }
}

// Fix for unconfig Args error
declare module 'unconfig' {
  export interface LoadConfigResult<T> {
    config: T;
    sources: string[];
  }
  
  namespace quansync_types {
    interface Args {
      0: boolean;
    }
    
    interface QuansyncFn<T, A extends any[]> {
      (...args: A): Promise<T>;
      sync(...args: A): T;
    }
  }
} 