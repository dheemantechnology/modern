UPDATE cms_pages
SET sections = jsonb_set(
  jsonb_set(
    sections,
    '{founder,title}',
    '"One car. Zero belief. Now, the nation trusts us."'
  ),
  '{founder,quote}',
  '"In 2013, I parked one car outside the Durdur Building and started Modern Multi Services. People said a professional rental business could never work in Hargeisa. There were no contracts, no insurance, and no one took receipts seriously. I visited every bank I could find, asking for funding to grow. Every single one said no. Not one institution believed this business had a future. Fast-forward to today, and those same banks are the ones offering me whatever I need. The government, international NGOs, and the largest enterprises in Somaliland all choose us as their trusted partner. But the people I will never forget are the everyday customers who believed in us first — the ones who handed over their money when we had nothing but one car and a handshake. They are the real reason we stand here today. And now, we are proud to be the first fully digital car rental company in Somaliland, built from the ground up, the right way."'
)
WHERE slug = 'about';