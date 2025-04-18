/**
 * A minimal EventEmitter implementation that works in both Node.js and browsers
 * Compatible with the Node.js EventEmitter API we use in our client
 */
class EventEmitter {
  private events: Record<string | symbol, Array<(...args: any[]) => void>> = {};

  /**
   * Register an event listener
   * @param event Event name
   * @param listener Callback function
   */
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  /**
   * Remove an event listener
   * @param event Event name
   * @param listener Callback function to remove
   */
  off(event: string | symbol, listener: (...args: any[]) => void): this {
    if (!this.events[event]) {
      return this;
    }

    const idx = this.events[event].indexOf(listener);
    if (idx !== -1) {
      this.events[event].splice(idx, 1);
    }
    return this;
  }

  /**
   * Register a one-time event listener
   * @param event Event name
   * @param listener Callback function
   */
  once(event: string | symbol, listener: (...args: any[]) => void): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    return this.on(event, onceWrapper);
  }

  /**
   * Emit an event
   * @param event Event name
   * @param args Arguments to pass to listeners
   */
  emit(event: string | symbol, ...args: any[]): boolean {
    if (!this.events[event]) {
      return false;
    }

    // Create a copy of the listeners array to avoid issues if listeners are added/removed during emit
    const listeners = [...this.events[event]];
    for (const listener of listeners) {
      listener(...args);
    }
    return true;
  }

  /**
   * Remove all listeners for an event
   * @param event Event name (optional, if not provided removes all listeners)
   */
  removeAllListeners(event?: string | symbol): this {
    if (event) {
      this.events[event] = [];
    } else {
      this.events = {};
    }
    return this;
  }

  /**
   * Get all listeners for an event
   * @param event Event name
   */
  listeners(event: string | symbol): Array<(...args: any[]) => void> {
    return this.events[event] || [];
  }
}

export default EventEmitter; 