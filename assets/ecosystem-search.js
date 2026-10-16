export const searchWords = value => String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
// Equivalent spellings and common industry terms; never discard query words.
const groups=[['tokenized','tokenised'],['tokenization','tokenisation'],['treasury','treasuries'],['equity','equities','stock','stocks'],['property','properties'],['commodity','commodities'],['fund','funds'],['stablecoin','stablecoins'],['bond','bonds'],['loan','loans'],['collectible','collectibles'],['blockchain','blockchains'],['rwa','rwas']];
const synonyms=new Map(groups.flatMap(group=>group.map(word=>[word,group])));
export function matchesTerms(text,query) {
  const words=searchWords(text).split(' '),terms=searchWords(query).split(' ').filter(Boolean);
  return terms.every(term=>(synonyms.get(term)||[term]).some(t=>words.some(word=>word===t||(t.length>=3&&word.startsWith(t)))));
}
