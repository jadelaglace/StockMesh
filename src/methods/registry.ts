import type { MethodDefinition } from "./types.js";

export class MethodRegistry {
  private readonly methods = new Map<string, MethodDefinition<unknown, unknown>>();

  register<Configuration, Output>(definition: MethodDefinition<Configuration, Output>): void {
    const key = this.key(definition.id, definition.version);
    if (this.methods.has(key)) throw new Error(`Method already registered: ${key}`);
    this.methods.set(key, definition as MethodDefinition<unknown, unknown>);
  }

  get(methodId: string, version?: string): MethodDefinition<unknown, unknown> {
    if (version) {
      const found = this.methods.get(this.key(methodId, version));
      if (!found) throw new Error(`Method not registered: ${methodId}@${version}`);
      return found;
    }
    const candidates = [...this.methods.values()]
      .filter((method) => method.id === methodId)
      .sort((left, right) => right.version.localeCompare(left.version, undefined, { numeric: true }));
    const latest = candidates[0];
    if (!latest) throw new Error(`Method not registered: ${methodId}`);
    return latest;
  }

  list(): MethodDefinition<unknown, unknown>[] {
    return [...this.methods.values()].sort((left, right) => `${left.id}@${left.version}`.localeCompare(`${right.id}@${right.version}`));
  }

  private key(methodId: string, version: string): string {
    return `${methodId}@${version}`;
  }
}
