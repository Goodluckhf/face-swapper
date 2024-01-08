import { ConfigService } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Directory } from 'src/Schemas/Directory.schema';
import { MINIO_CONNECTION } from 'nestjs-minio';
import { Client } from 'minio';
import { Category, File } from './minio.models';
import * as path from 'path'

@Injectable()
export class MinioService {

    constructor(
        @InjectModel(Directory.name) private DirectoryModel: Model<Directory>,
        @Inject(MINIO_CONNECTION) private readonly minioClient: Client,
        private readonly configService: ConfigService
    ) {}
    
    async getFile(path: string){
        return await this.minioClient.getObject(this.configService.get('BUCKET'), path)
    }

    async getFiles(): Promise<File[]>{
        return new Promise((resolve,reject) => {
            const objectsListTemp: File[] = [];
            const stream = this.minioClient.listObjectsV2(this.configService.get('BUCKET'), '', true);

            stream.on('data', obj => {
                return objectsListTemp.push({
                    path: obj.name,
                    ...path.parse(obj.name)
                })
            });
            stream.on('error', reject);
            stream.on('end', () => {
                resolve(objectsListTemp);
            });
        })
    }

    async getCategories(sex: string): Promise<Category[]>{
        const allowedCategories = await this.DirectoryModel.find({sex})
        const files = await this.getFiles()
        const result: Category[] = []
    
        for(let category of allowedCategories){
            const list = files.filter(file => file.dir == category.path)
            result.push({
                name: category.name,
                path: category.path,
                photos: list.map(item => ({name: item.path}))
            })
        }

        return result
    }
}
