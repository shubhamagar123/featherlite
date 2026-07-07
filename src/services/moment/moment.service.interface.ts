import { IResult } from '../types/result.type';
import { MomentDTO } from '../dtos/moment.dto';
import { CreateMomentDTO, UpdateMomentDTO } from '../dtos/moment.dto';

export interface IMomentService {
  createMoment(dto: CreateMomentDTO): Promise<IResult<MomentDTO>>;
  getMomentById(momentId: string): Promise<IResult<MomentDTO>>;
  getMomentsByCompanionId(companionId: string, limit?: number): Promise<IResult<MomentDTO[]>>;
  updateMoment(momentId: string, dto: UpdateMomentDTO): Promise<IResult<MomentDTO>>;
  deleteMoment(momentId: string): Promise<IResult<void>>;
}
