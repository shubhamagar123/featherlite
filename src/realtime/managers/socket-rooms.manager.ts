/**
 * Socket Rooms Manager
 * Manages socket room creation and membership
 */

import { SocketRoom, RoomType } from '../types';
import { createLogger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class SocketRoomsManager {
  private logger = createLogger(this.constructor.name);
  private rooms = new Map<string, SocketRoom>();
  private socketRooms = new Map<string, Set<string>>();

  createRoom(
    type: RoomType,
    metadata?: Record<string, any>
  ): SocketRoom {
    const roomId = uuidv4();

    const room: SocketRoom = {
      id: roomId,
      type,
      members: new Set(),
      createdAt: new Date(),
      metadata: metadata || {},
    };

    this.rooms.set(roomId, room);

    this.logger.debug(`Room created: ${roomId} (type: ${type})`);

    return room;
  }

  getRoom(roomId: string): SocketRoom | null {
    return this.rooms.get(roomId) || null;
  }

  addMemberToRoom(roomId: string, socketId: string): SocketRoom | null {
    const room = this.rooms.get(roomId);

    if (!room) {
      return null;
    }

    room.members.add(socketId);
    this.rooms.set(roomId, room);

    if (!this.socketRooms.has(socketId)) {
      this.socketRooms.set(socketId, new Set());
    }
    this.socketRooms.get(socketId)!.add(roomId);

    this.logger.debug(`Socket ${socketId} added to room ${roomId}`);

    return room;
  }

  removeMemberFromRoom(roomId: string, socketId: string): SocketRoom | null {
    const room = this.rooms.get(roomId);

    if (!room) {
      return null;
    }

    room.members.delete(socketId);
    this.rooms.set(roomId, room);

    const socketRoomIds = this.socketRooms.get(socketId);
    if (socketRoomIds) {
      socketRoomIds.delete(roomId);
    }

    this.logger.debug(`Socket ${socketId} removed from room ${roomId}`);

    return room;
  }

  removeMemberFromAllRooms(socketId: string): number {
    const roomIds = this.socketRooms.get(socketId) || new Set();
    let removedCount = 0;

    for (const roomId of roomIds) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.members.delete(socketId);
        this.rooms.set(roomId, room);
        removedCount++;
      }
    }

    this.socketRooms.delete(socketId);

    this.logger.debug(`Socket ${socketId} removed from ${removedCount} rooms`);

    return removedCount;
  }

  getRoomMembers(roomId: string): string[] {
    const room = this.rooms.get(roomId);

    if (!room) {
      return [];
    }

    return Array.from(room.members);
  }

  getSocketRooms(socketId: string): SocketRoom[] {
    const roomIds = this.socketRooms.get(socketId) || new Set();
    const rooms: SocketRoom[] = [];

    for (const roomId of roomIds) {
      const room = this.rooms.get(roomId);
      if (room) {
        rooms.push(room);
      }
    }

    return rooms;
  }

  getRoomsByType(type: RoomType): SocketRoom[] {
    return Array.from(this.rooms.values()).filter(r => r.type === type);
  }

  getMemberCount(roomId: string): number {
    const room = this.rooms.get(roomId);

    if (!room) {
      return 0;
    }

    return room.members.size;
  }

  isSocketInRoom(roomId: string, socketId: string): boolean {
    const room = this.rooms.get(roomId);

    if (!room) {
      return false;
    }

    return room.members.has(socketId);
  }

  updateRoomMetadata(roomId: string, metadata: Record<string, any>): SocketRoom | null {
    const room = this.rooms.get(roomId);

    if (!room) {
      return null;
    }

    room.metadata = { ...room.metadata, ...metadata };
    this.rooms.set(roomId, room);

    return room;
  }

  deleteRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);

    if (!room) {
      return false;
    }

    for (const socketId of room.members) {
      const socketRoomIds = this.socketRooms.get(socketId);
      if (socketRoomIds) {
        socketRoomIds.delete(roomId);
      }
    }

    this.rooms.delete(roomId);

    this.logger.debug(`Room deleted: ${roomId}`);

    return true;
  }

  deleteEmptyRooms(): number {
    let deletedCount = 0;

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.members.size === 0) {
        this.deleteRoom(roomId);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  getSocketRoomCount(socketId: string): number {
    return (this.socketRooms.get(socketId) || new Set()).size;
  }

  getTotalMembers(): number {
    let total = 0;

    for (const room of this.rooms.values()) {
      total += room.members.size;
    }

    return total;
  }

  getRoomsByMetadataKey(key: string, value: any): SocketRoom[] {
    return Array.from(this.rooms.values()).filter(
      r => r.metadata[key] === value
    );
  }

  getAverageMembersPerRoom(): number {
    if (this.rooms.size === 0) {
      return 0;
    }

    let totalMembers = 0;

    for (const room of this.rooms.values()) {
      totalMembers += room.members.size;
    }

    return Math.round(totalMembers / this.rooms.size);
  }

  getLargestRoom(): SocketRoom | null {
    let largest: SocketRoom | null = null;
    let maxMembers = 0;

    for (const room of this.rooms.values()) {
      if (room.members.size > maxMembers) {
        maxMembers = room.members.size;
        largest = room;
      }
    }

    return largest;
  }

  broadcastToRoom(
    roomId: string,
    callback: (socketId: string) => void
  ): number {
    const room = this.rooms.get(roomId);

    if (!room) {
      return 0;
    }

    for (const socketId of room.members) {
      callback(socketId);
    }

    return room.members.size;
  }
}
