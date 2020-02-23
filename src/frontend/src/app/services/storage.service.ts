import { Injectable } from "@angular/core";
import { BlobServiceClient } from "@azure/storage-blob";

@Injectable({
  providedIn: "root"
})
export class StorageService {
  constructor() {}

  createBlobServieClient(sasUrl) {
    const SASConnectionString = `BlobEndpoint=${sasUrl.endpoint};SharedAccessSignature=${sasUrl.sas}`;
    return BlobServiceClient.fromConnectionString(SASConnectionString);
  }
}
