import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: 'Privacy Policy | Deeprastore',
  description: 'Privacy Policy and data handling practices for Deeprastore.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto space-y-8 text-fg">
          <h1 className="font-heading text-4xl mb-8">Privacy Policy</h1>
          
          <section className="space-y-4">
            <h2 className="font-heading text-2xl">1. Information We Collect</h2>
            <p className="text-fg/80 leading-relaxed">
              We collect information you provide directly to us, such as when you create an account, make a purchase, subscribe to our newsletter, or contact customer support. This may include your name, email address, phone number, shipping address, and payment information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl">2. How We Use Your Information</h2>
            <p className="text-fg/80 leading-relaxed">
              We use the information we collect to process transactions, fulfill orders, send order confirmations, and provide customer support. We may also use your information to send you marketing communications, subject to your preferences.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl">3. WhatsApp Communications</h2>
            <p className="text-fg/80 leading-relaxed">
              By opting into our WhatsApp concierge service, you agree to receive messages related to your inquiries, orders, and exclusive offers. You can opt out at any time.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl">4. Data Security</h2>
            <p className="text-fg/80 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl">5. Contact Us</h2>
            <p className="text-fg/80 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at privacy@deeprastore.com.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
