export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          visibility: "public" | "private";
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          visibility?: "public" | "private";
        };
        Update: {
          name?: string;
          description?: string | null;
          visibility?: "public" | "private";
        };
      };
      channels: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          visibility: "public" | "private";
          group_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          visibility?: "public" | "private";
          group_id?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          visibility?: "public" | "private";
          group_id?: string;
        };
      };
      // ... more tables as needed
    };
    Functions: {};
  };
}