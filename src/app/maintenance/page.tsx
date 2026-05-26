import React from 'react';

export default function MaintenancePage() {
    return (
        <div className="min-h-[100svh] flex flex-col items-center justify-center bg-[#1A1A1A] text-[#E5E5E5] px-6 text-center">
            <div className="max-w-md space-y-6">
                <h1 className="text-4xl font-display font-bold text-[#D4AF37]">
                    Deeprastore
                </h1>
                <h2 className="text-2xl font-light">
                    We are currently upgrading our boutique.
                </h2>
                <p className="text-[#A3A3A3] text-sm leading-relaxed">
                    Our digital storefront is undergoing scheduled maintenance to bring you an even better shopping experience. We will be back online shortly.
                </p>
                <div className="pt-8">
                    <p className="text-xs uppercase tracking-widest text-[#D4AF37] border-t border-[#333] pt-6">
                        Thank you for your patience
                    </p>
                </div>
            </div>
        </div>
    );
}
