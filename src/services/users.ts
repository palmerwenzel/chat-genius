import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export interface User {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserParams {
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

export class UserService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get a user by their ID
   * @param id The user ID to look up
   * @returns The user if found, null otherwise
   */
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, username, full_name, avatar_url, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get a user by their username
   * @param username The username to look up
   * @returns The user if found, null otherwise
   */
  async getUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, username, full_name, avatar_url, created_at, updated_at')
      .eq('username', username)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a user's profile
   * @param userId The ID of the user to update
   * @param params User update parameters
   * @returns The updated user
   */
  async updateUser(userId: string, params: UpdateUserParams): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update(params)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
} 