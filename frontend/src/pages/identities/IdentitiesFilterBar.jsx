import React, { memo } from 'react';
import { FAMILIES_LIST } from './identitiesData';

export default memo(function IdentitiesFilterBar({
  searchQuery, setSearchQuery, filterFamily, setFilterFamily, getFamilyLabel, langCode, t
}) {
  return <div className="identities-toolbar">
    <div className="identities-search">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10.5" cy="10.5" r="7.5" /><path d="m16 16 5 5" /></svg>
      <input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
        placeholder={t('ui', 'identities_search_placeholder')} aria-label={t('ui', 'identities_search_placeholder')} />
    </div>
    <div className="identities-family-filters" role="group" aria-label={langCode === 'tr' ? 'Karakter ailesi' : 'Character family'}>
      {FAMILIES_LIST.map(family => <button key={family} type="button" aria-pressed={filterFamily === family} onClick={() => setFilterFamily(family)}>{getFamilyLabel(family)}</button>)}
    </div>
  </div>;
});
