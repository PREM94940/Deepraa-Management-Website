import { z } from 'zod';

export const OrderStatusUpdateSchema = z.object({
    id: z.string().uuid(),
    status: z.enum([
        'Pending', 'Pending Approval', 'Payment Pending', 'Confirmed', 
        'To Stitching', 'In Stitching', 'Ready', 'Dispatched', 
        'Delivered', 'Cancelled'
    ]),
    approval_status: z.enum(['Pending Approval', 'Approved', 'Rejected']).optional(),
    tracking_number: z.string().optional()
});

export const ProductStockUpdateSchema = z.object({
    id: z.string().uuid(),
    stock_quantity: z.number().int().min(0),
});

export const ProductBaseSchema = z.object({
    title: z.string().min(1, "Title is required"),
    sku: z.string().min(1, "SKU is required"),
    price: z.number().min(0, "Price must be positive"),
    compare_at_price: z.number().min(0).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    sub_category: z.string().optional(),
    status: z.enum(['Active', 'Draft', 'Out of Stock']),
    stock_quantity: z.number().int().min(0).default(0),
    movement_velocity: z.string().default('Normal'),
    images: z.array(z.string().url()).default([]),
    is_customizable: z.boolean().default(false),
    available_sizes: z.array(z.string()).default([]),
    allow_backorders: z.boolean().default(false),
    video_link: z.string().optional()
});

export const ProductInsertSchema = ProductBaseSchema;
export const ProductUpdateSchema = ProductBaseSchema.partial().extend({
    id: z.string().uuid()
});

export const DeleteItemsSchema = z.object({
    ids: z.array(z.string().uuid())
});

export const ComplaintInsertSchema = z.object({
    order_id: z.string().uuid(),
    customer_id: z.string().uuid(),
    issue_type: z.enum(['Replacement', 'Refund', 'Alteration', 'Other']),
    issue_reason: z.string().min(1),
    refund_amount: z.number().min(0).optional(),
    status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed', 'URGENT']).default('Open')
});

export const ComplaintUpdateSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed', 'URGENT']),
    resolution_notes: z.string().optional()
});
