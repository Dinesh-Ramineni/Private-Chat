import { users, rooms, messages, type User, type InsertUser, type Room, type InsertRoom, type Message, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createRoom(room: InsertRoom): Promise<Room>;
  getRoomById(roomId: string): Promise<Room | undefined>;
  saveMessage(message: InsertMessage): Promise<Message>;
  getMessagesByRoomId(roomId: number, limit?: number): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [createdRoom] = await db
      .insert(rooms)
      .values(room)
      .returning();
    return createdRoom;
  }

  async getRoomById(roomId: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.roomId, roomId));
    return room || undefined;
  }

  async saveMessage(message: InsertMessage): Promise<Message> {
    const [savedMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return savedMessage;
  }

  async getMessagesByRoomId(roomId: number, limit = 100): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(messages.createdAt)
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
