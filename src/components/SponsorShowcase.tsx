import { sponsors, type Sponsor } from '../content/sponsors'

function SponsorLogo({ sponsor, featured = false }: { sponsor: Sponsor; featured?: boolean }) {
  return (
    <div className={`sponsor-logo sponsor-logo--${sponsor.tone}${featured ? ' sponsor-logo--featured' : ''}`}>
      <img src={sponsor.image} alt={sponsor.name} loading="lazy" decoding="async" />
    </div>
  )
}

export function SponsorShowcase() {
  const silverSponsor = sponsors.find(sponsor => sponsor.tier === 'silver')
  const bronzeSponsors = sponsors.filter(sponsor => sponsor.tier === 'bronze')
  const cateringSponsor = sponsors.find(sponsor => sponsor.tier === 'catering')

  return (
    <section className="ticket-sponsors" aria-labelledby="ticket-sponsors-title" data-reveal>
      <header className="ticket-sponsors__heading">
        <p className="eyebrow">With thanks</p>
        <h3 id="ticket-sponsors-title">Proudly supported by our event sponsors.</h3>
      </header>

      {silverSponsor && (
        <div className="sponsor-tier sponsor-tier--silver">
          <p>Silver sponsor</p>
          <SponsorLogo sponsor={silverSponsor} featured />
        </div>
      )}

      <div className="ticket-sponsors__supporting">
        <div className="sponsor-tier sponsor-tier--bronze">
          <p>Bronze sponsors</p>
          <div className="sponsor-tier__grid">
            {bronzeSponsors.map(sponsor => <SponsorLogo key={sponsor.name} sponsor={sponsor} />)}
          </div>
        </div>

        {cateringSponsor && (
          <div className="sponsor-tier sponsor-tier--catering">
            <p>Catering sponsor</p>
            <SponsorLogo sponsor={cateringSponsor} />
          </div>
        )}
      </div>
    </section>
  )
}
