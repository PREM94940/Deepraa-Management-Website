
export const trackEvent = (eventName: string, params: any) => {
    if (typeof window !== 'undefined') {
        // GA4
        if ((window as any).gtag) {
            (window as any).gtag('event', eventName, params);
        }
        // Meta Pixel
        if ((window as any).fbq) {
            // Map GA4 events to standard Meta events where possible
            let fbEventName = eventName;
            if (eventName === 'view_item') fbEventName = 'ViewContent';
            else if (eventName === 'add_to_cart') fbEventName = 'AddToCart';
            else if (eventName === 'begin_checkout') fbEventName = 'InitiateCheckout';
            else if (eventName === 'purchase') fbEventName = 'Purchase';
            else if (eventName === 'whatsapp_click') fbEventName = 'Contact';

            // Custom event fallback
            const isStandard = ['ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Contact'].includes(fbEventName);
            
            if (isStandard) {
                (window as any).fbq('track', fbEventName, params);
            } else {
                (window as any).fbq('trackCustom', eventName, params);
            }
        }
    }
};

export const trackViewContent = (product: any) => {
    trackEvent('view_item', {
        currency: 'INR',
        value: product.price,
        items: [{
            item_id: product.sku || product.id,
            item_name: product.title,
            price: product.price
        }]
    });
};

export const trackAddToCart = (product: any, qty: number = 1) => {
    trackEvent('add_to_cart', {
        currency: 'INR',
        value: product.price * qty,
        items: [{
            item_id: product.sku || product.id,
            item_name: product.title,
            price: product.price,
            quantity: qty
        }]
    });
};

export const trackInitiateCheckout = (cartValue: number, items: any[]) => {
    trackEvent('begin_checkout', {
        currency: 'INR',
        value: cartValue,
        items: items.map(item => ({
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: item.qty
        }))
    });
};

export const trackPurchase = (transactionId: string, value: number, items: any[]) => {
    trackEvent('purchase', {
        transaction_id: transactionId,
        currency: 'INR',
        value: value,
        items: items.map(item => ({
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: item.qty
        }))
    });
};

export const trackWhatsAppClick = (intent: string, productTitle?: string) => {
    trackEvent('whatsapp_click', {
        intent: intent,
        product: productTitle
    });
};

