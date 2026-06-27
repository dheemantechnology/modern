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
      accounts: {
        Row: {
          code: string
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      advances: {
        Row: {
          advance_date: string
          amount: number
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          journal_entry_id: string | null
          reason: string | null
          reference: string
          repaid_amount: number
          status: Database["public"]["Enums"]["advance_status"]
          updated_at: string
        }
        Insert: {
          advance_date?: string
          amount: number
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          journal_entry_id?: string | null
          reason?: string | null
          reference?: string
          repaid_amount?: number
          status?: Database["public"]["Enums"]["advance_status"]
          updated_at?: string
        }
        Update: {
          advance_date?: string
          amount?: number
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          journal_entry_id?: string | null
          reason?: string | null
          reference?: string
          repaid_amount?: number
          status?: Database["public"]["Enums"]["advance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advances_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      bookings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          channel: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          daily_rate: number
          days: number | null
          documents: Json
          end_date: string
          fleet_unit_id: string | null
          id: string
          notes: string | null
          pickup_at: string | null
          pickup_checklist: Json
          pickup_fuel: string | null
          pickup_location: string | null
          pickup_notes: string | null
          pickup_odometer: number | null
          pickup_signature_url: string | null
          reference: string
          return_checklist: Json
          return_fuel: string | null
          return_notes: string | null
          return_odometer: number | null
          return_signature_url: string | null
          returned_at: string | null
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          total: number
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          daily_rate?: number
          days?: number | null
          documents?: Json
          end_date: string
          fleet_unit_id?: string | null
          id?: string
          notes?: string | null
          pickup_at?: string | null
          pickup_checklist?: Json
          pickup_fuel?: string | null
          pickup_location?: string | null
          pickup_notes?: string | null
          pickup_odometer?: number | null
          pickup_signature_url?: string | null
          reference?: string
          return_checklist?: Json
          return_fuel?: string | null
          return_notes?: string | null
          return_odometer?: number | null
          return_signature_url?: string | null
          returned_at?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          total?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          daily_rate?: number
          days?: number | null
          documents?: Json
          end_date?: string
          fleet_unit_id?: string | null
          id?: string
          notes?: string | null
          pickup_at?: string | null
          pickup_checklist?: Json
          pickup_fuel?: string | null
          pickup_location?: string | null
          pickup_notes?: string | null
          pickup_odometer?: number | null
          pickup_signature_url?: string | null
          reference?: string
          return_checklist?: Json
          return_fuel?: string | null
          return_notes?: string | null
          return_odometer?: number | null
          return_signature_url?: string | null
          returned_at?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_fleet_unit_fkey"
            columns: ["fleet_unit_id"]
            isOneToOne: false
            referencedRelation: "fleet_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          audience: string | null
          body: string | null
          budget: number | null
          call_to_action: string | null
          channel: string | null
          clicks: number | null
          conversions: number | null
          created_at: string
          created_by: string | null
          creative_url: string | null
          end_date: string | null
          headline: string | null
          id: string
          impressions: number | null
          landing_published: boolean
          landing_slug: string | null
          landing_template: string
          landing_url: string | null
          meta: Json
          name: string
          objective: string | null
          spend: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          tags: string[]
          type: Database["public"]["Enums"]["campaign_type"]
          updated_at: string
          vehicle_interest_id: string | null
        }
        Insert: {
          audience?: string | null
          body?: string | null
          budget?: number | null
          call_to_action?: string | null
          channel?: string | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          created_by?: string | null
          creative_url?: string | null
          end_date?: string | null
          headline?: string | null
          id?: string
          impressions?: number | null
          landing_published?: boolean
          landing_slug?: string | null
          landing_template?: string
          landing_url?: string | null
          meta?: Json
          name: string
          objective?: string | null
          spend?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          tags?: string[]
          type?: Database["public"]["Enums"]["campaign_type"]
          updated_at?: string
          vehicle_interest_id?: string | null
        }
        Update: {
          audience?: string | null
          body?: string | null
          budget?: number | null
          call_to_action?: string | null
          channel?: string | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          created_by?: string | null
          creative_url?: string | null
          end_date?: string | null
          headline?: string | null
          id?: string
          impressions?: number | null
          landing_published?: boolean
          landing_slug?: string | null
          landing_template?: string
          landing_url?: string | null
          meta?: Json
          name?: string
          objective?: string | null
          spend?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          tags?: string[]
          type?: Database["public"]["Enums"]["campaign_type"]
          updated_at?: string
          vehicle_interest_id?: string | null
        }
        Relationships: []
      }
      cms_pages: {
        Row: {
          sections: Json
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          sections?: Json
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          sections?: Json
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      customer_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          customer_id: string
          id: string
          kind: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          customer_id: string
          id?: string
          kind?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
          kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          approval_status: Database["public"]["Enums"]["customer_approval"]
          avatar_url: string | null
          city: string | null
          converted_from_lead_id: string | null
          created_at: string
          date_of_birth: string | null
          documents: Json
          email: string | null
          full_name: string
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          license_expiry: string | null
          license_no: string | null
          lifetime_value: number
          loyalty_tier: string
          national_id: string | null
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["lead_source"] | null
          tags: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          approval_status?: Database["public"]["Enums"]["customer_approval"]
          avatar_url?: string | null
          city?: string | null
          converted_from_lead_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          documents?: Json
          email?: string | null
          full_name: string
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          license_expiry?: string | null
          license_no?: string | null
          lifetime_value?: number
          loyalty_tier?: string
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          tags?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          approval_status?: Database["public"]["Enums"]["customer_approval"]
          avatar_url?: string | null
          city?: string | null
          converted_from_lead_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          documents?: Json
          email?: string | null
          full_name?: string
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          license_expiry?: string | null
          license_no?: string | null
          lifetime_value?: number
          loyalty_tier?: string
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          tags?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_allowances: {
        Row: {
          amount: number
          created_at: string
          employee_id: string
          id: string
          name: string
          recurring: boolean
        }
        Insert: {
          amount?: number
          created_at?: string
          employee_id: string
          id?: string
          name: string
          recurring?: boolean
        }
        Update: {
          amount?: number
          created_at?: string
          employee_id?: string
          id?: string
          name?: string
          recurring?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "employee_allowances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_deductions: {
        Row: {
          amount: number
          created_at: string
          employee_id: string
          id: string
          name: string
          recurring: boolean
        }
        Insert: {
          amount?: number
          created_at?: string
          employee_id: string
          id?: string
          name: string
          recurring?: boolean
        }
        Update: {
          amount?: number
          created_at?: string
          employee_id?: string
          id?: string
          name?: string
          recurring?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "employee_deductions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          bank_account: string | null
          base_salary: number
          city: string | null
          created_at: string
          currency: string
          date_of_birth: string | null
          department_id: string | null
          email: string | null
          employee_no: string
          full_name: string
          hire_date: string
          id: string
          national_id: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          position: string | null
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          base_salary?: number
          city?: string | null
          created_at?: string
          currency?: string
          date_of_birth?: string | null
          department_id?: string | null
          email?: string | null
          employee_no?: string
          full_name: string
          hire_date?: string
          id?: string
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          base_salary?: number
          city?: string | null
          created_at?: string
          currency?: string
          date_of_birth?: string | null
          department_id?: string | null
          email?: string | null
          employee_no?: string
          full_name?: string
          hire_date?: string
          id?: string
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          default_account_id: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          default_account_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          default_account_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_default_account_id_fkey"
            columns: ["default_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          attachment_url: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          expense_date: string
          id: string
          journal_entry_id: string | null
          memo: string | null
          payment_account_id: string | null
          reference: string
          status: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          payment_account_id?: string | null
          reference?: string
          status?: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          payment_account_id?: string | null
          reference?: string
          status?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_units: {
        Row: {
          color: string | null
          created_at: string
          id: string
          insurance_expiry: string | null
          mileage: number
          notes: string | null
          photo_url: string | null
          plate_number: string
          purchase_date: string | null
          purchase_price: number | null
          registration_expiry: string | null
          status: Database["public"]["Enums"]["fleet_unit_status"]
          updated_at: string
          vehicle_id: string
          vin: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          insurance_expiry?: string | null
          mileage?: number
          notes?: string | null
          photo_url?: string | null
          plate_number: string
          purchase_date?: string | null
          purchase_price?: number | null
          registration_expiry?: string | null
          status?: Database["public"]["Enums"]["fleet_unit_status"]
          updated_at?: string
          vehicle_id: string
          vin?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          insurance_expiry?: string | null
          mileage?: number
          notes?: string | null
          photo_url?: string | null
          plate_number?: string
          purchase_date?: string | null
          purchase_price?: number | null
          registration_expiry?: string | null
          status?: Database["public"]["Enums"]["fleet_unit_status"]
          updated_at?: string
          vehicle_id?: string
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fleet_units_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          booking_id: string | null
          id: string
          issued_at: string
          number: string
          pdf_url: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          id?: string
          issued_at?: string
          number?: string
          pdf_url?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          id?: string
          issued_at?: string
          number?: string
          pdf_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string | null
          entry_date: string
          entry_no: string
          id: string
          memo: string | null
          source_id: string | null
          source_type: Database["public"]["Enums"]["journal_source"]
          status: Database["public"]["Enums"]["journal_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entry_date?: string
          entry_no?: string
          id?: string
          memo?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["journal_source"]
          status?: Database["public"]["Enums"]["journal_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entry_date?: string
          entry_no?: string
          id?: string
          memo?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["journal_source"]
          status?: Database["public"]["Enums"]["journal_status"]
        }
        Relationships: []
      }
      journal_lines: {
        Row: {
          account_id: string
          created_at: string
          credit: number
          debit: number
          description: string | null
          entry_id: string
          id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          entry_id: string
          id?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          entry_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          author_id: string | null
          body: string | null
          created_at: string
          done: boolean
          due_at: string | null
          duration_min: number | null
          id: string
          kind: string
          lead_id: string
          meeting_minutes: string | null
          new_stage: Database["public"]["Enums"]["lead_stage"] | null
          old_stage: Database["public"]["Enums"]["lead_stage"] | null
          participants: string[] | null
          scheduled_at: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          done?: boolean
          due_at?: string | null
          duration_min?: number | null
          id?: string
          kind?: string
          lead_id: string
          meeting_minutes?: string | null
          new_stage?: Database["public"]["Enums"]["lead_stage"] | null
          old_stage?: Database["public"]["Enums"]["lead_stage"] | null
          participants?: string[] | null
          scheduled_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          done?: boolean
          due_at?: string | null
          duration_min?: number | null
          id?: string
          kind?: string
          lead_id?: string
          meeting_minutes?: string | null
          new_stage?: Database["public"]["Enums"]["lead_stage"] | null
          old_stage?: Database["public"]["Enums"]["lead_stage"] | null
          participants?: string[] | null
          scheduled_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          campaign_id: string | null
          city: string | null
          converted_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          email: string | null
          expected_close_date: string | null
          expected_value: number | null
          full_name: string
          id: string
          lost_reason: string | null
          notes: string | null
          phone: string | null
          qualifying_booking_id: string | null
          reference: string
          score: number
          source: Database["public"]["Enums"]["lead_source"]
          stage: Database["public"]["Enums"]["lead_stage"]
          tags: string[]
          updated_at: string
          vehicle_interest_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          campaign_id?: string | null
          city?: string | null
          converted_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          email?: string | null
          expected_close_date?: string | null
          expected_value?: number | null
          full_name: string
          id?: string
          lost_reason?: string | null
          notes?: string | null
          phone?: string | null
          qualifying_booking_id?: string | null
          reference?: string
          score?: number
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["lead_stage"]
          tags?: string[]
          updated_at?: string
          vehicle_interest_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          campaign_id?: string | null
          city?: string | null
          converted_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          email?: string | null
          expected_close_date?: string | null
          expected_value?: number | null
          full_name?: string
          id?: string
          lost_reason?: string | null
          notes?: string | null
          phone?: string | null
          qualifying_booking_id?: string | null
          reference?: string
          score?: number
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["lead_stage"]
          tags?: string[]
          updated_at?: string
          vehicle_interest_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      leaves: {
        Row: {
          approved_at: string | null
          approver_id: string | null
          created_at: string
          days: number
          employee_id: string
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approver_id?: string | null
          created_at?: string
          days?: number
          employee_id: string
          end_date: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approver_id?: string | null
          created_at?: string
          days?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          balance: number
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          journal_entry_id: string | null
          monthly_installment: number
          principal: number
          reason: string | null
          reference: string
          start_date: string
          status: Database["public"]["Enums"]["loan_status"]
          updated_at: string
        }
        Insert: {
          balance: number
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          journal_entry_id?: string | null
          monthly_installment: number
          principal: number
          reason?: string | null
          reference?: string
          start_date?: string
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          journal_entry_id?: string | null
          monthly_installment?: number
          principal?: number
          reason?: string | null
          reference?: string
          start_date?: string
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          cost: number
          created_at: string
          created_by: string | null
          description: string | null
          fleet_unit_id: string
          id: string
          kind: string
          next_due_at: string | null
          odometer: number | null
          performed_at: string
          status: string
          title: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          cost?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          fleet_unit_id: string
          id?: string
          kind?: string
          next_due_at?: string | null
          odometer?: number | null
          performed_at?: string
          status?: string
          title: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          cost?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          fleet_unit_id?: string
          id?: string
          kind?: string
          next_due_at?: string | null
          odometer?: number | null
          performed_at?: string
          status?: string
          title?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_fleet_unit_id_fkey"
            columns: ["fleet_unit_id"]
            isOneToOne: false
            referencedRelation: "fleet_units"
            referencedColumns: ["id"]
          },
        ]
      }
      news_posts: {
        Row: {
          award_issuer: string | null
          body: string | null
          category: Database["public"]["Enums"]["news_category"]
          cover_url: string | null
          created_at: string
          created_by: string | null
          customer_avatar_url: string | null
          customer_company: string | null
          customer_name: string | null
          customer_title: string | null
          event_date: string | null
          excerpt: string | null
          featured: boolean
          gallery: Json
          id: string
          published: boolean
          published_at: string
          rating: number | null
          slug: string
          sort_order: number
          subtitle: string | null
          tags: string[]
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          award_issuer?: string | null
          body?: string | null
          category?: Database["public"]["Enums"]["news_category"]
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          customer_avatar_url?: string | null
          customer_company?: string | null
          customer_name?: string | null
          customer_title?: string | null
          event_date?: string | null
          excerpt?: string | null
          featured?: boolean
          gallery?: Json
          id?: string
          published?: boolean
          published_at?: string
          rating?: number | null
          slug: string
          sort_order?: number
          subtitle?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          award_issuer?: string | null
          body?: string | null
          category?: Database["public"]["Enums"]["news_category"]
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          customer_avatar_url?: string | null
          customer_company?: string | null
          customer_name?: string | null
          customer_title?: string | null
          event_date?: string | null
          excerpt?: string | null
          featured?: boolean
          gallery?: Json
          id?: string
          published?: boolean
          published_at?: string
          rating?: number | null
          slug?: string
          sort_order?: number
          subtitle?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          gateway: string | null
          gateway_payload: Json
          gateway_ref: string | null
          id: string
          method: string
          paid_at: string | null
          parent_payment_id: string | null
          refund_amount: number | null
          refund_approved_at: string | null
          refund_approved_by: string | null
          refund_days: number | null
          refund_reason: string | null
          refund_requested_at: string | null
          refund_requested_by: string | null
          refund_status: string
          status: Database["public"]["Enums"]["payment_status"]
          transaction_ref: string | null
          ussd_ref: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          gateway?: string | null
          gateway_payload?: Json
          gateway_ref?: string | null
          id?: string
          method?: string
          paid_at?: string | null
          parent_payment_id?: string | null
          refund_amount?: number | null
          refund_approved_at?: string | null
          refund_approved_by?: string | null
          refund_days?: number | null
          refund_reason?: string | null
          refund_requested_at?: string | null
          refund_requested_by?: string | null
          refund_status?: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_ref?: string | null
          ussd_ref?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          gateway?: string | null
          gateway_payload?: Json
          gateway_ref?: string | null
          id?: string
          method?: string
          paid_at?: string | null
          parent_payment_id?: string | null
          refund_amount?: number | null
          refund_approved_at?: string | null
          refund_approved_by?: string | null
          refund_days?: number | null
          refund_reason?: string | null
          refund_requested_at?: string | null
          refund_requested_by?: string | null
          refund_status?: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_ref?: string | null
          ussd_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_parent_payment_id_fkey"
            columns: ["parent_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_items: {
        Row: {
          advance_repayment: number
          allowances_total: number
          base: number
          deductions_total: number
          employee_id: string
          gross: number
          id: string
          loan_repayment: number
          net: number
          notes: string | null
          run_id: string
        }
        Insert: {
          advance_repayment?: number
          allowances_total?: number
          base?: number
          deductions_total?: number
          employee_id: string
          gross?: number
          id?: string
          loan_repayment?: number
          net?: number
          notes?: string | null
          run_id: string
        }
        Update: {
          advance_repayment?: number
          allowances_total?: number
          base?: number
          deductions_total?: number
          employee_id?: string
          gross?: number
          id?: string
          loan_repayment?: number
          net?: number
          notes?: string | null
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          journal_entry_id: string | null
          notes: string | null
          period_month: number
          period_year: number
          posted_at: string | null
          reference: string
          status: Database["public"]["Enums"]["payroll_status"]
          total_gross: number
          total_net: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          period_month: number
          period_year: number
          posted_at?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["payroll_status"]
          total_gross?: number
          total_net?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          period_month?: number
          period_year?: number
          posted_at?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["payroll_status"]
          total_gross?: number
          total_net?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
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
      vehicle_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          category: string | null
          category_id: string | null
          created_at: string
          daily_rate: number
          description: string | null
          fuel: string | null
          id: string
          image_url: string | null
          images: Json
          make: string | null
          model: string | null
          name: string
          rate_tiers: Json
          seats: number | null
          specs: Json
          status: Database["public"]["Enums"]["vehicle_status"]
          transmission: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          created_at?: string
          daily_rate?: number
          description?: string | null
          fuel?: string | null
          id?: string
          image_url?: string | null
          images?: Json
          make?: string | null
          model?: string | null
          name: string
          rate_tiers?: Json
          seats?: number | null
          specs?: Json
          status?: Database["public"]["Enums"]["vehicle_status"]
          transmission?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          category?: string | null
          category_id?: string | null
          created_at?: string
          daily_rate?: number
          description?: string | null
          fuel?: string | null
          id?: string
          image_url?: string | null
          images?: Json
          make?: string | null
          model?: string | null
          name?: string
          rate_tiers?: Json
          seats?: number | null
          specs?: Json
          status?: Database["public"]["Enums"]["vehicle_status"]
          transmission?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["id"]
          },
        ]
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      link_customer_history: {
        Args: { _customer_id: string }
        Returns: undefined
      }
      post_journal: {
        Args: {
          _amount: number
          _credit_account: string
          _date: string
          _debit_account: string
          _memo: string
          _source: Database["public"]["Enums"]["journal_source"]
          _source_id: string
        }
        Returns: string
      }
      recompute_customer_ltv: {
        Args: { _customer_id: string }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "asset" | "liability" | "equity" | "income" | "expense"
      advance_status: "pending" | "approved" | "repaid" | "rejected"
      app_role: "admin" | "manager" | "editor" | "viewer"
      booking_status:
        | "pending_approval"
        | "confirmed"
        | "active"
        | "completed"
        | "rejected"
        | "cancelled"
      campaign_status:
        | "draft"
        | "scheduled"
        | "active"
        | "paused"
        | "completed"
        | "cancelled"
      campaign_type: "physical" | "digital"
      customer_approval: "pending" | "approved" | "rejected"
      employee_status: "active" | "on_leave" | "terminated" | "suspended"
      fleet_unit_status: "available" | "rented" | "maintenance" | "retired"
      journal_source:
        | "manual"
        | "payment"
        | "refund"
        | "invoice"
        | "expense"
        | "payroll"
        | "advance"
        | "loan"
      journal_status: "draft" | "posted" | "void"
      kyc_status: "pending" | "approved" | "rejected"
      lead_source:
        | "website"
        | "referral"
        | "walk_in"
        | "social"
        | "campaign"
        | "phone"
        | "whatsapp"
        | "event"
        | "other"
      lead_stage:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "won"
        | "lost"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      leave_type: "annual" | "sick" | "unpaid" | "maternity" | "other"
      loan_status: "active" | "paid" | "defaulted" | "cancelled"
      news_category: "testimonial" | "video" | "award" | "news"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      payroll_status: "draft" | "posted" | "cancelled"
      vehicle_status: "available" | "rented" | "maintenance" | "retired"
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
      account_type: ["asset", "liability", "equity", "income", "expense"],
      advance_status: ["pending", "approved", "repaid", "rejected"],
      app_role: ["admin", "manager", "editor", "viewer"],
      booking_status: [
        "pending_approval",
        "confirmed",
        "active",
        "completed",
        "rejected",
        "cancelled",
      ],
      campaign_status: [
        "draft",
        "scheduled",
        "active",
        "paused",
        "completed",
        "cancelled",
      ],
      campaign_type: ["physical", "digital"],
      customer_approval: ["pending", "approved", "rejected"],
      employee_status: ["active", "on_leave", "terminated", "suspended"],
      fleet_unit_status: ["available", "rented", "maintenance", "retired"],
      journal_source: [
        "manual",
        "payment",
        "refund",
        "invoice",
        "expense",
        "payroll",
        "advance",
        "loan",
      ],
      journal_status: ["draft", "posted", "void"],
      kyc_status: ["pending", "approved", "rejected"],
      lead_source: [
        "website",
        "referral",
        "walk_in",
        "social",
        "campaign",
        "phone",
        "whatsapp",
        "event",
        "other",
      ],
      lead_stage: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiation",
        "won",
        "lost",
      ],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      leave_type: ["annual", "sick", "unpaid", "maternity", "other"],
      loan_status: ["active", "paid", "defaulted", "cancelled"],
      news_category: ["testimonial", "video", "award", "news"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      payroll_status: ["draft", "posted", "cancelled"],
      vehicle_status: ["available", "rented", "maintenance", "retired"],
    },
  },
} as const
