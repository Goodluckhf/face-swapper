import { IsString } from 'class-validator';

export default class UploadDto {
  @IsString()
  photo: string;

  @IsString()
  uploadUrl: string;
}
