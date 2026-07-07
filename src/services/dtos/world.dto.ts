export interface WorldStateDTO {
  id: string;
  companionId: string;
  currentScene?: string;
  timeOfDay: string;
  season: string;
  globalMood?: string;
  gravity: number;
  timeScale: number;
  dayLengthHours: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorldStateDetailDTO extends WorldStateDTO {
  sceneCount: number;
  weatherDataCount: number;
}

export interface UpdateWorldStateDTO {
  timeOfDay?: string;
  season?: string;
  globalMood?: string;
  currentScene?: string;
  gravity?: number;
  timeScale?: number;
  dayLengthHours?: number;
}

export interface WorldEnvironmentDTO {
  timeOfDay: string;
  season: string;
  globalMood?: string;
}

export interface WorldMetadataDTO {
  companionId: string;
  currentScene?: string;
  timeOfDay: string;
  season: string;
}
