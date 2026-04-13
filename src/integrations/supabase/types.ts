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
      activity_log: {
        Row: {
          action: string
          company_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          summary: string
          user_id: string
          user_name: string
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json
          summary: string
          user_id: string
          user_name?: string
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json
          summary?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      claim_lines: {
        Row: {
          claim_id: string
          created_at: string
          id: string
          line_total: number
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          claim_id: string
          created_at?: string
          id?: string
          line_total?: number
          product_id: string
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          claim_id?: string
          created_at?: string
          id?: string
          line_total?: number
          product_id?: string
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "claim_lines_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          claim_type: string
          company_id: string
          created_at: string
          distributor_id: string
          distributor_name: string
          id: string
          order_id: string
          order_number: string
          reason: string
          resolution_notes: string
          resolved_at: string | null
          restore_stock: boolean
          status: string
          total_claim_value: number
          updated_at: string
        }
        Insert: {
          claim_type?: string
          company_id: string
          created_at?: string
          distributor_id: string
          distributor_name?: string
          id?: string
          order_id: string
          order_number?: string
          reason?: string
          resolution_notes?: string
          resolved_at?: string | null
          restore_stock?: boolean
          status?: string
          total_claim_value?: number
          updated_at?: string
        }
        Update: {
          claim_type?: string
          company_id?: string
          created_at?: string
          distributor_id?: string
          distributor_name?: string
          id?: string
          order_id?: string
          order_number?: string
          reason?: string
          resolution_notes?: string
          resolved_at?: string | null
          restore_stock?: boolean
          status?: string
          total_claim_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string
          bank_account: string
          bank_account_name: string
          bank_ifsc: string
          bank_name: string
          created_at: string
          email: string
          gstin: string
          id: string
          invoice_prefix: string
          logo_url: string
          name: string
          next_invoice_sequence: number
          next_order_sequence: number
          order_prefix: string
          pan: string
          phone: string
          state_code: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string
          bank_account?: string
          bank_account_name?: string
          bank_ifsc?: string
          bank_name?: string
          created_at?: string
          email?: string
          gstin?: string
          id?: string
          invoice_prefix?: string
          logo_url?: string
          name: string
          next_invoice_sequence?: number
          next_order_sequence?: number
          order_prefix?: string
          pan?: string
          phone?: string
          state_code?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          bank_account?: string
          bank_account_name?: string
          bank_ifsc?: string
          bank_name?: string
          created_at?: string
          email?: string
          gstin?: string
          id?: string
          invoice_prefix?: string
          logo_url?: string
          name?: string
          next_invoice_sequence?: number
          next_order_sequence?: number
          order_prefix?: string
          pan?: string
          phone?: string
          state_code?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      distributors: {
        Row: {
          address: string
          bank_account: string
          bank_account_name: string
          bank_ifsc: string
          bank_name: string
          company_id: string
          contact: string
          created_at: string
          credit_limit: number
          email: string
          gstin: string
          id: string
          location: string
          name: string
          outstanding_amount: number
          pan: string
          state_code: string
          total_orders: number
          total_value: number
          updated_at: string
        }
        Insert: {
          address?: string
          bank_account?: string
          bank_account_name?: string
          bank_ifsc?: string
          bank_name?: string
          company_id: string
          contact?: string
          created_at?: string
          credit_limit?: number
          email?: string
          gstin?: string
          id?: string
          location?: string
          name: string
          outstanding_amount?: number
          pan?: string
          state_code?: string
          total_orders?: number
          total_value?: number
          updated_at?: string
        }
        Update: {
          address?: string
          bank_account?: string
          bank_account_name?: string
          bank_ifsc?: string
          bank_name?: string
          company_id?: string
          contact?: string
          created_at?: string
          credit_limit?: number
          email?: string
          gstin?: string
          id?: string
          location?: string
          name?: string
          outstanding_amount?: number
          pan?: string
          state_code?: string
          total_orders?: number
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "distributors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      godowns: {
        Row: {
          address: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          address?: string
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          address?: string
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "godowns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          created_at: string
          hsn_code: string
          id: string
          invoice_id: string
          product_name: string
          quantity: number
          taxable_value: number
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          hsn_code?: string
          id?: string
          invoice_id: string
          product_name?: string
          quantity?: number
          taxable_value?: number
          unit?: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          hsn_code?: string
          id?: string
          invoice_id?: string
          product_name?: string
          quantity?: number
          taxable_value?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_in_words: string
          buyer_address: string
          buyer_gstin: string
          buyer_name: string
          buyer_state_code: string
          cgst_amount: number
          company_id: string
          created_at: string
          doc_type: string
          grand_total: number
          gst_rate: number
          id: string
          igst_amount: number
          invoice_date: string
          invoice_number: string
          notes: string
          round_off: number
          seller_address: string
          seller_bank_account: string
          seller_bank_account_name: string
          seller_bank_ifsc: string
          seller_bank_name: string
          seller_email: string
          seller_gstin: string
          seller_logo_url: string
          seller_name: string
          seller_pan: string
          seller_phone: string
          seller_state_code: string
          sgst_amount: number
          source_order_id: string | null
          status: string
          subtotal: number
          supply_type: string
          total_tax: number
          updated_at: string
        }
        Insert: {
          amount_in_words?: string
          buyer_address?: string
          buyer_gstin?: string
          buyer_name?: string
          buyer_state_code?: string
          cgst_amount?: number
          company_id: string
          created_at?: string
          doc_type?: string
          grand_total?: number
          gst_rate?: number
          id?: string
          igst_amount?: number
          invoice_date?: string
          invoice_number: string
          notes?: string
          round_off?: number
          seller_address?: string
          seller_bank_account?: string
          seller_bank_account_name?: string
          seller_bank_ifsc?: string
          seller_bank_name?: string
          seller_email?: string
          seller_gstin?: string
          seller_logo_url?: string
          seller_name?: string
          seller_pan?: string
          seller_phone?: string
          seller_state_code?: string
          sgst_amount?: number
          source_order_id?: string | null
          status?: string
          subtotal?: number
          supply_type?: string
          total_tax?: number
          updated_at?: string
        }
        Update: {
          amount_in_words?: string
          buyer_address?: string
          buyer_gstin?: string
          buyer_name?: string
          buyer_state_code?: string
          cgst_amount?: number
          company_id?: string
          created_at?: string
          doc_type?: string
          grand_total?: number
          gst_rate?: number
          id?: string
          igst_amount?: number
          invoice_date?: string
          invoice_number?: string
          notes?: string
          round_off?: number
          seller_address?: string
          seller_bank_account?: string
          seller_bank_account_name?: string
          seller_bank_ifsc?: string
          seller_bank_name?: string
          seller_email?: string
          seller_gstin?: string
          seller_logo_url?: string
          seller_name?: string
          seller_pan?: string
          seller_phone?: string
          seller_state_code?: string
          sgst_amount?: number
          source_order_id?: string | null
          status?: string
          subtotal?: number
          supply_type?: string
          total_tax?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          company_id: string
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_lines: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_schemes: {
        Row: {
          created_at: string
          id: string
          order_id: string
          savings: number
          scheme_id: string | null
          scheme_label: string
          scheme_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          savings?: number
          scheme_id?: string | null
          scheme_label?: string
          scheme_name: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          savings?: number
          scheme_id?: string | null
          scheme_label?: string
          scheme_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_schemes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_schemes_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          company_id: string
          created_at: string
          date: string
          delivery_status: Database["public"]["Enums"]["delivery_status"]
          dispatch_date: string | null
          dispatch_remarks: string
          distributor_id: string
          distributor_name: string
          driver_name: string
          godown_id: string | null
          id: string
          order_number: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          salesperson_id: string
          salesperson_name: string
          scheme_savings: number
          total: number
          updated_at: string
          vehicle: string
        }
        Insert: {
          company_id: string
          created_at?: string
          date?: string
          delivery_status?: Database["public"]["Enums"]["delivery_status"]
          dispatch_date?: string | null
          dispatch_remarks?: string
          distributor_id: string
          distributor_name: string
          driver_name?: string
          godown_id?: string | null
          id?: string
          order_number: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          salesperson_id: string
          salesperson_name: string
          scheme_savings?: number
          total?: number
          updated_at?: string
          vehicle?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          date?: string
          delivery_status?: Database["public"]["Enums"]["delivery_status"]
          dispatch_date?: string | null
          dispatch_remarks?: string
          distributor_id?: string
          distributor_name?: string
          driver_name?: string
          godown_id?: string | null
          id?: string
          order_number?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          salesperson_id?: string
          salesperson_name?: string
          scheme_savings?: number
          total?: number
          updated_at?: string
          vehicle?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_godown_id_fkey"
            columns: ["godown_id"]
            isOneToOne: false
            referencedRelation: "godowns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespersons"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          company_id: string
          created_at: string
          hsn_code: string
          id: string
          name: string
          sku: string
          total_sold: number
          unit: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          company_id: string
          created_at?: string
          hsn_code?: string
          id?: string
          name: string
          sku: string
          total_sold?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          company_id?: string
          created_at?: string
          hsn_code?: string
          id?: string
          name?: string
          sku?: string
          total_sold?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      salespersons: {
        Row: {
          company_id: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          region: string
          total_orders: number
          total_value: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string
          id?: string
          name: string
          phone?: string
          region?: string
          total_orders?: number
          total_value?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          region?: string
          total_orders?: number
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salespersons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      schemes: {
        Row: {
          buy_qty: number
          company_id: string
          created_at: string
          dealer_id: string | null
          description: string
          discount_percent: number
          flat_amount: number
          free_qty: number
          id: string
          is_active: boolean
          min_order_value: number
          min_qty: number
          name: string
          product_id: string | null
          scheme_type: string
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          buy_qty?: number
          company_id: string
          created_at?: string
          dealer_id?: string | null
          description?: string
          discount_percent?: number
          flat_amount?: number
          free_qty?: number
          id?: string
          is_active?: boolean
          min_order_value?: number
          min_qty?: number
          name: string
          product_id?: string | null
          scheme_type?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          buy_qty?: number
          company_id?: string
          created_at?: string
          dealer_id?: string | null
          description?: string
          discount_percent?: number
          flat_amount?: number
          free_qty?: number
          id?: string
          is_active?: boolean
          min_order_value?: number
          min_qty?: number
          name?: string
          product_id?: string | null
          scheme_type?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schemes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schemes_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schemes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      secondary_sales: {
        Row: {
          company_id: string
          created_at: string
          date: string
          distributor_id: string
          id: string
          product_id: string
          product_name: string
          quantity: number
          remarks: string
          retailer_name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          date?: string
          distributor_id: string
          id?: string
          product_id: string
          product_name?: string
          quantity?: number
          remarks?: string
          retailer_name?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          date?: string
          distributor_id?: string
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          remarks?: string
          retailer_name?: string
        }
        Relationships: []
      }
      stock_deductions: {
        Row: {
          company_id: string
          created_at: string
          date: string
          godown_id: string
          id: string
          order_id: string
          product_id: string
          quantity_deducted: number
        }
        Insert: {
          company_id: string
          created_at?: string
          date?: string
          godown_id: string
          id?: string
          order_id: string
          product_id: string
          quantity_deducted: number
        }
        Update: {
          company_id?: string
          created_at?: string
          date?: string
          godown_id?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity_deducted?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_deductions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_deductions_godown_id_fkey"
            columns: ["godown_id"]
            isOneToOne: false
            referencedRelation: "godowns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_deductions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_deductions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          company_id: string
          created_at: string
          godown_id: string
          id: string
          last_deducted_date: string | null
          product_id: string
          quantity: number
          threshold: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          godown_id: string
          id?: string
          last_deducted_date?: string | null
          product_id: string
          quantity?: number
          threshold?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          godown_id?: string
          id?: string
          last_deducted_date?: string | null
          product_id?: string
          quantity?: number
          threshold?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_items_godown_id_fkey"
            columns: ["godown_id"]
            isOneToOne: false
            referencedRelation: "godowns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      targets: {
        Row: {
          company_id: string
          created_at: string
          entity_id: string
          entity_name: string
          entity_type: string
          id: string
          period_start: string
          period_type: string
          target_orders: number
          target_revenue: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          entity_id: string
          entity_name?: string
          entity_type?: string
          id?: string
          period_start: string
          period_type?: string
          target_orders?: number
          target_revenue?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          entity_id?: string
          entity_name?: string
          entity_type?: string
          id?: string
          period_start?: string
          period_type?: string
          target_orders?: number
          target_revenue?: number
          updated_at?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      get_company_id: { Args: never; Returns: string }
      get_next_invoice_number: {
        Args: { target_company_id: string }
        Returns: {
          prefix: string
          seq: number
        }[]
      }
      get_next_order_number: {
        Args: { target_company_id: string }
        Returns: {
          prefix: string
          seq: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_order_atomic: {
        Args: {
          p_company_id: string
          p_date: string
          p_delivery_status?: Database["public"]["Enums"]["delivery_status"]
          p_dispatch_date?: string
          p_dispatch_remarks?: string
          p_distributor_id: string
          p_distributor_name: string
          p_driver_name?: string
          p_godown_id?: string
          p_payment_mode: Database["public"]["Enums"]["payment_mode"]
          p_payment_status: Database["public"]["Enums"]["payment_status"]
          p_salesperson_id: string
          p_salesperson_name: string
          p_total: number
          p_vehicle?: string
        }
        Returns: {
          id: string
          order_number: string
          seq: number
        }[]
      }
      seed_company_data: { Args: { p_company_id: string }; Returns: undefined }
      setup_new_company: {
        Args: { p_company_name: string; p_full_name: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "super_admin" | "sales_manager" | "accountant" | "salesperson"
      delivery_status: "pending" | "dispatched" | "delivered"
      payment_mode: "cash" | "bank_transfer" | "cheque" | "upi"
      payment_status: "paid" | "partial" | "pending"
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
      app_role: ["super_admin", "sales_manager", "accountant", "salesperson"],
      delivery_status: ["pending", "dispatched", "delivered"],
      payment_mode: ["cash", "bank_transfer", "cheque", "upi"],
      payment_status: ["paid", "partial", "pending"],
    },
  },
} as const
