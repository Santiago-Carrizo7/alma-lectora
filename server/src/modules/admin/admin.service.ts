import sharp from 'sharp';
import crypto from 'crypto';
import { supabase } from '../../config/supabase.js';

export class AdminService {
  static async uploadImage(fileBuffer: Buffer): Promise<string> {
    // Procesar el buffer de la imagen con sharp
    const optimizedBuffer = await sharp(fileBuffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Nombre único para el archivo WebP
    const fileName = `${crypto.randomUUID()}.webp`;

    // Subir el buffer optimizado al bucket 'catalog' de Supabase
    const { data, error } = await supabase.storage
      .from('catalog')
      .upload(fileName, optimizedBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Error al subir la imagen a Supabase Storage: ${error.message}`);
    }

    // Obtener la URL pública del archivo
    const { data: publicUrlData } = supabase.storage
      .from('catalog')
      .getPublicUrl(fileName);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('No se pudo obtener la URL pública de la imagen subida.');
    }

    return publicUrlData.publicUrl;
  }
}
