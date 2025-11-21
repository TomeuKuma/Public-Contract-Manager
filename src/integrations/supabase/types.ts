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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      centers: {
        Row: {
          area_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          area_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          area_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "centers_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_areas: {
        Row: {
          area_id: string
          contract_id: string
          id: string
        }
        Insert: {
          area_id: string
          contract_id: string
          id?: string
        }
        Update: {
          area_id?: string
          contract_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_areas_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_areas_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_centers: {
        Row: {
          center_id: string
          contract_id: string
          id: string
        }
        Insert: {
          center_id: string
          contract_id: string
          id?: string
        }
        Update: {
          center_id?: string
          contract_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_centers_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_centers_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          award_procedure: string | null
          contact_responsible: string | null
          contract_type: string | null
          contracting_body: string | null
          created_at: string
          dossier_number: string | null
          extendable: boolean | null
          file_number: string | null
          id: string
          instructor_technician: string | null
          modifiable: boolean | null
          name: string
          purpose: string | null
          updated_at: string
        }
        Insert: {
          award_procedure?: string | null
          contact_responsible?: string | null
          contract_type?: string | null
          contracting_body?: string | null
          created_at?: string
          dossier_number?: string | null
          extendable?: boolean | null
          file_number?: string | null
          id?: string
          instructor_technician?: string | null
          modifiable?: boolean | null
          name: string
          purpose?: string | null
          updated_at?: string
        }
        Update: {
          award_procedure?: string | null
          contact_responsible?: string | null
          contract_type?: string | null
          contracting_body?: string | null
          created_at?: string
          dossier_number?: string | null
          extendable?: boolean | null
          file_number?: string | null
          id?: string
          instructor_technician?: string | null
          modifiable?: boolean | null
          name?: string
          purpose?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      credits: {
        Row: {
          accounting_document_number: string | null
          created_at: string
          credit_committed_d: number
          credit_real: number
          credit_recognized_o: number
          economic_item: string | null
          id: string
          lot_id: string
          modificacio_credit: number | null
          organic_item: string | null
          percentage_modified: number | null
          program_item: string | null
          updated_at: string
        }
        Insert: {
          accounting_document_number?: string | null
          created_at?: string
          credit_committed_d?: number
          credit_real?: number
          credit_recognized_o?: number
          economic_item?: string | null
          id?: string
          lot_id: string
          modificacio_credit?: number | null
          organic_item?: string | null
          percentage_modified?: number | null
          program_item?: string | null
          updated_at?: string
        }
        Update: {
          accounting_document_number?: string | null
          created_at?: string
          credit_committed_d?: number
          credit_real?: number
          credit_recognized_o?: number
          economic_item?: string | null
          id?: string
          lot_id?: string
          modificacio_credit?: number | null
          organic_item?: string | null
          percentage_modified?: number | null
          program_item?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          base_amount: number
          created_at: string
          credit_id: string
          id: string
          invoice_date: string
          invoice_number: string
          total: number
          updated_at: string
          vat_amount: number
        }
        Insert: {
          base_amount: number
          created_at?: string
          credit_id: string
          id?: string
          invoice_date: string
          invoice_number: string
          total?: number
          updated_at?: string
          vat_amount: number
        }
        Update: {
          base_amount?: number
          created_at?: string
          credit_id?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          total?: number
          updated_at?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_credit_id_fkey"
            columns: ["credit_id"]
            isOneToOne: false
            referencedRelation: "credits"
            referencedColumns: ["id"]
          },
        ]
      }
      lots: {
        Row: {
          awardee: string | null
          cif_nif: string | null
          contract_id: string
          cpv: string | null
          created_at: string
          end_date: string | null
          extension_communication_deadline: string | null
          extension_end_date: string | null
          extension_start_date: string | null
          id: string
          name: string
          observations: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          awardee?: string | null
          cif_nif?: string | null
          contract_id: string
          cpv?: string | null
          created_at?: string
          end_date?: string | null
          extension_communication_deadline?: string | null
          extension_end_date?: string | null
          extension_start_date?: string | null
          id?: string
          name: string
          observations?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          awardee?: string | null
          cif_nif?: string | null
          contract_id?: string
          cpv?: string | null
          created_at?: string
          end_date?: string | null
          extension_communication_deadline?: string | null
          extension_end_date?: string | null
          extension_start_date?: string | null
          id?: string
          name?: string
          observations?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
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
    },
  },
} as const
