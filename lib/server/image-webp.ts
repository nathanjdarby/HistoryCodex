import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

export const WEBP_QUALITY = 85;

export function isWebpFilename(filename: string) {
  return path.extname(filename).toLowerCase() === ".webp";
}

export function webpFilenameFrom(originalFilename: string) {
  const base = path.basename(originalFilename, path.extname(originalFilename));
  return `${base}.webp`;
}

export async function bufferToWebp(buffer: Buffer) {
  return sharp(buffer).webp({ quality: WEBP_QUALITY }).toBuffer();
}

export async function convertFileToWebp(sourcePath: string, destinationPath: string) {
  await sharp(sourcePath).webp({ quality: WEBP_QUALITY }).toFile(destinationPath);
  return fs.statSync(destinationPath).size;
}
