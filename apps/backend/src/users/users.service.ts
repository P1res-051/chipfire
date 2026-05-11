import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    name: string;
    email: string;
    password: string;
    status: UserStatus;
    role: UserRole;
    instanceLimit: number;
    notes?: string;
  }) {
    const passwordHash = await bcrypt.hash(input.password, 12);

    return this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        status: input.status,
        role: input.role,
        instanceLimit: input.instanceLimit,
        notes: input.notes,
        mustChangePassword: true,
      },
      select: this.safeSelect(),
    });
  }

  async list() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        ...this.safeSelect(),
        _count: { select: { instances: true } },
      },
    });
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...this.safeSelect(),
        _count: { select: { instances: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(id: string, data: Partial<{ name: string; status: UserStatus; role: UserRole; instanceLimit: number; notes: string | null }>) {
    await this.getById(id);
    return this.prisma.user.update({
      where: { id },
      data,
      select: this.safeSelect(),
    });
  }

  async resetPassword(id: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
      select: this.safeSelect(),
    });
  }

  private safeSelect() {
    return {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      instanceLimit: true,
      notes: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}
