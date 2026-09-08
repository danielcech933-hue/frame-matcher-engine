export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string
          id: string
          lesson_slug: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_slug: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_lesson_slug_fkey"
            columns: ["lesson_slug"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["slug"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          kind: string
          name: string
          risk: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          kind?: string
          name: string
          risk?: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          kind?: string
          name?: string
          risk?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      glossary: {
        Row: {
          category: string
          definition: string
          id: string
          term: string
        }
        Insert: {
          category?: string
          definition: string
          id?: string
          term: string
        }
        Update: {
          category?: string
          definition?: string
          id?: string
          term?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          category_slug: string | null
          content: string
          created_at: string
          duration_min: number
          id: string
          level: Database["public"]["Enums"]["lesson_level"]
          published: boolean
          slug: string
          sort_order: number
          style_slug: string | null
          summary: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category_slug?: string | null
          content?: string
          created_at?: string
          duration_min?: number
          id?: string
          level?: Database["public"]["Enums"]["lesson_level"]
          published?: boolean
          slug: string
          sort_order?: number
          style_slug?: string | null
          summary?: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category_slug?: string | null
          content?: string
          created_at?: string
          duration_min?: number
          id?: string
          level?: Database["public"]["Enums"]["lesson_level"]
          published?: boolean
          slug?: string
          sort_order?: number
          style_slug?: string | null
          summary?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          level: Database["public"]["Enums"]["lesson_level"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          level?: Database["public"]["Enums"]["lesson_level"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          level?: Database["public"]["Enums"]["lesson_level"]
          updated_at?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_index: number
          explanation: string
          id: string
          lesson_slug: string
          options: Json
          question: string
          sort_order: number
        }
        Insert: {
          correct_index: number
          explanation?: string
          id?: string
          lesson_slug: string
          options: Json
          question: string
          sort_order?: number
        }
        Update: {
          correct_index?: number
          explanation?: string
          id?: string
          lesson_slug?: string
          options?: Json
          question?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_lesson_slug_fkey"
            columns: ["lesson_slug"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["slug"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          lesson_slug: string
          notes: string
          score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          lesson_slug: string
          notes?: string
          score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          lesson_slug?: string
          notes?: string
          score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_slug_fkey"
            columns: ["lesson_slug"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["slug"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      lesson_level:
        | "zacatecnik"
        | "stredne_pokrocily"
        | "pokrocily"
        | "profesional"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      lesson_level: [
        "zacatecnik",
        "stredne_pokrocily",
        "pokrocily",
        "profesional",
      ],
    },
  },
} as const
