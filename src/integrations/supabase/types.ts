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
      cash_flow: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          id: string
          reference: string | null
          related_sale_id: string | null
          type: Database["public"]["Enums"]["cash_flow_type"]
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          id?: string
          reference?: string | null
          related_sale_id?: string | null
          type: Database["public"]["Enums"]["cash_flow_type"]
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          id?: string
          reference?: string | null
          related_sale_id?: string | null
          type?: Database["public"]["Enums"]["cash_flow_type"]
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_related_sale_id_fkey"
            columns: ["related_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          initials: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          initials?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          initials?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean | null
          code: string
          conditions: Json | null
          created_at: string
          id: string
          type: Database["public"]["Enums"]["coupon_type"]
          usage_limit: number | null
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          active?: boolean | null
          code: string
          conditions?: Json | null
          created_at?: string
          id?: string
          type: Database["public"]["Enums"]["coupon_type"]
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          active?: boolean | null
          code?: string
          conditions?: Json | null
          created_at?: string
          id?: string
          type?: Database["public"]["Enums"]["coupon_type"]
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: []
      }
      event_invitations: {
        Row: {
          client_id: string | null
          created_at: string
          email: string | null
          event_id: string
          id: string
          phone: string | null
          sent_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email?: string | null
          event_id: string
          id?: string
          phone?: string | null
          sent_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string | null
          event_id?: string
          id?: string
          phone?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_invitations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          consigned: boolean | null
          consignment_percentage: number | null
          consignor_id: string | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          price: number
          size: string | null
          sku: string | null
          status: Database["public"]["Enums"]["product_status"] | null
          stock_quantity: number | null
          title: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          consigned?: boolean | null
          consignment_percentage?: number | null
          consignor_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          price: number
          size?: string | null
          sku?: string | null
          status?: Database["public"]["Enums"]["product_status"] | null
          stock_quantity?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          consigned?: boolean | null
          consignment_percentage?: number | null
          consignor_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          price?: number
          size?: string | null
          sku?: string | null
          status?: Database["public"]["Enums"]["product_status"] | null
          stock_quantity?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_consignor_id_fkey"
            columns: ["consignor_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean | null
          conditions: Json | null
          created_at: string
          ends_at: string | null
          id: string
          name: string
          starts_at: string | null
          type: Database["public"]["Enums"]["promotion_type"]
          value: number | null
        }
        Insert: {
          active?: boolean | null
          conditions?: Json | null
          created_at?: string
          ends_at?: string | null
          id?: string
          name: string
          starts_at?: string | null
          type: Database["public"]["Enums"]["promotion_type"]
          value?: number | null
        }
        Update: {
          active?: boolean | null
          conditions?: Json | null
          created_at?: string
          ends_at?: string | null
          id?: string
          name?: string
          starts_at?: string | null
          type?: Database["public"]["Enums"]["promotion_type"]
          value?: number | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          client_id: string | null
          created_at: string
          discount: number | null
          id: string
          items: Json
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          seller_id: string | null
          subtotal: number
          total: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          discount?: number | null
          id?: string
          items: Json
          order_number: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          seller_id?: string | null
          subtotal: number
          total: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          discount?: number | null
          id?: string
          items?: Json
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          seller_id?: string | null
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          type?: Database["public"]["Enums"]["movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      generate_client_initials: {
        Args: { client_name: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_product: {
        Args: {
          p_brand?: string
          p_category?: string
          p_consigned?: boolean
          p_consignment_percentage?: number
          p_consignor_id?: string
          p_description?: string
          p_id: string
          p_images?: string[]
          p_price?: number
          p_size?: string
          p_sku?: string
          p_stock_quantity?: number
          p_title?: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "seller"
      cash_flow_type: "in" | "out"
      coupon_type: "percent" | "fixed"
      movement_type: "in" | "out" | "adjustment" | "reserve"
      payment_method: "pix" | "cash" | "card" | "other"
      payment_status: "pending" | "paid" | "failed"
      product_status: "available" | "reserved" | "sold" | "damaged"
      promotion_type: "percent" | "fixed" | "bundle"
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
      app_role: ["admin", "seller"],
      cash_flow_type: ["in", "out"],
      coupon_type: ["percent", "fixed"],
      movement_type: ["in", "out", "adjustment", "reserve"],
      payment_method: ["pix", "cash", "card", "other"],
      payment_status: ["pending", "paid", "failed"],
      product_status: ["available", "reserved", "sold", "damaged"],
      promotion_type: ["percent", "fixed", "bundle"],
    },
  },
} as const
