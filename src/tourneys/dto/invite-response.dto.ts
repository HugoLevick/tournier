import { IsBoolean, IsNumber, Min } from 'class-validator';

export class InviteResponseDto {
  @IsNumber()
  @Min(0)
  inviteId: number;

  @IsBoolean()
  accepted: boolean;
}
