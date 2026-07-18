import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { AdminController } from './admin.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite de 10MB
  },
});

const adminRouter: Router = Router();

// Todas las rutas de administración requieren autenticación
adminRouter.use(requireAuth);

// Endpoint para subir imágenes optimizadas
adminRouter.post('/upload', upload.single('file'), AdminController.uploadImage);

export { adminRouter };
