import type { PlatformAdapter } from "../types.js";

export const genericEmailFallback: PlatformAdapter = {
  name: "generic",
  match: () => true,
  async upload({ creds, documentos }) {
    return documentos.map((d) => ({
      formaEnvioId: creds.formaEnvioId,
      plantillaId: d.ref.plantillaId,
      subirDocumentoId: d.ref.subirDocumentoId,
      status: "skipped",
      message: `No adapter for host ${safeHost(creds.url)} — manual upload required`,
    }));
  },
};

function safeHost(u: string): string {
  try { return new URL(u).host; } catch { return u; }
}
