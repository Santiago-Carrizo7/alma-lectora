import sharp from 'sharp';
import crypto from 'crypto';
import { supabase } from '../../config/supabase.js';
import { AppError } from '../../utils/AppError.js';

export class AdminService {
  static async uploadImage(fileBuffer: Buffer): Promise<string> {
    try {
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
        throw new Error(error.message);
      }

      // Obtener la URL pública del archivo
      const { data: publicUrlData } = supabase.storage
        .from('catalog')
        .getPublicUrl(fileName);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('No se pudo obtener la URL pública de la imagen subida.');
      }

      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error('[AdminService:UploadImage:Error]', error);
      throw new AppError("El servicio de almacenamiento no está disponible de forma temporal. Verifique la configuración del bucket.", 400);
    }
  }
}
