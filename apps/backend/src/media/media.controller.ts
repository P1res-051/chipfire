import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  Body,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import { MediaService } from './media.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { CurrentUser } from '../auth/current-user.decorator'
import type { JwtPayload } from '../auth/jwt.payload'
import { CreateTextMediaDto, createTextMediaSchema } from './dto/create-text-media.dto'
import { UpdateMediaDto, updateMediaSchema } from './dto/update-media.dto'
import { ZodValidationPipe } from 'nestjs-zod'
import { MediaType } from '@prisma/client'

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Get()
  async listMedia(
    @CurrentUser() user: JwtPayload,
    @Query('type') type?: MediaType,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.mediaService.listMedia(user.sub, {
      type,
      search,
      tag,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  async uploadMedia(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Query('tags') tags?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo fornecido')
    }
    return this.mediaService.uploadMedia(user.sub, file, tags)
  }

  @Post('text')
  async createTextMedia(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createTextMediaSchema)) dto: CreateTextMediaDto,
  ) {
    return this.mediaService.createTextMedia(user.sub, dto)
  }

  @Get(':id')
  async getMedia(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.mediaService.getMediaById(id, user.sub)
  }

  @Patch(':id')
  async updateMedia(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMediaSchema)) dto: UpdateMediaDto,
  ) {
    return this.mediaService.updateMedia(id, user.sub, dto)
  }

  @Delete(':id')
  async deleteMedia(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.mediaService.deleteMedia(id, user.sub)
  }

  @Get(':id/preview')
  async getMediaPreview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { stream, mimeType } = await this.mediaService.getMediaPreview(id, user.sub)
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Cache-Control', 'public, max-age=31536000')
    stream.pipe(res)
  }
}
