import { getFileStream } from "@gad/storage";
import { Readable } from "stream";

export async function readZipAsBuffer(key: string): Promise<Buffer> {
  const stream = (await getFileStream(key)) as Readable;

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}
