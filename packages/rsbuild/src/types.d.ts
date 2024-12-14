export type PluginWebExtOptions<T = object> = {
  manifest?: T;
  srcDir?: string;
  target?: BrowserTarget;
};

