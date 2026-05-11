import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as fs from 'fs'
import * as path from 'path'
import { Client as MinioClient } from 'minio'

interface StorageUploadResult {
  publicUrl: string
  filePath: string
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private minioClient: MinioClient | null = null
  private minioEnabled: boolean
  private minioBucket: string
  private storageDir: string

  constructor(private configService: ConfigService) {
    this.minioEnabled = this.configService.get<string>('MINIO_ENABLED') === 'true'
    this.minioBucket = this.configService.get<string>('MINIO_BUCKET', 'evo-crm')
    this.storageDir = path.join(process.cwd(), '..', '..', 'storage', 'uploads')

    // Garantir que a pasta de storage local existe
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true })
      this.logger.log(`Diretório de storage criado: ${this.storageDir}`)
    }

    // Inicializar MinIO se habilitado
    if (this.minioEnabled) {
      try {
        this.initMinioClient()
      } catch (error) {
        this.logger.warn(
          `Falha ao conectar MinIO: ${error.message}. Usando storage local como fallback.`,
        )
        this.minioEnabled = false
      }
    }
  }

  private initMinioClient() {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT')
    const rootUser = this.configService.get<string>('MINIO_ROOT_USER')
    const rootPassword = this.configService.get<string>('MINIO_ROOT_PASSWORD')

    if (!endpoint || !rootUser || !rootPassword) {
      throw new Error('MinIO config incompleto')
    }

    this.minioClient = new MinioClient({
      endPoint: endpoint.replace('http://', '').replace('https://', ''),
      useSSL: endpoint.startsWith('https'),
      accessKey: rootUser,
      secretKey: rootPassword,
    })

    this.logger.log(`MinIO client inicializado: ${endpoint}`)
  }

  async uploadFile(
    file: Express.Multer.File,
    slug: string,
  ): Promise<StorageUploadResult> {
    if (!file) throw new Error('Arquivo não fornecido')

    const fileName = `${slug}-${Date.now()}${path.extname(file.originalname)}`

    try {
      // Tentar salvar no MinIO se disponível
      if (this.minioEnabled && this.minioClient) {
        return await this.uploadToMinio(file, fileName)
      }
    } catch (error) {
      this.logger.warn(`Erro ao salvar no MinIO: ${error.message}. Usando storage local.`)
    }

    // Fallback: salvar localmente
    return this.uploadToLocal(file, fileName)
  }

  private async uploadToMinio(
    file: Express.Multer.File,
    fileName: string,
  ): Promise<StorageUploadResult> {
    // Garantir que o bucket existe
    const bucketExists = await this.minioClient.bucketExists(this.minioBucket)
    if (!bucketExists) {
      await this.minioClient.makeBucket(this.minioBucket, 'us-east-1')
    }

    // Fazer upload
    await this.minioClient.putObject(
      this.minioBucket,
      fileName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    )

    const publicUrl = this.configService.get<string>('MINIO_PUBLIC_URL')
    return {
      publicUrl: `${publicUrl}/${this.minioBucket}/${fileName}`,
      filePath: `minio://${this.minioBucket}/${fileName}`,
    }
  }

  private uploadToLocal(
    file: Express.Multer.File,
    fileName: string,
  ): StorageUploadResult {
    const filePath = path.join(this.storageDir, fileName)
    fs.writeFileSync(filePath, file.buffer)

    return {
      publicUrl: `/storage/uploads/${fileName}`,
      filePath: `local://${fileName}`,
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (filePath.startsWith('minio://')) {
        if (this.minioEnabled && this.minioClient) {
          const key = filePath.replace(`minio://${this.minioBucket}/`, '')
          await this.minioClient.removeObject(this.minioBucket, key)
        }
      } else if (filePath.startsWith('local://')) {
        const localPath = path.join(this.storageDir, filePath.replace('local://', ''))
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath)
        }
      }
    } catch (error) {
      this.logger.warn(`Erro ao deletar arquivo ${filePath}: ${error.message}`)
    }
  }

  async getFileStream(filePath: string): Promise<NodeJS.ReadableStream | null> {
    try {
      if (filePath.startsWith('minio://')) {
        if (this.minioEnabled && this.minioClient) {
          const key = filePath.replace(`minio://${this.minioBucket}/`, '')
          return await this.minioClient.getObject(this.minioBucket, key)
        }
      } else if (filePath.startsWith('local://')) {
        const localPath = path.join(this.storageDir, filePath.replace('local://', ''))
        if (fs.existsSync(localPath)) {
          return fs.createReadStream(localPath)
        }
      }
      return null
    } catch (error) {
      this.logger.error(`Erro ao ler arquivo ${filePath}: ${error.message}`)
      return null
    }
  }
}
