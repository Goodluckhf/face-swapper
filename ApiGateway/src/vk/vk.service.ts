import { Injectable } from '@nestjs/common';
import UploadDto from './dtos/Upload.dto';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class VkService {

    constructor(private readonly httpService: HttpService){}

    async uploadFile(file: UploadDto){
        const {photo, uploadUrl} = file
        const fetchedPhoto = await this.httpService.get(photo, {responseType: 'arraybuffer'}).toPromise()
        const contentType = fetchedPhoto.headers['content-type']
        const form = new FormData()
        form.set('photo', new Blob([fetchedPhoto.data], {type: contentType}), 'test.png')

        const {data} = await this.httpService.post(uploadUrl, form).toPromise()
        return data
    }
}
