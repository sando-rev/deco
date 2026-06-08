-- Migration: brand_key table in deco schema
-- Stores the Brand Key model for the Deco brand, editable from the admin dashboard.

CREATE TABLE IF NOT EXISTS deco.brand_key (
  id                   integer PRIMARY KEY DEFAULT 1,      -- singleton row
  -- Omgeving (Environment / Context)
  markt                text NOT NULL DEFAULT '',
  situatie             text NOT NULL DEFAULT '',
  concurrentie         text NOT NULL DEFAULT '',
  -- Consumer Insight
  consumer_insight     text NOT NULL DEFAULT '',
  -- Brand Values (stored as a text array)
  brand_values         text[] NOT NULL DEFAULT '{}',
  -- Personality
  personality          text NOT NULL DEFAULT '',
  -- Reason to Believe (stored as a text array)
  reason_to_believe    text[] NOT NULL DEFAULT '{}',
  -- Discriminator
  discriminator        text NOT NULL DEFAULT '',
  -- Merkessentie (Brand Essence)
  merkessentie         text NOT NULL DEFAULT '',
  -- Audit
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brand_key_singleton CHECK (id = 1)
);

-- Seed with initial brand key data
INSERT INTO deco.brand_key (
  id,
  markt,
  situatie,
  concurrentie,
  consumer_insight,
  brand_values,
  personality,
  reason_to_believe,
  discriminator,
  merkessentie
) VALUES (
  1,
  'Hockeycoaching in Nederland (en België), gericht op jeugd- en seniorenspelers',
  'Coaches hebben te weinig tijd voor individuele ontwikkelbegeleiding. Er is geen goede tooling die spelers zelf verantwoordelijkheid geeft over hun groei',
  'Handgeschreven notities, WhatsApp, losse Excel-sheets, of helemaal niks',
  'Na een coachinggesprek of training vergeten spelers binnen twee weken waar ze aan moesten werken. Coaches kunnen het niet bijhouden voor 20+ spelers. Het ontwikkelproces stopt steeds opnieuw.',
  ARRAY[
    'Bewuste groei — ontwikkeling begint bij stilstaan',
    'Eerlijkheid — zelfbeoordeling zonder opsmuk',
    'Continuïteit — elke sessie bouwt voort op de vorige',
    'Empowerment — de speler is eigenaar van zijn pad',
    'Eenvoud — geen overkill, gewoon doen'
  ],
  'Deco is de stille coach naast het veld. Niet schreeuwerig, niet hip. Direct, gestructureerd, en altijd beschikbaar. Deco praat niet óver de speler, maar mét de speler.',
  ARRAY[
    'Vier ontwikkeldimensies gebaseerd op sportpsychologie (technisch, tactisch, fysiek, mentaal)',
    'AI-analyse op gestelde doelen (kwaliteitsscore + feedback)',
    'Reflectie na elke training in <2 minuten',
    'Gamification die gedrag stimuleert (XP, streaks, achievements)',
    'Coachzicht: coach kan meekijken en feedback geven'
  ],
  'Deco is het enige hockeyspecifieke ontwikkelgeheugen dat zowel speler als coach dient, en de cirkel sluit van coachinggesprek → doelen stellen → trainen → reflecteren → nieuw gesprek.',
  '"Onthoud elk ontwikkelpunt."'
) ON CONFLICT (id) DO NOTHING;

-- Update updated_at automatically on any change
CREATE OR REPLACE FUNCTION deco.touch_brand_key()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER brand_key_updated_at
  BEFORE UPDATE ON deco.brand_key
  FOR EACH ROW EXECUTE FUNCTION deco.touch_brand_key();
