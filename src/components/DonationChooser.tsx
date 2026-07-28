import { useState } from 'react'
import type { DonationProgram } from '../content/event'

type DonationSelection = DonationProgram['id'] | 'both' | null

type DonationChooserProps = {
  programs: DonationProgram[]
}

const ExternalArrow = () => <span aria-hidden="true">↗</span>

export function DonationChooser({ programs }: DonationChooserProps) {
  const [selection, setSelection] = useState<DonationSelection>(null)
  const selectedProgram = programs.find(program => program.id === selection)

  return (
    <section className="donate section" id="donate">
      <div className="donate__glow" aria-hidden="true" />
      <div className="donate__intro" data-reveal>
        <p className="eyebrow">Hope in action</p>
        <h2>Choose where your<br /><span>support can help.</span></h2>
        <p>
          Two separate programmes. One shared belief that people affected by cancer
          deserve care, connection and hope. Choose either programme, or support both.
        </p>
      </div>

      <div className="donation-chooser" data-reveal>
        <div className="donation-programs" role="group" aria-label="Choose a donation programme">
          {programs.map(program => {
            const isSelected = selection === program.id

            return (
              <div className={`donation-program-wrap donation-program-wrap--${program.accent}`} key={program.id}>
                <button
                  className={`donation-program donation-program--${program.accent}${isSelected ? ' is-selected' : ''}`}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelection(program.id)}
                >
                  <span className="donation-program__top">
                    <span>{program.number}</span>
                    <i aria-hidden="true" />
                    <span>{program.eyebrow}</span>
                  </span>
                  <strong>{program.title}</strong>
                  <span className="donation-program__description">{program.description}</span>
                  <span className="donation-program__recipient">
                    Donation received by <b>{program.recipient}</b>
                  </span>
                  <span className="donation-program__choose">
                    {isSelected ? 'Selected' : 'Choose this programme'}
                    <span aria-hidden="true">{isSelected ? '✓' : '→'}</span>
                  </span>
                </button>
                {isSelected && (
                  <a
                    className="donation-program__quick-action"
                    href={program.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {program.linkLabel} <ExternalArrow />
                  </a>
                )}
              </div>
            )
          })}
        </div>

        <button
          className={`donation-both${selection === 'both' ? ' is-selected' : ''}`}
          type="button"
          aria-pressed={selection === 'both'}
          onClick={() => setSelection('both')}
        >
          <span>
            <small>Want to share your support?</small>
            <strong>Give to both programmes</strong>
          </span>
          <span aria-hidden="true">{selection === 'both' ? '✓' : '→'}</span>
        </button>

        <div className={`donation-checkout${selection ? ' has-selection' : ''}`} aria-live="polite">
          {!selection && (
            <div className="donation-checkout__empty">
              <span aria-hidden="true">↑</span>
              <p><strong>Start by choosing a programme.</strong> We will show the correct secure donation link here.</p>
            </div>
          )}

          {selectedProgram && (
            <div className="donation-checkout__single">
              <div>
                <p className="donation-checkout__step">Your choice</p>
                <h3>{selectedProgram.title}</h3>
                <ul>
                  {selectedProgram.details.map(detail => <li key={detail}>{detail}</li>)}
                </ul>
              </div>
              <div className="donation-checkout__action">
                <a
                  className="button button--donate"
                  href={selectedProgram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {selectedProgram.linkLabel} <ExternalArrow />
                </a>
                <p>Secure checkout powered by {selectedProgram.provider}</p>
              </div>
            </div>
          )}

          {selection === 'both' && (
            <div className="donation-checkout__both">
              <div className="donation-checkout__both-intro">
                <p className="donation-checkout__step">Support both</p>
                <h3>Two gifts. Two secure checkouts.</h3>
                <p>Complete each step separately. You choose the amount for each programme.</p>
              </div>
              <div className="donation-steps">
                {programs.map((program, index) => (
                  <a
                    href={program.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`donation-step donation-step--${program.accent}`}
                    key={program.id}
                  >
                    <span>Step {index + 1}</span>
                    <strong>{program.linkLabel}</strong>
                    <small>{program.recipient} · {program.provider}</small>
                    <ExternalArrow />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="donation-disclosure" data-reveal>
        <p><strong>Good to know.</strong> These are separate donation programmes. A gift is not automatically split between them.</p>
        <p>Moksha Base makes no tax-deductibility claim. Receipt and tax information for the Blood Cancer NZ programme is provided on its external fundraising page.</p>
      </div>
    </section>
  )
}
