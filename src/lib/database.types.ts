// Auto-generated Supabase database types
// Re-run `supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts`
// to refresh after schema changes.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'fleet_manager' | 'driver' | 'safety_officer' | 'financial_analyst'
          region: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'fleet_manager' | 'driver' | 'safety_officer' | 'financial_analyst'
          region?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'fleet_manager' | 'driver' | 'safety_officer' | 'financial_analyst'
          region?: string | null
          created_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          registration_number: string
          name_model: string
          type: string
          max_load_capacity: number
          odometer: number
          acquisition_cost: number
          region: string | null
          status: 'Available' | 'On Trip' | 'In Shop' | 'Retired'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          registration_number: string
          name_model: string
          type: string
          max_load_capacity?: number
          odometer?: number
          acquisition_cost?: number
          region?: string | null
          status?: 'Available' | 'On Trip' | 'In Shop' | 'Retired'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          registration_number?: string
          name_model?: string
          type?: string
          max_load_capacity?: number
          odometer?: number
          acquisition_cost?: number
          region?: string | null
          status?: 'Available' | 'On Trip' | 'In Shop' | 'Retired'
          created_at?: string
          updated_at?: string
        }
      }
      drivers: {
        Row: {
          id: string
          name: string
          license_number: string
          license_category: string
          license_expiry: string
          contact_number: string
          safety_score: number
          region: string | null
          status: 'Available' | 'On Trip' | 'Off Duty' | 'Suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          license_number: string
          license_category: string
          license_expiry: string
          contact_number: string
          safety_score?: number
          region?: string | null
          status?: 'Available' | 'On Trip' | 'Off Duty' | 'Suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          license_number?: string
          license_category?: string
          license_expiry?: string
          contact_number?: string
          safety_score?: number
          region?: string | null
          status?: 'Available' | 'On Trip' | 'Off Duty' | 'Suspended'
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          source: string
          destination: string
          vehicle_id: string
          driver_id: string
          cargo_weight: number
          planned_distance: number
          final_odometer: number | null
          fuel_consumed: number | null
          revenue: number | null
          status: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          source: string
          destination: string
          vehicle_id: string
          driver_id: string
          cargo_weight?: number
          planned_distance?: number
          final_odometer?: number | null
          fuel_consumed?: number | null
          revenue?: number | null
          status?: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          source?: string
          destination?: string
          vehicle_id?: string
          driver_id?: string
          cargo_weight?: number
          planned_distance?: number
          final_odometer?: number | null
          fuel_consumed?: number | null
          revenue?: number | null
          status?: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      maintenance_logs: {
        Row: {
          id: string
          vehicle_id: string
          description: string
          cost: number
          is_active: boolean
          created_at: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          vehicle_id: string
          description: string
          cost?: number
          is_active?: boolean
          created_at?: string
          closed_at?: string | null
        }
        Update: {
          id?: string
          vehicle_id?: string
          description?: string
          cost?: number
          is_active?: boolean
          created_at?: string
          closed_at?: string | null
        }
      }
      fuel_logs: {
        Row: {
          id: string
          vehicle_id: string
          trip_id: string | null
          liters: number
          cost: number
          log_date: string
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          trip_id?: string | null
          liters: number
          cost: number
          log_date: string
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          trip_id?: string | null
          liters?: number
          cost?: number
          log_date?: string
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          vehicle_id: string
          category: string
          amount: number
          expense_date: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          category: string
          amount: number
          expense_date: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          category?: string
          amount?: number
          expense_date?: string
          note?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      vehicle_operational_cost: {
        Row: {
          id: string
          registration_number: string
          name_model: string
          acquisition_cost: number
          fuel_cost: number
          maintenance_cost: number
          total_operational_cost: number
        }
      }
      vehicle_roi: {
        Row: {
          id: string
          registration_number: string
          name_model: string
          acquisition_cost: number
          total_revenue: number
          total_operational_cost: number
          roi: number | null
        }
      }
    }
    Functions: {
      get_my_role: {
        Args: Record<never, never>
        Returns: 'fleet_manager' | 'driver' | 'safety_officer' | 'financial_analyst' | null
      }
      get_my_region: {
        Args: Record<never, never>
        Returns: string | null
      }
    }
    Enums: {
      role_enum: 'fleet_manager' | 'driver' | 'safety_officer' | 'financial_analyst'
      vehicle_status_enum: 'Available' | 'On Trip' | 'In Shop' | 'Retired'
      driver_status_enum: 'Available' | 'On Trip' | 'Off Duty' | 'Suspended'
      trip_status_enum: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled'
    }
  }
}
