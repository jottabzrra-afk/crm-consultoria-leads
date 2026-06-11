export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          company_name: string;
          phone: string | null;
          public_form_slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          company_name?: string;
          phone?: string | null;
          public_form_slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          owner_id: string;
          assigned_user_id: string;
          status_id: string;
          source_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          city: string | null;
          company: string | null;
          interest: string;
          budget: number;
          preferred_contact_time: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          assigned_user_id: string;
          status_id: string;
          source_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          city?: string | null;
          company?: string | null;
          interest: string;
          budget?: number;
          preferred_contact_time?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "leads_assigned_user_id_fkey";
            columns: ["assigned_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "lead_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_status_id_fkey";
            columns: ["status_id"];
            isOneToOne: false;
            referencedRelation: "lead_statuses";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_notes: {
        Row: {
          id: string;
          owner_id: string;
          lead_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          lead_id: string;
          content: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lead_notes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_tasks: {
        Row: {
          id: string;
          owner_id: string;
          lead_id: string | null;
          title: string;
          due_at: string;
          completed: boolean;
          priority: Database["public"]["Enums"]["task_priority"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          lead_id?: string | null;
          title: string;
          due_at: string;
          completed?: boolean;
          priority?: Database["public"]["Enums"]["task_priority"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lead_tasks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "follow_up_tasks_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_statuses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          color: string;
          position: number;
          is_won: boolean;
          is_lost: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          color?: string;
          position?: number;
          is_won?: boolean;
          is_lost?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lead_statuses"]["Insert"]>;
        Relationships: [];
      };
      lead_sources: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lead_sources"]["Insert"]>;
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          owner_id: string;
          lead_id: string | null;
          actor_id: string | null;
          action: string;
          entity_type: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          lead_id?: string | null;
          actor_id?: string | null;
          action: string;
          entity_type?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "activity_logs_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      public_forms: {
        Row: {
          owner_id: string;
          slug: string;
          title: string;
          subtitle: string;
          company_name: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          owner_id: string;
          slug: string;
          title?: string;
          subtitle?: string;
          company_name?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["public_forms"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      capture_public_lead: {
        Args: {
          form_slug: string;
          lead_name: string;
          lead_phone: string;
          lead_email: string;
          lead_city: string;
          lead_objective: string;
          lead_budget: number;
          lead_preferred_contact_time: string;
          lead_message?: string | null;
        };
        Returns: string;
      };
      get_crm_dashboard_summary: {
        Args: {
          client_timezone?: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      task_priority: "baixa" | "media" | "alta";
    };
    CompositeTypes: Record<string, never>;
  };
};
