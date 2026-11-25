import { Link } from '@tanstack/react-router'

import { displayHeading, footerLink, metaLabel } from './ui'

const regionLabels = ['Greater Portland', 'Southern Coast', 'Midcoast', 'Downeast & Acadia']
const kitchenLabels = ['Seafood', 'New American', 'Bakery', 'Wine bar']

const year = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap justify-between gap-x-12 gap-y-10">
          <div className="max-w-xs">
            <p className={displayHeading({ className: 'text-3xl text-white' })}>Maine Finds</p>
            <p className="mt-4 leading-relaxed text-white/55">
              A hand-kept guide to eating well in Maine. Independent, unsponsored, occasionally opinionated.
            </p>
          </div>

          <nav aria-label="Site">
            <p className={metaLabel({ className: 'text-white/40' })}>Site</p>
            <ul className="mt-4 space-y-3">
              <li><Link to="/" className={footerLink()}>All places</Link></li>
              <li><Link to="/" search={{ view: 'map' }} className={footerLink()}>The map</Link></li>
              <li><span className={footerLink()}>Dispatches</span></li>
            </ul>
          </nav>

          <nav aria-label="Regions">
            <p className={metaLabel({ className: 'text-white/40' })}>Regions</p>
            <ul className="mt-4 space-y-3">
              {regionLabels.map(label => (
                <li key={label}><span className={footerLink()}>{label}</span></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Kitchens">
            <p className={metaLabel({ className: 'text-white/40' })}>Kitchens</p>
            <ul className="mt-4 space-y-3">
              {kitchenLabels.map(label => (
                <li key={label}><span className={footerLink()}>{label}</span></li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-white/45">
          <p>
            ©
            {' '}
            {year}
            {' '}
            Maine Finds. Hours are best-guess — call ahead in shoulder season.
          </p>
          <p className="flex items-center gap-1.5">
            <span className={footerLink({ className: 'text-sm text-white/45' })}>Privacy</span>
            <span aria-hidden>·</span>
            <span className={footerLink({ className: 'text-sm text-white/45' })}>Contact</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
