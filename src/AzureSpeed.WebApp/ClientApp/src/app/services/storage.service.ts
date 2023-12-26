import { Injectable } from '@angular/core'
import { BlobServiceClient } from '@azure/storage-blob'
import { BlobModel } from '../models'

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  createBlobServiceClient(blob: BlobModel) {
    const SASConnectionString = `BlobEndpoint=${blob.endpoint};SharedAccessSignature=${blob.sas}`
    return BlobServiceClient.fromConnectionString(SASConnectionString)
  }
}
