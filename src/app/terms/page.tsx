import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: 'Terms & Conditions | Deeprastore',
  description: 'Terms and Conditions for Deeprastore, premium Indian fashion.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto space-y-8 text-fg">
          <h1 className="font-heading text-4xl mb-8">Terms & Conditions</h1>
          
          <section className="space-y-4">
            <h2 className="font-heading text-2xl">1. Introduction</h2>
            <p className="text-fg/80 leading-relaxed">
              Welcome to Deeprastore. By accessing our website and purchasing our premium Indian fashion products, you agree to be bound by these Terms & Conditions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl">2. Orders and Payment</h2>
            <p className="text-fg/80 leading-relaxed">
              All orders are subject to acceptance and availability. Prices are listed in INR. We use Razorpay for secure transactions. Your order is confirmed only upon successful payment processing.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl">3. Custom Tailoring</h2>
            <p className="text-fg/80 leading-relaxed">
              For bespoke and custom tailoring services, measurements must be provided accurately. Deeprastore is not liable for fit issues arising from incorrect measurements submitted by the customer.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl">4. Shipping and Delivery</h2>
            <p className="text-fg/80 leading-relaxed">
              Delivery timelines are estimates. Custom stitched items require additional processing time. We are not responsible for delays caused by third-party logistics providers or customs.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl">5. Intellectual Property</h2>
            <p className="text-fg/80 leading-relaxed">
              All content on this site, including images, designs, and text, is the property of Deeprastore and is protected by copyright laws.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl">6. Contact Information</h2>
            <p className="text-fg/80 leading-relaxed">
              For any queries regarding these terms, please contact us at support@deeprastore.com.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
