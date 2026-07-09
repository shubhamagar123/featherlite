/**
 * Simulation Clock
 * Manages time progression and scheduling during simulations
 */

import { createLogger } from '@utils/logger';

export class SimulationClock {
  private logger = createLogger(this.constructor.name);
  private startDate: Date;
  private currentDate: Date;
  private endDate: Date;
  private paused: boolean = false;
  private tickRate: number;

  constructor(startDate: Date, endDate: Date, tickRate: number = 1000) {
    this.startDate = new Date(startDate);
    this.currentDate = new Date(startDate);
    this.endDate = new Date(endDate);
    this.tickRate = tickRate;

    this.logger.info(
      `Clock initialized: ${this.startDate.toISOString()} to ${this.endDate.toISOString()}`
    );
  }

  tick(): boolean {
    if (this.paused || this.currentDate >= this.endDate) {
      return false;
    }

    const nextDate = new Date(this.currentDate);
    nextDate.setDate(nextDate.getDate() + 1);

    if (nextDate <= this.endDate) {
      this.currentDate = nextDate;
      return true;
    }

    return false;
  }

  tickMultiple(days: number): boolean {
    for (let i = 0; i < days; i++) {
      if (!this.tick()) {
        return false;
      }
    }
    return true;
  }

  getCurrentDate(): Date {
    return new Date(this.currentDate);
  }

  setCurrentDate(date: Date): void {
    if (date < this.startDate || date > this.endDate) {
      throw new Error(`Date ${date} is outside simulation range`);
    }

    this.currentDate = new Date(date);
    this.logger.info(`Clock set to ${this.currentDate.toISOString()}`);
  }

  getElapsedDays(): number {
    const diff = this.currentDate.getTime() - this.startDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  getTotalDays(): number {
    const diff = this.endDate.getTime() - this.startDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  getRemainingDays(): number {
    return this.getTotalDays() - this.getElapsedDays();
  }

  getProgress(): number {
    const total = this.getTotalDays();
    if (total === 0) return 1;
    return Math.min(1, this.getElapsedDays() / total);
  }

  isComplete(): boolean {
    return this.currentDate >= this.endDate;
  }

  pause(): void {
    this.paused = true;
    this.logger.info('Clock paused');
  }

  resume(): void {
    this.paused = false;
    this.logger.info('Clock resumed');
  }

  isPaused(): boolean {
    return this.paused;
  }

  reset(): void {
    this.currentDate = new Date(this.startDate);
    this.paused = false;
    this.logger.info('Clock reset');
  }

  getDayOfWeek(date?: Date): string {
    const d = date || this.currentDate;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d.getDay()];
  }

  isWeekend(date?: Date): boolean {
    const d = date || this.currentDate;
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  getTimeOfDay(date?: Date): string {
    const d = date || this.currentDate;
    const hour = d.getHours();

    if (hour >= 5 && hour < 9) return 'EARLY_MORNING';
    if (hour >= 9 && hour < 12) return 'MORNING';
    if (hour >= 12 && hour < 17) return 'AFTERNOON';
    if (hour >= 17 && hour < 21) return 'EVENING';
    if (hour >= 21 && hour < 24) return 'NIGHT';
    return 'LATE_NIGHT';
  }

  getDateRange(): { start: Date; end: Date } {
    return {
      start: new Date(this.startDate),
      end: new Date(this.endDate),
    };
  }

  getFormattedCurrentDate(): string {
    return this.currentDate.toISOString().split('T')[0];
  }

  isHoliday(date?: Date): boolean {
    const d = date || this.currentDate;
    const month = d.getMonth() + 1;
    const day = d.getDate();

    const holidays = [
      { month: 1, day: 1 },
      { month: 12, day: 25 },
      { month: 12, day: 31 },
      { month: 7, day: 4 },
    ];

    return holidays.some(h => h.month === month && h.day === day);
  }

  getTickRate(): number {
    return this.tickRate;
  }

  setTickRate(rate: number): void {
    this.tickRate = rate;
    this.logger.info(`Tick rate set to ${rate}ms`);
  }
}
