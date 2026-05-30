"use client";

import dynamic from "next/dynamic";

const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });
const OperationalShortcut = dynamic(() => import("@/components/admin/OperationalShortcut").then(m => m.OperationalShortcut), { ssr: false });
const WhatsAppConcierge = dynamic(() => import("@/components/WhatsAppConcierge").then(m => m.WhatsAppConcierge), { ssr: false });

export function GlobalClientComponents() {
  return (
    <>
      <OperationalShortcut />
      <AuthModal />
      <WhatsAppConcierge />
    </>
  );
}
