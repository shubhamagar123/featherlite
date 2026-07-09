/**
 * Device Manager
 * Manages device registration and lifecycle
 */

import { Device, DeviceInfo } from '../types';
import { createLogger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class DeviceManager {
  private logger = createLogger(this.constructor.name);
  private devices = new Map<string, Device>();
  private userDevices = new Map<string, Set<string>>();

  async registerDevice(userId: string, deviceInfo: DeviceInfo, metadata?: Record<string, any>): Promise<Device> {
    const deviceId = uuidv4();
    const now = new Date();

    const device: Device = {
      id: deviceId,
      userId,
      name: deviceInfo.name,
      type: deviceInfo.type,
      os: deviceInfo.os,
      osVersion: deviceInfo.osVersion,
      browser: deviceInfo.browser,
      browserVersion: deviceInfo.browserVersion,
      appVersion: deviceInfo.appVersion,
      registeredAt: now,
      lastActiveAt: now,
      isActive: true,
      metadata: metadata || {},
    };

    this.devices.set(deviceId, device);

    if (!this.userDevices.has(userId)) {
      this.userDevices.set(userId, new Set());
    }
    this.userDevices.get(userId)!.add(deviceId);

    this.logger.info(`Device registered: ${deviceId} for user ${userId}`);
    return device;
  }

  async getDevice(deviceId: string): Promise<Device | null> {
    return this.devices.get(deviceId) || null;
  }

  async getUserDevices(userId: string): Promise<Device[]> {
    const deviceIds = this.userDevices.get(userId) || new Set();
    const devices: Device[] = [];

    for (const deviceId of deviceIds) {
      const device = this.devices.get(deviceId);
      if (device) {
        devices.push(device);
      }
    }

    return devices;
  }

  async updateDeviceActivity(deviceId: string): Promise<Device | null> {
    const device = this.devices.get(deviceId);

    if (!device) {
      return null;
    }

    device.lastActiveAt = new Date();
    this.devices.set(deviceId, device);

    return device;
  }

  async updateDeviceName(deviceId: string, name: string): Promise<Device | null> {
    const device = this.devices.get(deviceId);

    if (!device) {
      return null;
    }

    device.name = name;
    this.devices.set(deviceId, device);

    this.logger.debug(`Device name updated: ${deviceId} -> ${name}`);
    return device;
  }

  async removeDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);

    if (!device) {
      return false;
    }

    this.devices.delete(deviceId);

    const userDevices = this.userDevices.get(device.userId);
    if (userDevices) {
      userDevices.delete(deviceId);
    }

    this.logger.info(`Device removed: ${deviceId}`);
    return true;
  }

  async removeAllUserDevices(userId: string): Promise<number> {
    const deviceIds = this.userDevices.get(userId) || new Set();
    let removedCount = 0;

    for (const deviceId of deviceIds) {
      this.devices.delete(deviceId);
      removedCount++;
    }

    this.userDevices.delete(userId);

    this.logger.info(`Removed ${removedCount} devices for user ${userId}`);
    return removedCount;
  }

  async deactivateDevice(deviceId: string): Promise<Device | null> {
    const device = this.devices.get(deviceId);

    if (!device) {
      return null;
    }

    device.isActive = false;
    this.devices.set(deviceId, device);

    this.logger.info(`Device deactivated: ${deviceId}`);
    return device;
  }

  async reactivateDevice(deviceId: string): Promise<Device | null> {
    const device = this.devices.get(deviceId);

    if (!device) {
      return null;
    }

    device.isActive = true;
    device.lastActiveAt = new Date();
    this.devices.set(deviceId, device);

    this.logger.info(`Device reactivated: ${deviceId}`);
    return device;
  }

  async getDeviceCount(): Promise<number> {
    return this.devices.size;
  }

  async getUserDeviceCount(userId: string): Promise<number> {
    return (this.userDevices.get(userId) || new Set()).size;
  }

  async getActiveDevices(): Promise<Device[]> {
    return Array.from(this.devices.values()).filter(d => d.isActive);
  }

  async getAllDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }
}
