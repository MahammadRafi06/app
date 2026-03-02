// Extension system for FluxBoard

export type ExtensionType =
  | "resource-tab"
  | "system-level"
  | "app-view"
  | "status-panel"
  | "top-bar-action";

export interface Extension {
  name: string;
  type: ExtensionType;
  component?: React.ComponentType<Record<string, unknown>>;
  label?: string;
  icon?: string;
  path?: string;
}

class ExtensionRegistry {
  private extensions: Extension[] = [];

  register(extension: Extension) {
    this.extensions.push(extension);
  }

  getExtensions(type: ExtensionType): Extension[] {
    return this.extensions.filter((e) => e.type === type);
  }

  getAll(): Extension[] {
    return [...this.extensions];
  }

  clear() {
    this.extensions = [];
  }
}

export const extensionRegistry = new ExtensionRegistry();

// Expose to external scripts
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).extensionsAPI = {
    register: (ext: Extension) => extensionRegistry.register(ext),
    getExtensions: (type: ExtensionType) => extensionRegistry.getExtensions(type),
  };
}
