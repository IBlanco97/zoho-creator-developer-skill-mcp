import type { PlatformAdapter, UploadResultItem } from "../types.js";

export const nalandaAdapter: PlatformAdapter = {
  name: "nalanda",
  match: (creds) => /nalanda/i.test(creds.url),
  async upload({ creds, documentos }): Promise<UploadResultItem[]> {
    return documentos.map((d) => ({
      formaEnvioId: creds.formaEnvioId,
      plantillaId: d.ref.plantillaId,
      subirDocumentoId: d.ref.subirDocumentoId,
      status: "skipped",
      message: "nalanda adapter not implemented yet",
    }));
  },
};
