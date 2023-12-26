import { IsString } from 'class-validator';

export class SwapDto {
  @IsString()
  target: string;
}
