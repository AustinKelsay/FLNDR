/**
 * Cross-platform WebSocket type definitions for FLNDR
 * 
 * This file provides TypeScript definitions that work for both:
 * 1. Browser WebSocket API
 * 2. Node.js 'ws' package
 * 
 * The definitions here merge both APIs into a single compatible interface
 * that can be used interchangeably across platforms.
 * 
 * In browsers, the global WebSocket object is used
 * In Node.js, the 'ws' package is imported dynamically
 */

declare module 'ws' {
  // Event interfaces to match browser WebSocket API
  interface WebSocketEventMap {
    close: CloseEvent;
    error: Event;
    message: MessageEvent;
    open: Event;
  }

  interface CloseEvent {
    code: number;
    reason: string;
    wasClean: boolean;
  }

  interface MessageEvent {
    data: any;
    type: string;
    target: EventTarget;
  }

  /**
   * WebSocket class definition that merges browser WebSocket API with Node.js ws package
   * - Includes properties and methods from standard WebSocket API
   * - Adds Node.js ws-specific methods like 'on', 'off', and 'once'
   */
  class WebSocket extends EventTarget {
    // Static constants for readyState (same values in both environments)
    static readonly CONNECTING: number;
    static readonly OPEN: number;
    static readonly CLOSING: number;
    static readonly CLOSED: number;

    // Common properties
    readonly readyState: number;
    readonly url: string;

    // Extended constructor to support both browser and Node.js options
    constructor(url: string, protocols?: string | string[] | { headers: Record<string, string> });

    // Common methods
    close(code?: number, reason?: string): void;
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
    
    // Browser-style event listeners
    addEventListener<K extends keyof WebSocketEventMap>(
      type: K, 
      listener: (event: WebSocketEventMap[K]) => void, 
      options?: boolean | AddEventListenerOptions
    ): void;
    
    addEventListener(
      type: string, 
      listener: EventListenerOrEventListenerObject, 
      options?: boolean | AddEventListenerOptions
    ): void;
    
    removeEventListener<K extends keyof WebSocketEventMap>(
      type: K, 
      listener: (event: WebSocketEventMap[K]) => void, 
      options?: boolean | EventListenerOptions
    ): void;
    
    removeEventListener(
      type: string, 
      listener: EventListenerOrEventListenerObject, 
      options?: boolean | EventListenerOptions
    ): void;

    // Node.js ws-style event methods
    on(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
  }

  export = WebSocket;
} 