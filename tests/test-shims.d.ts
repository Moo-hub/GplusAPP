declare module '*websocket.service' {
  interface IWebsocketShim {
    on: (type: string, callback: (payload?: any) => void) => (() => void) | void;
    off?: (type: string, callback?: (...args: any[]) => void) => void;
    connect?: () => void;
    disconnect?: () => void;
    emitToTest?: (type: string, payload?: any) => void;
    getUnreadCountForTest?: () => number;
    _unreadCount?: number;
  }

  const websocketService: IWebsocketShim;
  export default websocketService;
  export function resetWebsocketShim(): void;
}

declare module '*test-shims/websocket.service' {
  interface IWebsocketShimLocal {
    on: (type: string, callback: (payload?: any) => void) => (() => void) | void;
    off?: (type: string, callback?: (...args: any[]) => void) => void;
    connect?: () => void;
    disconnect?: () => void;
    emitToTest?: (type: string, payload?: any) => void;
    getUnreadCountForTest?: () => number;
    _unreadCount?: number;
  }

  const websocketService: IWebsocketShimLocal;
  export default websocketService;
  export function resetWebsocketShim(): void;
}
