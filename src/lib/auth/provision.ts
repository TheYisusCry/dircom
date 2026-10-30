/** Testable compensation flow. Identity + profile are created atomically by the SQL trigger. */
export interface ProvisionPorts {
  createIdentity(): Promise<string>;
  attachAvatar(id: string): Promise<void>;
  rollbackIdentity(id: string): Promise<void>;
  quarantineIdentity(id: string): Promise<void>;
}
export class ProvisionFailure extends Error {
  readonly cleanupFailed: boolean;
  constructor(cleanupFailed: boolean) {
    super(
      cleanupFailed
        ? "No se completó el alta. Revisa la cuenta desactivada en el panel antes de reintentar."
        : "No se completó el alta. No se conservó una cuenta parcial.",
    );
    this.cleanupFailed = cleanupFailed;
  }
}
export async function provisionAccount(ports: ProvisionPorts) {
  const id = await ports.createIdentity();
  try {
    await ports.attachAvatar(id);
    return id;
  } catch {
    try {
      await ports.rollbackIdentity(id);
    } catch {
      await ports.quarantineIdentity(id);
      throw new ProvisionFailure(true);
    }
    throw new ProvisionFailure(false);
  }
}
