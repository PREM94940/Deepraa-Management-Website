import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: 'Return & Refund Policy | Deeprastore',
  description: 'Return and Refund Policy for Deeprastore.',
};

export default function RefundsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto space-y-8 text-fg">
          <h1 className="font-heading text-4xl mb-8">Return & Refund Policy</h1>
          
          <section className="space-y-4">
            <h2 className="font-heading text-2xl">1. Custom Made Items</h2>
            <p className="text-fg/80 leading-relaxed">
              Due to the bespoke nature of our custom-stitched garments, we do not accept returns or offer refunds on custom orders unless the item is defective or there has been a clear manufacturing error on our part.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl">2. Ready-to-Wear Items</h2>
            <p className="text-fg/80 leading-relaxed">
              For unstitched fabrics or ready-to-wear items in standard sizes, we accept returns within 7 days of delivery. Items must be unworn, unwashed, and with all original tags attached.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl">3. Return Process</h2>
            <p className="text-fg/80 leading-relaxed">
              To initiate a return, please contact our support team via WhatsApp or email at support@deeprastore.com with your order number and reason for return. Once approved, you will receive instructions on how to ship the item back to us.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl">4. Refunds</h2>
            <p className="text-fg/80 leading-relaxed">
              Once your return is received and inspected, we will notify you of the approval or rejection of your refund. Approved refunds will be processed, and a credit will automatically be applied to your original method of payment via Razorpay within 5-7 business days.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl">5. Defective Items</h2>
            <p className="text-fg/80 leading-relaxed">
              If you receive a defective or damaged item, please contact us immediately upon receipt with photographic evidence so we can evaluate the issue and make it right.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
