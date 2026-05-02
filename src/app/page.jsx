import Hero from '@/components/Hero';
import FeaturedProducts from '@/components/FeaturedProducts';
import CategorySection from '@/components/CategorySection';
import PromoBanner from '@/components/PromoBanner';
import TrustSection from '@/components/TrustSection';

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <CategorySection />
      <PromoBanner />
      <TrustSection />
    </>
  );
}
