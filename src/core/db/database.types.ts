export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "user_feature_settings": {
                  Row: { "exercise_enabled": boolean,"payroll_enabled": boolean,"planner_enabled": boolean,"updated_at": string,"user_id": string }
                  ComputedFields: never
                  Insert: { "exercise_enabled"?: boolean,"payroll_enabled"?: boolean,"planner_enabled"?: boolean,"updated_at"?: string,"user_id": string }
                  Update: { "exercise_enabled"?: boolean,"payroll_enabled"?: boolean,"planner_enabled"?: boolean,"updated_at"?: string,"user_id"?: string }
                  Relationships: []
                },
            "note_topics": {
                  Row: { "created_at": string,"id": string,"name": string,"user_id": string }
                  ComputedFields: never
                  Insert: { "created_at"?: string,"id"?: string,"name": string,"user_id": string }
                  Update: { "created_at"?: string,"id"?: string,"name"?: string,"user_id"?: string }
                  Relationships: []
                },
            "notes": {
                  Row: { "content": string,"created_at": string,"id": string,"remark": string | null,"show_on_home": boolean,"title": string,"topic_id": string | null,"updated_at": string,"user_id": string }
                  ComputedFields: never
                  Insert: { "content": string,"created_at"?: string,"id"?: string,"remark"?: string | null,"show_on_home"?: boolean,"title": string,"topic_id"?: string | null,"updated_at"?: string,"user_id": string }
                  Update: { "content"?: string,"created_at"?: string,"id"?: string,"remark"?: string | null,"show_on_home"?: boolean,"title"?: string,"topic_id"?: string | null,"updated_at"?: string,"user_id"?: string }
                  Relationships: [{ foreignKeyName: "notes_topic_id_fkey"; columns: ["topic_id"]; isOneToOne: false; referencedRelation: "note_topics"; referencedColumns: ["id"] }]
                },
            "exercise_logs": {
                  Row: { "activity": string,"ai_feedback": Json | null,"created_at": string,"exercise_date": string,"exercise_type": string,"focus_area": string | null,"id": string,"memo": string | null,"updated_at": string,"user_id": string }
                  ComputedFields: never
                  Insert: { "activity": string,"ai_feedback"?: Json | null,"created_at"?: string,"exercise_date": string,"exercise_type": string,"focus_area"?: string | null,"id"?: string,"memo"?: string | null,"updated_at"?: string,"user_id": string }
                  Update: { "activity"?: string,"ai_feedback"?: Json | null,"created_at"?: string,"exercise_date"?: string,"exercise_type"?: string,"focus_area"?: string | null,"id"?: string,"memo"?: string | null,"updated_at"?: string,"user_id"?: string }
                  Relationships: []
                },
            "planner_daily_reviews": {
                  Row: { "ai_feedback": Json | null,"created_at": string,"id": string,"reflection": string,"review_date": string,"updated_at": string,"user_id": string }
                  ComputedFields: never
                  Insert: { "ai_feedback"?: Json | null,"created_at"?: string,"id"?: string,"reflection": string,"review_date": string,"updated_at"?: string,"user_id": string }
                  Update: { "ai_feedback"?: Json | null,"created_at"?: string,"id"?: string,"reflection"?: string,"review_date"?: string,"updated_at"?: string,"user_id"?: string }
                  Relationships: []
                },
            "planner_tasks": {
                  Row: { "completed_at": string | null,"created_at": string,"end_time": string | null,"exercise_log_id": string | null,"id": string,"note_id": string | null,"planned_date": string | null,"priority": number | null,"start_time": string | null,"title": string,"updated_at": string,"user_id": string }
                  ComputedFields: never
                  Insert: { "completed_at"?: string | null,"created_at"?: string,"end_time"?: string | null,"exercise_log_id"?: string | null,"id"?: string,"note_id"?: string | null,"planned_date"?: string | null,"priority"?: number | null,"start_time"?: string | null,"title": string,"updated_at"?: string,"user_id": string }
                  Update: { "completed_at"?: string | null,"created_at"?: string,"end_time"?: string | null,"exercise_log_id"?: string | null,"id"?: string,"note_id"?: string | null,"planned_date"?: string | null,"priority"?: number | null,"start_time"?: string | null,"title"?: string,"updated_at"?: string,"user_id"?: string }
                  Relationships: [
                    { foreignKeyName: "planner_tasks_note_id_fkey"; columns: ["note_id"]; isOneToOne: false; referencedRelation: "notes"; referencedColumns: ["id"] },
                    { foreignKeyName: "planner_tasks_exercise_log_id_fkey"; columns: ["exercise_log_id"]; isOneToOne: false; referencedRelation: "exercise_logs"; referencedColumns: ["id"] }
                  ]
                },
            "saved_ai_insights": {
                  Row: { "created_at": string,"id": string,"insight_id": string,"user_id": string }
                  ComputedFields: never
                  Insert: { "created_at"?: string,"id"?: string,"insight_id": string,"user_id": string }
                  Update: { "created_at"?: string,"id"?: string,"insight_id"?: string,"user_id"?: string }
                  Relationships: [
                    {
      foreignKeyName: "saved_ai_insights_insight_id_fkey"
      columns: ["insight_id"]
isOneToOne: false
      referencedRelation: "ai_insights"
      referencedColumns: ["id"]
    }
                  ]
                },
            "google_calendar_event_dismissals": {
                  Row: { "dismissed_at": string,"event_date": string,"event_id": string,"user_id": string }
                  ComputedFields: never
                  Insert: { "dismissed_at"?: string,"event_date": string,"event_id": string,"user_id": string }
                  Update: { "dismissed_at"?: string,"event_date"?: string,"event_id"?: string,"user_id"?: string }
                  Relationships: []
                },
            "google_calendar_connections": {
                  Row: { "access_token_ciphertext": string,"access_token_expires_at": string,"account_email": string | null,"calendar_id": string,"connected_at": string,"refresh_token_ciphertext": string | null,"updated_at": string,"user_id": string }
                  ComputedFields: never
                  Insert: { "access_token_ciphertext": string,"access_token_expires_at": string,"account_email"?: string | null,"calendar_id"?: string,"connected_at"?: string,"refresh_token_ciphertext"?: string | null,"updated_at"?: string,"user_id": string }
                  Update: { "access_token_ciphertext"?: string,"access_token_expires_at"?: string,"account_email"?: string | null,"calendar_id"?: string,"connected_at"?: string,"refresh_token_ciphertext"?: string | null,"updated_at"?: string,"user_id"?: string }
                  Relationships: []
                },"notion_archives": {
                  Row: { "category": string,"created_at": string,"id": string,"notion_page_id": string,"source_key": string,"user_id": string }
                  ComputedFields: never
                  Insert: { "category": string,"created_at"?: string,"id"?: string,"notion_page_id": string,"source_key": string,"user_id": string }
                  Update: { "category"?: string,"created_at"?: string,"id"?: string,"notion_page_id"?: string,"source_key"?: string,"user_id"?: string }
                  Relationships: []
                },"notion_connections": {
                  Row: { "access_token_ciphertext": string,"bot_id": string,"connected_at": string,"journal_data_source_id": string | null,"refresh_token_ciphertext": string | null,"routine_data_source_id": string | null,"updated_at": string,"user_id": string,"workspace_id": string,"workspace_name": string | null }
                  ComputedFields: never
                  Insert: { "access_token_ciphertext": string,"bot_id": string,"connected_at"?: string,"journal_data_source_id"?: string | null,"refresh_token_ciphertext"?: string | null,"routine_data_source_id"?: string | null,"updated_at"?: string,"user_id": string,"workspace_id": string,"workspace_name"?: string | null }
                  Update: { "access_token_ciphertext"?: string,"bot_id"?: string,"connected_at"?: string,"journal_data_source_id"?: string | null,"refresh_token_ciphertext"?: string | null,"routine_data_source_id"?: string | null,"updated_at"?: string,"user_id"?: string,"workspace_id"?: string,"workspace_name"?: string | null }
                  Relationships: []
                },
            "ai_insights": {
                  Row: {
                    "category": string,"content": Json,"created_at": string,"id": string,"read_at": string | null,"scope": string,"source_date": string,"source_key": string,"title": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"content": Json,"created_at"?: string,"id"?: string,"read_at"?: string | null,"scope": string,"source_date": string,"source_key": string,"title": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "category"?: string,"content"?: Json,"created_at"?: string,"id"?: string,"read_at"?: string | null,"scope"?: string,"source_date"?: string,"source_key"?: string,"title"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: []
                },"journal_entries": {
                  Row: {
                    "ai_feedback": Json | null,"ai_prompt_version": string | null,"analysis_attempted_at": string | null,"analysis_error": string | null,"analyzed_at": string | null,"body": string,"created_at": string,"entry_date": string,"id": string,"mood": number | null,"title": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_feedback"?: Json | null,"ai_prompt_version"?: string | null,"analysis_attempted_at"?: string | null,"analysis_error"?: string | null,"analyzed_at"?: string | null,"body": string,"created_at"?: string,"entry_date": string,"id"?: string,"mood"?: number | null,"title"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "ai_feedback"?: Json | null,"ai_prompt_version"?: string | null,"analysis_attempted_at"?: string | null,"analysis_error"?: string | null,"analyzed_at"?: string | null,"body"?: string,"created_at"?: string,"entry_date"?: string,"id"?: string,"mood"?: number | null,"title"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string | null,"id": string,"locale": string,"timezone": string,"updated_at": string,"week_starts_on": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name"?: string | null,"id": string,"locale"?: string,"timezone"?: string,"updated_at"?: string,"week_starts_on"?: number
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string | null,"id"?: string,"locale"?: string,"timezone"?: string,"updated_at"?: string,"week_starts_on"?: number
                  }
                  Relationships: [
                    
                  ]
                },"routine_completions": {
                  Row: {
                    "completed_at": string,"created_at": string,"id": string,"note": string | null,"routine_date": string,"routine_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string,"created_at"?: string,"id"?: string,"note"?: string | null,"routine_date": string,"routine_id": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "completed_at"?: string,"created_at"?: string,"id"?: string,"note"?: string | null,"routine_date"?: string,"routine_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "routine_completions_routine_owner_fkey"
      columns: ["routine_id","user_id"]
isOneToOne: false
      referencedRelation: "routines"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"routine_daily_reviews": {
                  Row: {
                    "ai_feedback": Json | null,"ai_prompt_version": string | null,"analysis_attempted_at": string | null,"analysis_error": string | null,"analyzed_at": string | null,"completion_count": number,"created_at": string,"id": string,"reflection": string,"review_date": string,"total_count": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_feedback"?: Json | null,"ai_prompt_version"?: string | null,"analysis_attempted_at"?: string | null,"analysis_error"?: string | null,"analyzed_at"?: string | null,"completion_count": number,"created_at"?: string,"id"?: string,"reflection": string,"review_date": string,"total_count": number,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "ai_feedback"?: Json | null,"ai_prompt_version"?: string | null,"analysis_attempted_at"?: string | null,"analysis_error"?: string | null,"analyzed_at"?: string | null,"completion_count"?: number,"created_at"?: string,"id"?: string,"reflection"?: string,"review_date"?: string,"total_count"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"routine_schedule_versions": {
                  Row: {
                    "created_at": string,"effective_from": string,"id": string,"preferred_time": string | null,"routine_id": string,"time_period": string | null,"user_id": string,"weekdays": (number)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"effective_from": string,"id"?: string,"preferred_time"?: string | null,"routine_id": string,"time_period"?: string | null,"user_id": string,"weekdays": (number)[]
                  }
                  Update: {
                    "created_at"?: string,"effective_from"?: string,"id"?: string,"preferred_time"?: string | null,"routine_id"?: string,"time_period"?: string | null,"user_id"?: string,"weekdays"?: (number)[]
                  }
                  Relationships: [
                    {
      foreignKeyName: "routine_schedule_versions_routine_owner_fkey"
      columns: ["routine_id","user_id"]
isOneToOne: false
      referencedRelation: "routines"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"routines": {
                  Row: {
                    "archived_at": string | null,"color": string | null,"created_at": string,"description": string | null,"end_date": string | null,"id": string,"name": string,"sort_order": number,"start_date": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"color"?: string | null,"created_at"?: string,"description"?: string | null,"end_date"?: string | null,"id"?: string,"name": string,"sort_order"?: number,"start_date": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "archived_at"?: string | null,"color"?: string | null,"created_at"?: string,"description"?: string | null,"end_date"?: string | null,"id"?: string,"name"?: string,"sort_order"?: number,"start_date"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"work_shifts": {
                  Row: {
                    "additional_pay": number,"break_minutes": number,"created_at": string,"end_time": string | null,"id": string,"memo": string | null,"pay_rate": number,"pay_type": string,"quantity": number,"start_time": string | null,"updated_at": string,"user_id": string,"work_date": string,"workplace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "additional_pay"?: number,"break_minutes"?: number,"created_at"?: string,"end_time"?: string | null,"id"?: string,"memo"?: string | null,"pay_rate": number,"pay_type": string,"quantity"?: number,"start_time"?: string | null,"updated_at"?: string,"user_id": string,"work_date": string,"workplace_id": string
                  }
                  Update: {
                    "additional_pay"?: number,"break_minutes"?: number,"created_at"?: string,"end_time"?: string | null,"id"?: string,"memo"?: string | null,"pay_rate"?: number,"pay_type"?: string,"quantity"?: number,"start_time"?: string | null,"updated_at"?: string,"user_id"?: string,"work_date"?: string,"workplace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "work_shifts_workplace_owner_fkey"
      columns: ["workplace_id","user_id"]
isOneToOne: false
      referencedRelation: "workplaces"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"workplaces": {
                  Row: {
                    "archived_at": string | null,"color": string | null,"created_at": string,"default_break_minutes": number,"default_end_time": string | null,"default_pay_type": string,"default_rate": number,"default_start_time": string | null,"end_date": string | null,"id": string,"name": string,"pay_day": number,"pay_period_start_day": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"color"?: string | null,"created_at"?: string,"default_break_minutes"?: number,"default_end_time"?: string | null,"default_pay_type": string,"default_rate": number,"default_start_time"?: string | null,"end_date"?: string | null,"id"?: string,"name": string,"pay_day"?: number,"pay_period_start_day"?: number,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "archived_at"?: string | null,"color"?: string | null,"created_at"?: string,"default_break_minutes"?: number,"default_end_time"?: string | null,"default_pay_type"?: string,"default_rate"?: number,"default_start_time"?: string | null,"end_date"?: string | null,"id"?: string,"name"?: string,"pay_day"?: number,"pay_period_start_day"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "create_routine_with_schedule":
{ Args: { "p_color"?: string,"p_description"?: string,"p_name": string,"p_preferred_time"?: string,"p_start_date": string,"p_weekdays": (number)[] }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
