import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import type { User } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { SALT_ROUNDS, TOKEN_EXPIRES_IN } from './auth.constants';
import type { LoginInput, RegisterInput } from './auth.schemas';

type PublicUser = Pick<User, 'id' | 'email' | 'name' | 'role' | 'createdAt'>;

function toPublicUser(user: PublicUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function signToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });
}

export async function register(input: RegisterInput): Promise<PublicUser> {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        name: input.name,
        passwordHash,
      },
    });
    return toPublicUser(user);
  } catch (err) {
    // P2002 = violación de restricción única (email ya registrado)
    if ((err as { code?: string }).code === 'P2002') {
      throw new AppError(409, 'El email ya está registrado');
    }
    throw err;
  }
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  const passwordOk = user
    ? await bcrypt.compare(input.password, user.passwordHash)
    : false;

  // Mismo mensaje para email inexistente y contraseña incorrecta
  if (!user || !passwordOk) {
    throw new AppError(401, 'Credenciales incorrectas');
  }

  return {
    token: signToken(user.id, user.role),
    user: toPublicUser(user),
  };
}

export async function getMe(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'Usuario no encontrado');
  }
  return toPublicUser(user);
}