export type StaffRole = 'Manager' | 'Staff';

// Centralized Permission Governance
export const PERMISSIONS = {
    // Products
    CAN_EDIT_PRICE: ['Manager'] as StaffRole[],
    CAN_EDIT_INVENTORY: ['Manager', 'Staff'] as StaffRole[],
    CAN_BULK_IMPORT: ['Manager'] as StaffRole[],
    
    // Orders
    CAN_APPROVE_ORDER: ['Manager', 'Staff'] as StaffRole[],
    CAN_PROCESS_REFUND: ['Manager'] as StaffRole[],
    CAN_UPDATE_SHIPPING: ['Manager', 'Staff'] as StaffRole[],
    
    // Complaints
    CAN_ADD_NOTES: ['Manager', 'Staff'] as StaffRole[],
    CAN_RESOLVE_REFUND_COMPLAINT: ['Manager'] as StaffRole[],
    CAN_ESCALATE_COMPLAINT: ['Manager', 'Staff'] as StaffRole[],

    // CMS Governance
    CAN_SAVE_CMS_DRAFT: ['Manager', 'Staff'] as StaffRole[],
    CAN_PUBLISH_CMS_LIVE: ['Manager'] as StaffRole[],
};

