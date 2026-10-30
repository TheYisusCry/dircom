import "server-only";
import sharp from "sharp";
import { MAX_AVATAR_BYTES } from "./validation";
export const AVATAR_BUCKET = "dircom-avatars";
export async function normalizeAvatar(file: File | null) {
  if (!file || file.size === 0) return null;
  if (
    file.size > MAX_AVATAR_BYTES ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    throw new Error(
      "La fotografía debe ser JPEG, PNG o WebP y pesar hasta 3 MB.",
    );
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 20_000_000,
      animated: false,
    });
    const metadata = await image.metadata();
    if (
      !["jpeg", "png", "webp"].includes(metadata.format ?? "") ||
      (metadata.pages ?? 1) > 1
    )
      throw new Error("Invalid image");
    return await image
      .rotate()
      .resize(600, 600, { fit: "cover", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new Error(
      "No se pudo leer la fotografía. Usa una imagen JPEG, PNG o WebP válida.",
    );
  }
}
