import Erkek1 from './Avatars/Erkek1.avif';
import Erkek2 from './Avatars/Erkek2.avif';
import Erkek3 from './Avatars/Erkek3.avif';
import Erkek4 from './Avatars/Erkek4.avif';
import Erkek5 from './Avatars/Erkek5.avif';
import Erkek6 from './Avatars/Erkek6.avif';
import Kadin1 from './Avatars/Kadın1.avif';
import Kadin2 from './Avatars/Kadın2.avif';
import Kadin3 from './Avatars/Kadın3.avif';
import Kadin4 from './Avatars/Kadın4.avif';
import Kadin5 from './Avatars/Kadın5.avif';
import Kadin6 from './Avatars/Kadın6.avif';

export const AVATARS = [
  { id: 'kadin1', gender: 'kadin', label: 'Kadın 1', src: Kadin1 },
  { id: 'kadin2', gender: 'kadin', label: 'Kadın 2', src: Kadin2 },
  { id: 'kadin3', gender: 'kadin', label: 'Kadın 3', src: Kadin3 },
  { id: 'kadin4', gender: 'kadin', label: 'Kadın 4', src: Kadin4 },
  { id: 'kadin5', gender: 'kadin', label: 'Kadın 5', src: Kadin5 },
  { id: 'kadin6', gender: 'kadin', label: 'Kadın 6', src: Kadin6 },
  { id: 'erkek1', gender: 'erkek', label: 'Erkek 1', src: Erkek1 },
  { id: 'erkek2', gender: 'erkek', label: 'Erkek 2', src: Erkek2 },
  { id: 'erkek3', gender: 'erkek', label: 'Erkek 3', src: Erkek3 },
  { id: 'erkek4', gender: 'erkek', label: 'Erkek 4', src: Erkek4 },
  { id: 'erkek5', gender: 'erkek', label: 'Erkek 5', src: Erkek5 },
  { id: 'erkek6', gender: 'erkek', label: 'Erkek 6', src: Erkek6 },
];

export const AVATAR_MAP = {
  kadin1: Kadin1,
  kadin2: Kadin2,
  kadin3: Kadin3,
  kadin4: Kadin4,
  kadin5: Kadin5,
  kadin6: Kadin6,
  erkek1: Erkek1,
  erkek2: Erkek2,
  erkek3: Erkek3,
  erkek4: Erkek4,
  erkek5: Erkek5,
  erkek6: Erkek6,
  // Alternative key mappings for safety (e.g. uppercase, turkish chars)
  'kadın1': Kadin1,
  'kadın2': Kadin2,
  'kadın3': Kadin3,
  'kadın4': Kadin4,
  'kadın5': Kadin5,
  'kadın6': Kadin6,
  'Erkek1': Erkek1,
  'Erkek2': Erkek2,
  'Erkek3': Erkek3,
  'Erkek4': Erkek4,
  'Erkek5': Erkek5,
  'Erkek6': Erkek6,
  'Kadın1': Kadin1,
  'Kadın2': Kadin2,
  'Kadın3': Kadin3,
  'Kadın4': Kadin4,
  'Kadın5': Kadin5,
  'Kadın6': Kadin6,
};

export function getAvatarSrc(avatarId) {
  if (!avatarId) return null;
  const normalized = String(avatarId).trim().toLowerCase();
  return AVATAR_MAP[normalized] || AVATAR_MAP[avatarId] || null;
}
