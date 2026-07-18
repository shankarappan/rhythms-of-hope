import type { Experience } from '../content/event'

export function ExperienceCard({ experience }: { experience: Experience }) {
  return (
    <article className={`experience-card experience-card--${experience.accent}`}>
      <div className="experience-card__top">
        <span>{experience.number}</span>
        <span className="experience-card__line" aria-hidden="true" />
      </div>
      <p className="experience-card__eyebrow">{experience.eyebrow}</p>
      <h3>{experience.title}</h3>
      <p>{experience.description}</p>
    </article>
  )
}
