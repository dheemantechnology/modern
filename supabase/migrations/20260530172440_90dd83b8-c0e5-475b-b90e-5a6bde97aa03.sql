
-- News & Media table for testimonials, videos, awards, news
CREATE TYPE public.news_category AS ENUM ('testimonial','video','award','news');

CREATE TABLE public.news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.news_category NOT NULL DEFAULT 'news',
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  excerpt text,
  body text,
  cover_url text,
  video_url text,
  customer_name text,
  customer_title text,
  customer_company text,
  customer_avatar_url text,
  rating int CHECK (rating BETWEEN 1 AND 5),
  award_issuer text,
  event_date date,
  tags text[] NOT NULL DEFAULT '{}',
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_news_posts_pub ON public.news_posts (published, category, published_at DESC);

GRANT SELECT ON public.news_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news_posts TO authenticated;
GRANT ALL ON public.news_posts TO service_role;

ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news public read published" ON public.news_posts
  FOR SELECT TO anon, authenticated
  USING (published = true OR private.is_staff(auth.uid()));

CREATE POLICY "news staff write" ON public.news_posts
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager') OR private.has_role(auth.uid(),'editor'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager') OR private.has_role(auth.uid(),'editor'));

CREATE TRIGGER trg_news_posts_touch
  BEFORE UPDATE ON public.news_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed samples
INSERT INTO public.news_posts (category, slug, title, subtitle, excerpt, body, cover_url, video_url, customer_name, customer_title, customer_company, rating, award_issuer, event_date, tags, featured, published_at, sort_order) VALUES
('testimonial','testimonial-somaliland-government-fleet','"They moved a delegation of 40 people without a single delay."','Office of the Presidency · Hargeisa','Modern Multi Services handled our official transport for a week — every vehicle on time, every driver in uniform, every contract clear.',
 'When the Office of the Presidency needed reliable transport for an international delegation, Modern Multi Services delivered 12 vehicles with professional drivers for seven straight days. Every pickup was on time. Every contract was written and signed. Every payment was in USD with a proper receipt. This is the standard Somaliland deserves.',
 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&q=80', NULL,
 'Mr. Abdirahman Hassan','Protocol Director','Office of the Presidency, Somaliland', 5, NULL, '2025-09-10', ARRAY['government','vip','fleet'], true, now() - interval '12 days', 10),

('testimonial','testimonial-unicef-somaliland','"The only rental company we trust for our field missions."','UNICEF Somaliland','Six Land Cruisers, six weeks, zero issues. Their maintenance and insurance documentation made our compliance team smile.',
 'Field missions in remote regions of Somaliland require vehicles you can rely on. Modern Multi Services provided a fleet of fully insured Land Cruisers with detailed handover checklists, real-time support, and transparent USD pricing — exactly what an international organization needs.',
 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&q=80', NULL,
 'Ms. Hodan Mohamed','Operations Manager','UNICEF Somaliland', 5, NULL, '2025-08-22', ARRAY['ngo','vip','field-mission'], true, now() - interval '30 days', 9),

('testimonial','testimonial-dahabshiil-corporate','"From three cars in 2019 to a corporate account today."','Dahabshiil Group','We started with a single rental for a visiting executive. Today, Modern Multi Services is our preferred corporate transport partner.',
 'A long-term partnership built on consistency. Every booking is confirmed in minutes, every invoice is clean, every vehicle is presentation-ready. That is why our finance team chose them as our exclusive ground transport provider.',
 'https://images.unsplash.com/photo-1556800572-1b8aeef2c54f?w=1600&q=80', NULL,
 'Mr. Mustafe Ahmed','Head of Corporate Services','Dahabshiil Group', 5, NULL, '2025-07-15', ARRAY['enterprise','vip','corporate'], false, now() - interval '60 days', 8),

('testimonial','testimonial-loyal-customer-2014','"I rented from them in 2014. I am still renting from them today."','Hargeisa, Somaliland','Twelve years of fair prices, honest contracts, and a phone that always gets answered.',
 'Long before the apps and the websites, they answered when I called. They still do. The cars are newer, the office is bigger, the team is larger — but the trust is exactly the same.',
 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=1600&q=80', NULL,
 'Mr. Ahmed Yusuf','Returning Customer since 2014',NULL, 5, NULL, '2025-06-01', ARRAY['loyalty','community'], false, now() - interval '90 days', 7),

