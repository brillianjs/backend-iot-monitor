import { pool } from "../config/database";
import { User } from "../types";
import { hashPassword } from "../utils/helpers";

export class UserModel {
  static async create(userData: {
    username: string;
    email: string;
    password: string;
    role?: "admin" | "user";
  }): Promise<User> {
    const hashedPassword = await hashPassword(userData.password);

    const [result] = await pool.execute(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [
        userData.username,
        userData.email,
        hashedPassword,
        userData.role || "user",
      ]
    );

    const insertResult = result as any;
    return this.findById(insertResult.insertId);
  }

  static async findById(id: number): Promise<User> {
    const [rows] = await pool.execute(
      "SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?",
      [id]
    );

    const users = rows as User[];
    if (users.length === 0) {
      throw new Error("User not found");
    }

    return users[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  static async findAll(
    limit: number = 50,
    offset: number = 0
  ): Promise<User[]> {
    const [rows] = await pool.execute(
      "SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    return rows as User[];
  }

  static async update(id: number, userData: Partial<User>): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(userData).forEach(([key, value]) => {
      if (key !== "id" && key !== "created_at" && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      throw new Error("No valid fields to update");
    }

    values.push(id);

    await pool.execute(
      `UPDATE users SET ${updates.join(
        ", "
      )}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [id]);

    const deleteResult = result as any;
    return deleteResult.affectedRows > 0;
  }

  static async count(): Promise<number> {
    const [rows] = await pool.execute("SELECT COUNT(*) as count FROM users");
    const result = rows as any[];
    return result[0].count;
  }

  static async updatePassword(
    id: number,
    newPassword: string
  ): Promise<boolean> {
    const hashedPassword = await hashPassword(newPassword);

    const [result] = await pool.execute(
      "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [hashedPassword, id]
    );

    const updateResult = result as any;
    return updateResult.affectedRows > 0;
  }

  static async emailExists(
    email: string,
    excludeId?: number
  ): Promise<boolean> {
    let query = "SELECT id FROM users WHERE email = ?";
    const params: any[] = [email];

    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }

    const [rows] = await pool.execute(query, params);
    const users = rows as any[];
    return users.length > 0;
  }

  static async usernameExists(
    username: string,
    excludeId?: number
  ): Promise<boolean> {
    let query = "SELECT id FROM users WHERE username = ?";
    const params: any[] = [username];

    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }

    const [rows] = await pool.execute(query, params);
    const users = rows as any[];
    return users.length > 0;
  }
}
