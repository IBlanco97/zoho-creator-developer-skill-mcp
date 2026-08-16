import type { PlatformAdapter, UploadResultItem } from "../types.js";

export const dokifyAdapter: PlatformAdapter = {
  name: "dokify",
  match: (creds) => /dokify/i.test(creds.url),
  async upload({ creds, documentos }): Promise<UploadResultItem[]> {
    return documentos.map((d) => ({
      formaEnvioId: creds.formaEnvioId,
      plantillaId: d.ref.plantillaId,
      subirDocumentoId: d.ref.subirDocumentoId,
      status: "skipped",
      message: "dokify adapter not implemented yet",
    }));
  },
};
