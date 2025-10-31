declare global {
  interface Window {
    errorReporter?: {
      captureException: (error: any) => void;
    };
  }
}

declare module '*.json' {
  const content: any;
  export default content;
}

declare module './locales/*.json' {
  const content: any;
  export default content;
}

declare module '../locales/*.json' {
  const content: any;
  export default content;
}

export {};
