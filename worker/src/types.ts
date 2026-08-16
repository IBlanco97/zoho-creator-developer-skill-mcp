export type Scope = "trabajador" | "empresa" | "autonomo";

export interface PlatformCredentials {
  formaEnvioId: string;
  url: string;
  usuario: string;
  password: string;
  mailEnvio?: string;
  /** ID del cliente en la plataforma destino (UCAE: idprincipal, Dokify: client_id, etc.). */
  remoteClientId?: string;
}

export interface DocumentRef {
  plantillaId: string;
  plantillaNombre: string;
  scope: Scope;
  trabajadorId?: string;
  trabajadorDni?: string;
  empresaId?: string;
  subirDocumentoId: string;
  fileFieldName: string;
  fileReportName: string;
  fechaCaducidad?: string;
  numeroDocumento?: string;
  /** Código del documento en la plataforma destino (UCAE: Codigo_UCAE, Dokify: reqtype_id). */
  remoteCodigo?: string;
  /** UCAE only: marcar este doc para subida bulk al endpoint /empresa/contrata/documentacion/upload (autoclasifica ITA/RNT/IDC). */
  bulkSsUcae?: boolean;
}

export interface UploadJobInput {
  clienteId: string;
  clienteNombre: string;
  formasEnvio: PlatformCredentials[];
  documentos: DocumentRef[];
}

export interface UploadResultItem {
  formaEnvioId: string;
  plantillaId: string;
  subirDocumentoId: string;
  status: "ok" | "fail" | "skipped";
  remoteId?: string;
  message?: string;
}

export type JobStatus = "queued" | "running" | "done" | "failed";

export interface Job {
  id: string;
  input: UploadJobInput;
  status: JobStatus;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  results: UploadResultItem[];
  error?: string;
}

export interface PlatformAdapter {
  name: string;
  match(creds: PlatformCredentials): boolean;
  upload(args: {
    creds: PlatformCredentials;
    documentos: { ref: DocumentRef; localPath: string; mime: string }[];
  }): Promise<UploadResultItem[]>;
}
