export type DocumentStatus = "uploaded" | "queued" | "processing" | "completed" | "failed";

export interface RagDocument {
  id: string;
  filename: string;
  status: DocumentStatus;
  createdAt: string;
}

export interface DocumentIndexJob {
  documentId: string;
  filename?: string;
}
