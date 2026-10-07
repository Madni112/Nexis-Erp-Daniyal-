import { supabase } from '../Context/supabaseClient';

export interface LogActivityParams {
  action?: string;
  action_type?: string;
  tableName?: string;
  table_name?: string;
  details?: Record<string, any> | any;
  performedBy?: string;
  performed_by?: string;
  branchId?: number;
  tenantId?: string | number;
}

/**
 * Universal Activity & Audit Logger
 * Safely persists ERP audit trail entries to Supabase audit_logs
 */
export const logActivity = async (params: LogActivityParams) => {
  try {
    const action_type = params.action || params.action_type || 'ACTIVITY';
    const table_name = params.tableName || params.table_name || 'general';
    const performed_by =
      params.performedBy ||
      params.performed_by ||
      localStorage.getItem('zac_user_email') ||
      localStorage.getItem('zac_user_name') ||
      'User';
    const details = params.details || {};

    await supabase.from('audit_logs').insert([
      {
        action_type,
        table_name,
        performed_by,
        details: {
          ...details,
          logged_at: new Date().toISOString()
        }
      }
    ]);
  } catch (err) {
    // Fail gracefully so logging issues never disrupt application operations
    console.debug('Audit log skipped:', err);
  }
};

export default logActivity;
