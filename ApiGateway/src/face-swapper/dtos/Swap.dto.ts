import { IsString } from 'class-validator';

export class SwapDto {
  @IsString()
  id: string;

  @IsString()
  target: string;
}
