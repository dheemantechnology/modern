UPDATE public.cms_pages
SET sections = jsonb_build_object(
  'hero', jsonb_build_object(
    'eyebrow', 'Our story',
    'title', 'One car in 2013.',
    'accent', 'A nation on the move today.',
    'subtitle', 'Modern Multi Services built professional car rental in Somaliland from the ground up — written contracts, full insurance, transparent USD pricing, and a team that answers the phone day or night. Hargeisa-born, nationally trusted.',
    'ctaPrimary', 'Read our story',
    'ctaSecondary', 'Meet the team'
  ),
  'stats', jsonb_build_array(
    jsonb_build_object('value', 12, 'suffix', '+', 'label', 'Years on the road'),
    jsonb_build_object('value', 40, 'suffix', '', 'label', 'Vehicles in active service'),
    jsonb_build_object('value', 8200, 'suffix', '+', 'label', 'Customers served since 2013'),
    jsonb_build_object('value', 1, 'suffix', 'st', 'label', 'Professional rental company in Somaliland')
  ),
  'founder', jsonb_build_object(
    'eyebrow', 'A word from the founder',
    'title', 'Built on trust, one customer at a time.',
    'name', 'Khaalid Abdirahman',
    'role', 'CEO & Founder',
    'initials', 'KA',
    'quote', 'In 2013, I parked one sedan outside the Durdur Building and opened Modern Multi Services. At that time, professional car rental simply did not exist in Hargeisa. There were no written contracts, no insurance, and no proper receipts. I went from one bank to another looking for capital to grow the business. Every door closed. Not a single institution believed the idea could work. Today, those same banks are the ones asking to partner with us. The government, international NGOs, and the largest enterprises in Somaliland choose us as their trusted mobility partner. But I have never forgotten the first customers — the everyday families and small business owners who paid for a rental when all we had was one car and a handshake. They are the reason we stand here today. We are proud to be Somaliland''s first fully digital car rental company — built carefully, built honestly, and built to last.',
    'date', '— Hargeisa, May 2026'
  ),
  'timeline', jsonb_build_object(
    'eyebrow', 'The journey',
    'title', 'Twelve years. One direction — forward.',
    'items', jsonb_build_array(
      jsonb_build_object('year','2013','title','One car, one phone number.','body','Modern Multi Services opens with a single sedan and a hand-written contract — the first rental company in Hargeisa to offer written agreements, real receipts and a proper customer hotline.'),
      jsonb_build_object('year','2016','title','Tested by the hardest years.','body','Through drought, fuel shortages and a fragile economy, we honour every booking, service every car on schedule and hold our prices steady. No layoffs. No shortcuts. No surprises for the customer.'),
      jsonb_build_object('year','2019','title','Rental moves online.','body','First in Somaliland to accept Zaad, E-dahab and Premier Wallet. Bilingual contracts are signed on the customer''s phone. Photo inspection at handover and return becomes the standard the industry now follows.'),
      jsonb_build_object('year','2022','title','Forty vehicles. Three classes.','body','The fleet expands to forty cars across Luxury, Mini SUV and Sedan tiers — serving embassies, NGOs, contractors, weddings, family trips and daily commuters across the country.'),
      jsonb_build_object('year','2026','title','A platform, not just a fleet.','body','A 24/7 call centre on 3032, a five-minute online booking flow, an in-house CRM and accounting system, and a team of eight specialists — the reference point for modern car rental in the Horn of Africa.')
    )
  ),
  'values', jsonb_build_object(
    'eyebrow', 'What we stand for',
    'title', 'Six principles we will not bend.',
    'items', jsonb_build_array(
      jsonb_build_object('title','Honest by design','body','No interest, no hidden charges, no surprise fees. Every contract is written in plain language and structured to be fair from the first line to the last.'),
      jsonb_build_object('title','Built in Somaliland','body','A local company, owned and run by Somalilanders. Every contract is available in both English and Somali so nothing is ever lost in translation.'),
      jsonb_build_object('title','Customer dignity','body','We explain every clause in the language you actually speak, in words you actually use. No fine print, no awkward calls after the rental ends.'),
      jsonb_build_object('title','Operational discipline','body','Every car is inspected before and after each rental. Every payment is logged. Every booking has an owner inside the team. Nothing depends on memory.'),
      jsonb_build_object('title','Rooted in Hargeisa','body','We know these roads, these garages, these customers and this weather. When something goes wrong upcountry, we already know who to call.'),
      jsonb_build_object('title','Always improving','body','From paper contracts to mobile money, from radio ads to online booking — we keep upgrading the experience while keeping the price honest.')
    )
  ),
  'team', (SELECT sections->'team' FROM public.cms_pages WHERE slug='about')
    || jsonb_build_object('eyebrow','The people behind the wheel','title','Eight specialists. One promise.','intro','A small, senior team. Each person owns a clear part of the business — and every one of them has the authority to make things right for a customer on the spot.'),
  'cta', jsonb_build_object(
    'title','Come and see for yourself.',
    'body','Visit us at the Durdur Building in Hargeisa, call 3032 at any hour, or reserve online in five minutes. Whichever door you choose, the same team — and the same promise — is waiting on the other side.'
  )
)
WHERE slug = 'about';