('video','25-percent-ramadan-promotion','25% off — our biggest promotion of the year','A thank-you to every customer who trusted us first','Watch our latest marketing campaign: a 25% discount across the fleet, available now through our hotline and website.',
 'Every year we run one major promotion to thank the customers who built this company with us. This year it is 25% off the daily rate across all three vehicle classes — Economy, Executive, and SUV — bookable online in five minutes or by calling 3032.',
 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=80',
 'https://www.facebook.com/ModernMultiService/videos/1218283205567148/',
 NULL, NULL, NULL, NULL, NULL, '2025-10-01', ARRAY['promotion','campaign','discount'], true, now() - interval '20 days', 6),

('video','wedding-decoration-fleet','Wedding & Meher decoration — the largest fleet in Somaliland','Make your day unforgettable','From classic decorated sedans to convoys of luxury SUVs — Modern Multi Services has the largest dedicated wedding fleet in the country.',
 'For more than a decade, Somaliland families have chosen us for the most important day of their lives. Decorated vehicles, professional drivers, on-time arrival, and a contract that protects both sides. Call 514988 or 063-3111146 to book your wedding fleet.',
 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80',
 'https://www.facebook.com/ModernMultiService/videos/3064554486964699/',
 NULL, NULL, NULL, NULL, NULL, '2025-05-12', ARRAY['wedding','campaign','luxury'], true, now() - interval '45 days', 5),

('award','award-best-rental-company-2024','Recognized as Somaliland''s leading rental company','Somaliland Business Excellence Awards 2024','A national recognition for thirteen years of professional, contract-based car rental in Somaliland.',
 'We are proud to have received this recognition from the Somaliland Chamber of Commerce. It is not for us — it is for every customer who trusted us, every employee who shows up early, and every partner who believed in a different way of doing business.',
 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=1600&q=80', NULL,
 NULL, NULL, NULL, NULL, 'Somaliland Chamber of Commerce', '2024-12-18', ARRAY['award','recognition','2024'], true, now() - interval '180 days', 4),

('award','award-first-digital-rental-2023','First fully-digital car rental platform in Somaliland','Somaliland Digital Innovation Awards 2023','Recognized for launching the country''s first online booking, USD payment, and digital contract platform for car rental.',
 'A national first. Customers can browse the fleet, book a vehicle, pay in USD through ZAAD/EVC, and sign a written contract — all on one platform. This award is shared with the entire team that built it.',
 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1600&q=80', NULL,
 NULL, NULL, NULL, NULL, 'Somaliland Digital Innovation Forum', '2023-11-04', ARRAY['award','digital','innovation'], false, now() - interval '365 days', 3),

('news','news-fleet-expansion-2026','Fleet expansion: 12 new SUVs added for 2026','Built for the toughest roads in the Horn of Africa','We have added 12 new SUVs to our fleet — fully insured, professionally serviced, and ready to be booked online today.',
 'A serious fleet for serious customers. The 2026 expansion adds 12 new SUVs across our three branches in Hargeisa, with the same insurance, maintenance, and contract standards our customers expect.',
 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1600&q=80', NULL,
 NULL, NULL, NULL, NULL, NULL, '2026-01-15', ARRAY['fleet','expansion','suv'], false, now() - interval '5 days', 2),

('news','news-24-7-hotline-launch','24/7 customer hotline now live — call 3032 anytime','Day or night, someone answers','Our customers asked for round-the-clock support. We listened. Call 3032 any hour of any day and a real person will pick up.',
 'Travel doesn''t stop at 5pm. Neither do we. The new 24/7 hotline is staffed by trained dispatchers who can confirm bookings, arrange roadside support, and escalate any issue directly to the operations manager on duty.',
 'https://images.unsplash.com/photo-1556745753-b2904692b3cd?w=1600&q=80', NULL,
 NULL, NULL, NULL, NULL, NULL, '2025-11-20', ARRAY['support','hotline','service'], false, now() - interval '40 days', 1);
