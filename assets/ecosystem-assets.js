// Use explicit directory tags and specific imported classifications. Broad
// infrastructure sectors and passing mentions do not imply asset coverage.
export const assetClasses = [
  {id:'treasuries',label:'Treasuries & government debt',terms:['treasury','treasuries','government debt','government bonds','sovereign debt','t bills','tbills']},
  {id:'credit',label:'Credit & debt',terms:['credit','debt']},
  {id:'realestate',label:'Real estate',terms:['real estate','realestate','property','properties','housing']},
  {id:'equities',label:'Equities & stocks',terms:['equity','equities','stock','stocks','shares']},
  {id:'funds',label:'Funds',terms:['fund','funds']},
  {id:'commodities',label:'Commodities',terms:['commodity','commodities']},
  {id:'stablecoins',label:'Stablecoins',terms:['stablecoin','stablecoins','digital dollars']},
  {id:'environmental',label:'Environmental assets',terms:['environmental assets']},
  {id:'collectibles',label:'Collectibles',terms:['collectible','collectibles']}
];
const sourceClasses={Debt:'credit',Commodities:'commodities','Real Estate':'realestate',Funds:'funds',Equity:'equities','Environmental Assets':'environmental','Tokenized fund':'funds','Credit protocol (asset-backed)':'credit','Credit protocol (reputation-backed)':'credit','Trade financing':'credit','Cash advance':'credit','Stablecoin (RWA- or Fiat- backed)':'stablecoins'};
const categoryClasses={'Stablecoin Issuers':'stablecoins','Private credit':'credit','Trading cards and collectibles':'collectibles','Wine and alternative collectibles':'collectibles'};
export function assetsFor(profile) {
  const ids=new Set((profile.assets||[]).filter(id=>assetClasses.some(a=>a.id===id)));
  if(sourceClasses[profile.sourceCategory])ids.add(sourceClasses[profile.sourceCategory]);
  for(const c of profile.categories||[])if(categoryClasses[c.name])ids.add(categoryClasses[c.name]);
  return assetClasses.filter(a=>ids.has(a.id));
}
export function assetOptions(profiles) {
  const counts=new Map(assetClasses.map(a=>[a.id,0]));let unclassified=0;
  for(const p of profiles){const classes=assetsFor(p);if(!classes.length)unclassified++;for(const a of classes)counts.set(a.id,counts.get(a.id)+1);}
  return [...assetClasses.map(a=>({...a,count:counts.get(a.id)})),{id:'unclassified',label:'Not classified',count:unclassified}];
}
