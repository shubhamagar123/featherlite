import { IResult } from '../types/result.type';
import { MemoryDTO } from '../dtos/memory.dto';
import { CreateMemoryDTO, UpdateMemoryDTO } from '../dtos/memory.dto';

export interface IMemoryService {
  createMemory(dto: CreateMemoryDTO): Promise<IResult<MemoryDTO>>;
  getMemoryById(memoryId: string): Promise<IResult<MemoryDTO>>;
  getMemoriesByCompanionId(companionId: string, limit?: number): Promise<IResult<MemoryDTO[]>>;
  getCriticalMemories(companionId: string, limit?: number): Promise<IResult<MemoryDTO[]>>;
  updateMemory(memoryId: string, dto: UpdateMemoryDTO): Promise<IResult<MemoryDTO>>;
  deleteMemory(memoryId: string): Promise<IResult<void>>;
  incrementAccessCount(memoryId: string): Promise<IResult<void>>;
}
