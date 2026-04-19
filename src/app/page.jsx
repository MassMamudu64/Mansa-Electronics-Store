import Hero from '@/components/Hero';
import TrustRail from '@/components/TrustRail';
import CategoryTiles from '@/components/CategoryTiles';
import FeaturedProducts from '@/components/FeaturedProducts';
import ConditionGuide from '@/components/ConditionGuide';
import WhyMansa from '@/components/WhyMansa';
import Testimonials from '@/components/Testimonials';
import FAQSection from '@/components/FAQSection';

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustRail />
      <CategoryTiles />
      <FeaturedProducts />
      <ConditionGuide />
      <WhyMansa />
      <Testimonials />
      <FAQSection />
    </>
  );
}
