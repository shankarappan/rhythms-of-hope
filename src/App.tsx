import { useEffect, useState } from 'react'
import { ExperienceCard } from './components/ExperienceCard'
import { SectionHeading } from './components/SectionHeading'
import { StatusPill } from './components/StatusPill'
import { event, experiences, values } from './content/event'
import './styles.css'

const navItems = [
  ['The story', '#story'],
  ['Experience', '#experience'],
  ['Purpose', '#purpose'],
  ['Event info', '#details'],
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]')
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.12 },
    )
    elements.forEach(element => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Moksha Base — home">
          <img src="/moksha-logo.png" alt="" />
          <span>Moksha Base</span>
        </a>
        <button
          className="menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          onClick={() => setMenuOpen(open => !open)}
        >
          <span className="sr-only">Toggle menu</span>
          <i /><i />
        </button>
        <nav id="site-nav" className={menuOpen ? 'site-nav is-open' : 'site-nav'} aria-label="Main navigation">
          {navItems.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <a className="nav-cta" href={`mailto:${event.contactEmail}`}>Stay informed</a>
        </nav>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="hero__aurora" aria-hidden="true" />
          <div className="hero__poster" aria-hidden="true" />
          <div className="hero__content">
            <p className="hero__presenter">Moksha Base presents</p>
            <img className="hero__title" src="/hope-title.png" alt="Hope" />
            <p className="hero__kicker">Rhythms of Hope</p>
            <h1>{event.maoriName}</h1>
            <p className="hero__tagline">{event.tagline}</p>
            <p className="hero__intro">A community cancer-awareness event, book launch, shared conversation and live music experience.</p>
            <div className="hero__actions">
              <a className="button button--primary" href="#story">Discover the story <span aria-hidden="true">↓</span></a>
              <a className="button button--ghost" href={`mailto:${event.contactEmail}?subject=Rhythms%20of%20Hope%20updates`}>Get event updates</a>
            </div>
            <div className="hero__status">
              <StatusPill>{event.planningWindow}</StatusPill>
              <span>{event.locationStatus}</span>
            </div>
          </div>
          <div className="hero__side-copy" aria-hidden="true">Music • strength • together</div>
          <a className="scroll-cue" href="#story"><span>Explore</span><i /></a>
        </section>

        <section className="statement" aria-label="Event message">
          <p>We play.</p><p>We stand.</p><p className="text-gradient">We hope.</p>
        </section>

        <section className="story section" id="story">
          <div className="story__copy" data-reveal>
            <SectionHeading eyebrow="The heart of the event" title="One journey. A wider circle of hope." />
            <p className="story__lead">Earlier in 2026, Moksha Base band member, close friend and MC Sivakumar Sangameshwaran — Siva — was diagnosed with ALK-positive Anaplastic Large Cell Lymphoma.</p>
            <p>Through investigation, treatment and serious complications, Siva has continued to meet each chapter with humour, faith, courage and honesty. He is documenting that experience in a book — not only about cancer, but about the people, beliefs and communities that help carry us through difficult times.</p>
            <p>Rhythms of Hope grows from that deeply personal experience into something shared: a welcoming space for awareness, music, reflection and connection.</p>
          </div>
          <aside className="story__quote" data-reveal>
            <span className="quote-mark" aria-hidden="true">“</span>
            <blockquote>Every challenge became a chapter. Every chapter became a song. Every song became a message of hope.</blockquote>
            <p>— The spirit behind Rhythms of Hope</p>
          </aside>
        </section>

        <section className="experience section" id="experience">
          <div data-reveal>
            <SectionHeading
              eyebrow="A shared experience"
              title="More than a concert"
              body="Four connected moments are proposed to create space for learning, listening, conversation and joy."
            />
          </div>
          <div className="experience-grid" data-reveal>
            {experiences.map(experience => <ExperienceCard key={experience.number} experience={experience} />)}
          </div>
        </section>

        <section className="interlude" aria-label="Together, we hope">
          <div className="interlude__image" />
          <div className="interlude__veil" />
          <div className="interlude__content" data-reveal>
            <p>For every person</p>
            <h2>Together,<br /><span>we are stronger.</span></h2>
            <p className="interlude__body">No one should face cancer alone. We honour patients, survivors, families, caregivers, healthcare professionals and every person who chooses to walk alongside them.</p>
          </div>
        </section>

        <section className="purpose section" id="purpose">
          <div data-reveal>
            <SectionHeading eyebrow="Why we are gathering" title="Hope with purpose" body="An uplifting event with a serious intention: to strengthen awareness, connection and community support." />
          </div>
          <div className="values-grid" data-reveal>
            {values.map(([title, body], index) => (
              <article className="value" key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <p className="medical-note" data-reveal><strong>A thoughtful foundation.</strong> Public-facing medical and awareness content will be developed with guidance from appropriate healthcare or cancer-support organisations.</p>
        </section>

        <section className="details section" id="details">
          <div className="details__intro" data-reveal>
            <SectionHeading eyebrow="Event information" title="The journey is taking shape" body="Planning is underway. Dates, location, programme, speakers, tickets and book details will be shared after they are confirmed." />
            <a className="button button--primary" href={`mailto:${event.contactEmail}?subject=Keep%20me%20updated%20about%20Rhythms%20of%20Hope`}>Join the update list <span aria-hidden="true">↗</span></a>
          </div>
          <dl className="details-list" data-reveal>
            <div><dt>Timing</dt><dd>October 2026 <span>proposed</span></dd></div>
            <div><dt>Location</dt><dd>To be confirmed</dd></div>
            <div><dt>Audience</dt><dd>Open to the wider community</dd></div>
            <div><dt>Expected scale</dt><dd>150–300 people <span>subject to venue</span></dd></div>
          </dl>
        </section>

        <section className="collaborate section">
          <div className="collaborate__glow" aria-hidden="true" />
          <div className="collaborate__content" data-reveal>
            <p className="eyebrow">Community partnership</p>
            <h2>Help shape a meaningful, credible event.</h2>
            <p>Moksha Base welcomes conversations with organisations supporting cancer awareness, education, patient wellbeing, survivorship and community engagement.</p>
            <a className="button button--light" href={`mailto:${event.contactEmail}?subject=Rhythms%20of%20Hope%20collaboration`}>Start a conversation <span aria-hidden="true">↗</span></a>
          </div>
          <p className="collaborate__note">Partnership roles and programme contributors are still being confirmed.</p>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer__brand">
          <img src="/moksha-logo.png" alt="Moksha Base" />
          <p>Bringing people together through live music, cultural events and stories that strengthen connection.</p>
        </div>
        <div>
          <p className="footer__label">Event</p>
          <a href="#story">The story</a><a href="#experience">Experience</a><a href="#purpose">Purpose</a><a href="#details">Event info</a>
        </div>
        <div>
          <p className="footer__label">Contact</p>
          <p>{event.contactName}<br /><span>{event.contactRole}</span></p>
          <a href={`mailto:${event.contactEmail}`}>{event.contactEmail}</a>
        </div>
        <div className="footer__bottom">
          <p>© 2026 Moksha Base</p>
          <p>{event.maoriName} · {event.tagline}</p>
        </div>
      </footer>
    </>
  )
}

export default App
