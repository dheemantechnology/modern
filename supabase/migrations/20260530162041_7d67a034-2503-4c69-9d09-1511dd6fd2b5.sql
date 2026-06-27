UPDATE public.cms_pages
SET sections = replace(
  replace(
    replace(sections::text,
      'transparent USD pricing and halal terms', 'transparent USD pricing and fair terms'),
    'Transparent pricing, halal contracts — no riba, ever.',
    'Transparent pricing, honest contracts — no interest, no hidden fees.'),
  'No interest, no riba. Every contract is structurally halal.',
  'No interest, no hidden fees. Every contract is written to be fair and transparent.'
)::jsonb
WHERE slug = 'about';