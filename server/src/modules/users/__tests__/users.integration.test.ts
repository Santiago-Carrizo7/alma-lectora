import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { prisma } from '../../../config/db.js';
import { generateTestToken } from '../../../../tests/helpers.js';

let clubId: string;
let adminId: string;
let jugadorId: string;

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  const club = await prisma.club.create({ data: { nombre: 'Club Test' } });
  clubId = club.id;

  const pAdmin = await prisma.persona.create({ data: { dni: '88888881', nombre: 'Admin', apellido: 'Test' } });
  const uAdmin = await prisma.usuarioApp.create({
    data: { clubId, personaId: pAdmin.id, email: 'admin@test.com', passwordHash: 'ignored', rol: 'ADMIN', activo: true },
  });
  adminId = uAdmin.id;

  const pJug = await prisma.persona.create({ data: { dni: '88888882', nombre: 'Jug', apellido: 'Test' } });
  const uJug = await prisma.usuarioApp.create({
    data: { clubId, personaId: pJug.id, email: 'jug@test.com', passwordHash: 'ignored', rol: 'JUGADOR', activo: true },
  });
  jugadorId = uJug.id;
});

describe('Users API', () => {
  describe('Happy Path (HTTP 200/201)', () => {
    it('POST /api/v1/users - crea un DT y retorna 201 con estructura UserDetail', async () => {
      const token = generateTestToken(clubId, 'ADMIN', adminId);
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'nuevo-dt@test.com',
          password: 'password123',
          rol: 'DT',
          persona: { dni: '12345678', nombre: 'Nuevo', apellido: 'DT', personaExiste: false },
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ email: 'nuevo-dt@test.com', rol: 'DT', activo: true });
      expect(res.body).toHaveProperty('id');
      expect(res.body.persona).toMatchObject({ dni: '12345678', nombre: 'Nuevo', apellido: 'DT' });
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('GET /api/v1/users - lista usuarios paginados e incluye el creado', async () => {
      const token = generateTestToken(clubId, 'ADMIN', adminId);
      const created = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'lista-dt@test.com',
          password: 'password123',
          rol: 'DT',
          persona: { dni: '22345678', nombre: 'Lista', apellido: 'DT', personaExiste: false },
        });

      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      const found = res.body.data.find((u: Record<string, unknown>) => u.id === created.body.id);
      expect(found).toBeDefined();
      expect(found).toMatchObject({ email: 'lista-dt@test.com', rol: 'DT' });
    });
  });

  describe('Security - RBAC (HTTP 403)', () => {
    it('Token JUGADOR no puede crear usuarios', async () => {
      const token = generateTestToken(clubId, 'JUGADOR', jugadorId);
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'intruso@test.com',
          password: 'password123',
          rol: 'DT',
          persona: { dni: '99999999', nombre: 'Intruso', apellido: 'X', personaExiste: false },
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Acceso denegado: Permisos insuficientes' });
    });
  });
});
