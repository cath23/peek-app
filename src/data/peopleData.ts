import aliceJohnson from '@/assets/avatars/alice-johnson.png'
import amieMiles from '@/assets/avatars/amie-miles.png'
import danielStanton from '@/assets/avatars/daniel-stanton.png'
import gregBothman from '@/assets/avatars/greg-bothman.png'
import halliePratt from '@/assets/avatars/hallie-pratt.png'
import jakeWalter from '@/assets/avatars/jake-walter.png'
import juanFoley from '@/assets/avatars/juan-foley.png'
import zackBright from '@/assets/avatars/zack-bright.png'
import userAvatar from '@/assets/avatar.png'

export interface Person {
  id: string
  name: string
  role: string
  avatarSrc?: string
}

export const PEOPLE: Person[] = [
  { id: 'alice',  name: 'Alice Johnson',   role: 'Product Designer',     avatarSrc: aliceJohnson },
  { id: 'amie',   name: 'Amie Miles',      role: 'Engineering Manager',  avatarSrc: amieMiles },
  { id: 'daniel', name: 'Daniel Stanton',  role: 'Backend Engineer',     avatarSrc: danielStanton },
  { id: 'greg',   name: 'Greg Bothman',    role: 'Customer Success Lead', avatarSrc: gregBothman },
  { id: 'hallie', name: 'Hallie Pratt',    role: 'Product Marketing',    avatarSrc: halliePratt },
  { id: 'jake',   name: 'Jake Walter',     role: 'Software Engineer',    avatarSrc: jakeWalter },
  { id: 'juan',   name: 'Juan Foley',      role: 'Frontend Engineer',    avatarSrc: juanFoley },
  { id: 'zack',   name: 'Zack Bright',     role: 'Data Analyst',         avatarSrc: zackBright },
]

const AVATAR_BY_NAME: Record<string, string> = PEOPLE.reduce<Record<string, string>>((acc, p) => {
  if (p.avatarSrc) acc[p.name] = p.avatarSrc
  return acc
}, {})

// "You" resolves to the user's own avatar (the one shown in the app top bar),
// so messages authored by the current user are visually self-attributed.
AVATAR_BY_NAME['You'] = userAvatar

/** Look up the avatar URL for a given author name. Returns undefined for unknown names. */
export function avatarFor(name: string | undefined): string | undefined {
  if (!name) return undefined
  return AVATAR_BY_NAME[name]
}
