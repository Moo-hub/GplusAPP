declare module '../../services/websocket.service' {
  interface IWebsocketShim {
    ws: any;
    _unreadCount?: number;
    connect: () => void;
    on: (type: string, cb: (data?: any) => void) => () => void;
    off?: (type: string) => void;
    emitToTest?: (type: string, payload?: any) => void;
    getUnreadCountForTest?: () => number;
    resetWebsocketShim?: () => void;
  }

  const websocketService: IWebsocketShim;
  export default websocketService;
  export const websocketServiceExport: IWebsocketShim;
  export function resetWebsocketShim(): void;
}

declare module '../../test-shims/websocket.service' {
  export interface IWebsocketShim {
    ws: any;
    _unreadCount?: number;
    connect: () => void;
    on: (type: string, cb: (data?: any) => void) => () => void;
    off?: (type: string) => void;
    emitToTest?: (type: string, payload?: any) => void;
    getUnreadCountForTest?: () => number;
    resetWebsocketShim?: () => void;
  }

  const websocketService: IWebsocketShim;
  export default websocketService;
  export const websocketServiceExport: IWebsocketShim;
  export function resetWebsocketShim(): void;
}
