export interface Customer {
    id: string;
    full_name: string;
    phone_number: string;
    whatsapp_number?: string;
    email?: string;
    city?: string;
    address?: string;
    gst_number?: string;
    customer_type?: string;
    tags?: string[];
    total_orders: number;
    total_spent: number;
    complaint_count: number;
    refund_count: number;
    risk_level: 'Low' | 'Medium' | 'High';
    loyalty_level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    notes?: string;
    created_at: string;
}

export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    sku?: string;
    category?: string;
    images: string[];
    status: 'Active' | 'Draft' | 'Out of Stock';
    created_at: string;
}

export interface Order {
    id: string;
    customer_id?: string;
    customers?: Customer; // Joined relation
    status: string;
    total_amount: number;
    payment_status: string;
    source: 'website' | 'whatsapp' | 'instagram' | 'offline' | 'exhibition' | 'custom';
    created_at: string;
    delivery_date?: string;
    notes?: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id?: string;
    product_name: string;
    price: number;
    quantity: number;
    customizations?: Record<string, any>;
}

export interface Complaint {
    id: string;
    order_id: string;
    customer_id: string;
    type: string;
    status: string;
    description: string;
    evidence_urls?: string[];
    resolution?: string;
    created_at: string;
}
