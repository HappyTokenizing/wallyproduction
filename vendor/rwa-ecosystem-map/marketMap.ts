// RWA ecosystem directory. Curated from Ray's compiled
// dataset and verified expansion batches. Profile and logo metadata live in ecosystemProfiles.json.
// Edit here — this is a static reference module, not DB-backed.

export interface MapEntity { name: string; website: string; domain: string; notes: string | null; }
export interface MapCategory { category: string; entities: MapEntity[]; }
export interface MapSection { section: string; categories: MapCategory[]; }

export const MARKET_MAP: MapSection[] = [
  {
    "section": "Stablecoins",
    "categories": [
      {
        "category": "Stablecoin Issuers",
        "entities": [
          {
            "name": "Circle",
            "website": "https://www.circle.com",
            "domain": "circle.com",
            "notes": "USDC / EURC issuer. Also builds Arc L1."
          },
          {
            "name": "State of Wyoming",
            "website": "https://stabletoken.wyo.gov",
            "domain": "stabletoken.wyo.gov",
            "notes": "FRNT — first US state-issued stablecoin. Verify current domain."
          },
          {
            "name": "Frax",
            "website": "https://frax.com",
            "domain": "frax.com",
            "notes": "frxUSD. Also frax.finance — confirm which is canonical."
          },
          {
            "name": "Paxos",
            "website": "https://www.paxos.com",
            "domain": "paxos.com",
            "notes": "USDG / PYUSD / USDP issuer-of-record."
          },
          {
            "name": "Tether",
            "website": "https://tether.to",
            "domain": "tether.to",
            "notes": "USDT. Also XAUT (see Tokenization)."
          },
          {
            "name": "Sky",
            "website": "https://sky.money",
            "domain": "sky.money",
            "notes": "Formerly MakerDAO. USDS / DAI."
          },
          {
            "name": "Aave",
            "website": "https://aave.com",
            "domain": "aave.com",
            "notes": "GHO stablecoin. Also in Lending."
          },
          {
            "name": "World Liberty Financial",
            "website": "https://www.worldlibertyfinancial.com",
            "domain": "worldlibertyfinancial.com",
            "notes": "USD1."
          },
          {
            "name": "Ripple",
            "website": "https://ripple.com",
            "domain": "ripple.com",
            "notes": "RLUSD. Also in Tokenization + Blockchains."
          },
          {
            "name": "Agora",
            "website": "https://www.agora.finance",
            "domain": "agora.finance",
            "notes": "AUSD. Confirm .finance vs .xyz."
          },
          {
            "name": "Gemini",
            "website": "https://www.gemini.com",
            "domain": "gemini.com",
            "notes": "GUSD."
          },
          {
            "name": "Falcon Finance",
            "website": "https://falcon.finance",
            "domain": "falcon.finance",
            "notes": "USDf synthetic dollar."
          },
          {
            "name": "Resolv",
            "website": "https://resolv.xyz",
            "domain": "resolv.xyz",
            "notes": "USR delta-neutral stablecoin."
          },
          {
            "name": "Brale",
            "website": "https://brale.xyz",
            "domain": "brale.xyz",
            "notes": null
          },
          {
            "name": "Glo Dollar",
            "website": "https://www.glodollar.org/",
            "domain": "glodollar.org",
            "notes": null
          },
          {
            "name": "Anzen",
            "website": "https://anzen.finance/",
            "domain": "anzen.finance",
            "notes": null
          },
          {
            "name": "Azos Finance",
            "website": "https://www.azos.finance/",
            "domain": "azos.finance",
            "notes": null
          },
          {
            "name": "HomeCoin",
            "website": "https://www.homecoin.finance/",
            "domain": "homecoin.finance",
            "notes": null
          },
          {
            "name": "Chateau Capital",
            "website": "https://www.chateau.capital/",
            "domain": "chateau.capital",
            "notes": null
          },
          {
            "name": "Pi Protocol",
            "website": "https://www.stbl.com/",
            "domain": "stbl.com",
            "notes": null
          },
          {
            "name": "Tangible",
            "website": "https://www.tangible.store",
            "domain": "tangible.store",
            "notes": null
          },
          {
            "name": "IncomRWA",
            "website": "https://www.incomrwa.io/",
            "domain": "incomrwa.io",
            "notes": null
          },
          {
            "name": "Forte Tech Solution",
            "website": "https://www.forteaud.com/",
            "domain": "forteaud.com",
            "notes": null
          },
          {
            "name": "AUDC Pty Ltd",
            "website": "https://www.audd.digital/",
            "domain": "audd.digital",
            "notes": null
          },
          {
            "name": "Aegis DAO",
            "website": "https://aegis.im/",
            "domain": "aegis.im",
            "notes": null
          },
          {
            "name": "AllUnity GmbH",
            "website": "https://allunity.com/",
            "domain": "allunity.com",
            "notes": null
          },
          {
            "name": "Anchorage Digital Bank, N.A.",
            "website": "https://usat.io/",
            "domain": "usat.io",
            "notes": null
          },
          {
            "name": "Anzens Inc.",
            "website": "https://anzens.com/",
            "domain": "anzens.com",
            "notes": null
          },
          {
            "name": "Avant Technology Foundation",
            "website": "https://www.avantprotocol.com/",
            "domain": "avantprotocol.com",
            "notes": null
          },
          {
            "name": "BCP Technologies Ltd.",
            "website": "https://www.tokenisedgbp.com/",
            "domain": "tokenisedgbp.com",
            "notes": null
          },
          {
            "name": "Beanstalk",
            "website": "https://bean.money/",
            "domain": "bean.money",
            "notes": null
          },
          {
            "name": "BiLira",
            "website": "https://www.bilira.co/",
            "domain": "bilira.co",
            "notes": null
          },
          {
            "name": "Binance",
            "website": "https://www.binance.com/en",
            "domain": "binance.com",
            "notes": null
          },
          {
            "name": "Macropod / Catena Digital",
            "website": "https://www.macropod.com/",
            "domain": "macropod.com",
            "notes": null
          },
          {
            "name": "Colb Asset SA",
            "website": "https://www.colb.finance/",
            "domain": "colb.finance",
            "notes": null
          },
          {
            "name": "Cygnus Labs",
            "website": "https://www.cygnus.finance/",
            "domain": "cygnus.finance",
            "notes": null
          },
          {
            "name": "Elixir",
            "website": "https://www.elixir.xyz/",
            "domain": "elixir.xyz",
            "notes": null
          },
          {
            "name": "Etherfuse",
            "website": "https://etherfuse.com/",
            "domain": "etherfuse.com",
            "notes": null
          },
          {
            "name": "Fathom",
            "website": "https://fathom.fi/",
            "domain": "fathom.fi",
            "notes": null
          },
          {
            "name": "First Digital Labs / FDUSD",
            "website": "https://www.firstdigitallabs.com/",
            "domain": "firstdigitallabs.com",
            "notes": null
          },
          {
            "name": "GMO Trust",
            "website": "https://stablecoin.z.com/",
            "domain": "stablecoin.z.com",
            "notes": null
          },
          {
            "name": "Hutly",
            "website": "https://hutly.com/",
            "domain": "hutly.com",
            "notes": null
          },
          {
            "name": "ISC",
            "website": "https://isc.money/",
            "domain": "isc.money",
            "notes": null
          },
          {
            "name": "Moneta Digital LLC",
            "website": "https://moneta.global/",
            "domain": "moneta.global",
            "notes": null
          },
          {
            "name": "Native Markets",
            "website": "https://nativemarkets.com/",
            "domain": "nativemarkets.com",
            "notes": null
          },
          {
            "name": "Palm USD / Palm Azgar",
            "website": "https://www.palmusd.com/",
            "domain": "palmusd.com",
            "notes": null
          },
          {
            "name": "Paytrie AB Inc.",
            "website": "https://paytrie.com/",
            "domain": "paytrie.com",
            "notes": null
          },
          {
            "name": "Quantoz Payments B.V.",
            "website": "https://www.quantoz.com/",
            "domain": "quantoz.com",
            "notes": null
          },
          {
            "name": "RWA NOVA",
            "website": "https://rwanova.io/",
            "domain": "rwanova.io",
            "notes": null
          },
          {
            "name": "STBL",
            "website": "https://www.stbl.com/",
            "domain": "stbl.com",
            "notes": null
          },
          {
            "name": "Schuman Financial",
            "website": "https://schuman.io/",
            "domain": "schuman.io",
            "notes": null
          },
          {
            "name": "Solayer",
            "website": "https://solayer.org/",
            "domain": "solayer.org",
            "notes": null
          },
          {
            "name": "StandX Protocol",
            "website": "https://standx.com/",
            "domain": "standx.com",
            "notes": null
          },
          {
            "name": "Stasis",
            "website": "https://stasis.net/",
            "domain": "stasis.net",
            "notes": null
          },
          {
            "name": "StraitsX",
            "website": "https://www.straitsx.com/",
            "domain": "straitsx.com",
            "notes": null
          },
          {
            "name": "Synthetix Protocol",
            "website": "https://synthetix.io/",
            "domain": "synthetix.io",
            "notes": null
          },
          {
            "name": "TrueUSD / Techteryx",
            "website": "https://tusd.io/",
            "domain": "tusd.io",
            "notes": null
          },
          {
            "name": "TempleDAO",
            "website": "https://templedao.link/",
            "domain": "templedao.link",
            "notes": null
          },
          {
            "name": "Tezos Stable Technologies, Ltd.",
            "website": "https://usdtz.com/",
            "domain": "usdtz.com",
            "notes": null
          },
          {
            "name": "The Fedz",
            "website": "https://thefedz.org/",
            "domain": "thefedz.org",
            "notes": null
          },
          {
            "name": "Transfero Group",
            "website": "https://transfero.com/",
            "domain": "transfero.com",
            "notes": null
          },
          {
            "name": "USDD Protocol",
            "website": "https://usdd.io/",
            "domain": "usdd.io",
            "notes": null
          },
          {
            "name": "VNX",
            "website": "https://vnx.li/",
            "domain": "vnx.li",
            "notes": null
          },
          {
            "name": "WSPN Holding Limited",
            "website": "https://wspn.io/",
            "domain": "wspn.io",
            "notes": null
          },
          {
            "name": "XBANKING",
            "website": "https://xbanking.org/",
            "domain": "xbanking.org",
            "notes": null
          },
          {
            "name": "AuResources",
            "website": "https://auresources.io/",
            "domain": "auresources.io",
            "notes": null
          },
          {
            "name": "Quorium",
            "website": "https://quorium.io/",
            "domain": "quorium.io",
            "notes": null
          },
          {
            "name": "USDKG",
            "website": "https://www.usdkg.com/",
            "domain": "usdkg.com",
            "notes": null
          },
          {
            "name": "Asset List",
            "website": "https://assetlist.io/",
            "domain": "assetlist.io",
            "notes": null
          },
          {
            "name": "Hippo Protocol",
            "website": "https://hippoprotocol.ai/",
            "domain": "hippoprotocol.ai",
            "notes": null
          },
          {
            "name": "Stablestocks Lab Limited",
            "website": "https://www.stablestock.finance/",
            "domain": "stablestock.finance",
            "notes": null
          },
          {
            "name": "Cables Finance",
            "website": "https://www.cables.finance/",
            "domain": "cables.finance",
            "notes": null
          },
          {
            "name": "MultichainZ",
            "website": "https://multichainz.com/",
            "domain": "multichainz.com",
            "notes": null
          },
          {
            "name": "Nostra Finance",
            "website": "https://nostra.finance/",
            "domain": "nostra.finance",
            "notes": null
          }
        ]
      },
      {
        "category": "Stablecoin Builders",
        "entities": [
          {
            "name": "Klarna",
            "website": "https://www.klarna.com",
            "domain": "klarna.com",
            "notes": "KlarnaUSD, announced on Tempo."
          },
          {
            "name": "MetaMask",
            "website": "https://metamask.io",
            "domain": "metamask.io",
            "notes": "mUSD. Also in Wallets."
          },
          {
            "name": "Ethena",
            "website": "https://ethena.fi",
            "domain": "ethena.fi",
            "notes": "USDe / sUSDe. Collateral layer for OnRe."
          },
          {
            "name": "Jupiter",
            "website": "https://jup.ag",
            "domain": "jup.ag",
            "notes": "Solana DEX aggregator."
          },
          {
            "name": "USD.AI",
            "website": "https://usd.ai",
            "domain": "usd.ai",
            "notes": "GPU/compute-collateralized synthetic dollar. Built by Permian Labs. USDai + sUSDai."
          },
          {
            "name": "Neutrl",
            "website": "https://www.neutrl.finance/",
            "domain": "neutrl.finance",
            "notes": "NUSD. Confirm TLD."
          },
          {
            "name": "InfiniFi",
            "website": "https://infinifi.xyz",
            "domain": "infinifi.xyz",
            "notes": "iUSD. Confirm TLD — GitHub org is InfiniFi-Labs."
          },
          {
            "name": "Midas",
            "website": "https://midas.app",
            "domain": "midas.app",
            "notes": "Also in Tokenized Asset Issuers."
          },
          {
            "name": "Avalon",
            "website": "https://www.avalonfinance.xyz",
            "domain": "avalonfinance.xyz",
            "notes": "Avalon Labs — BTC-backed USDa. Confirm domain."
          },
          {
            "name": "PayPal",
            "website": "https://www.paypal.com",
            "domain": "paypal.com",
            "notes": "PYUSD. Also in Fintech."
          },
          {
            "name": "Western Union",
            "website": "https://www.westernunion.com",
            "domain": "westernunion.com",
            "notes": "USDPT, announced on Solana."
          },
          {
            "name": "Plume",
            "website": "https://plume.org",
            "domain": "plume.org",
            "notes": "pUSD. Also in Blockchains. Confirm plume.org vs plumenetwork.xyz."
          },
          {
            "name": "Reservoir",
            "website": "https://reservoir.xyz",
            "domain": "reservoir.xyz",
            "notes": "rUSD / srUSD / trUSD."
          },
          {
            "name": "Noble",
            "website": "https://www.noble.xyz",
            "domain": "noble.xyz",
            "notes": "Cosmos-native asset issuance. Also in Blockchains."
          },
          {
            "name": "USDT0",
            "website": "https://usdt0.to",
            "domain": "usdt0.to",
            "notes": "Omnichain USDT via LayerZero OFT."
          },
          {
            "name": "Phantom",
            "website": "https://phantom.com",
            "domain": "phantom.com",
            "notes": "CASH. Solana wallet."
          },
          {
            "name": "Usual",
            "website": "https://usual.money",
            "domain": "usual.money",
            "notes": "USD0 / USD0++."
          },
          {
            "name": "MoonPay",
            "website": "https://www.moonpay.com",
            "domain": "moonpay.com",
            "notes": "Also in Payments Infrastructure."
          },
          {
            "name": "Pearl Exchange",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Aryze",
            "website": "https://www.aryze.io/",
            "domain": "aryze.io",
            "notes": null
          },
          {
            "name": "Monerium",
            "website": "https://monerium.com/",
            "domain": "monerium.com",
            "notes": null
          }
        ]
      },
      {
        "category": "Payments Infrastructure",
        "entities": [
          {
            "name": "M0",
            "website": "https://m0.org",
            "domain": "m0.org",
            "notes": "Modular stablecoin issuance layer. Backs USD.AI."
          },
          {
            "name": "AEON",
            "website": "https://aeon.xyz",
            "domain": "aeon.xyz",
            "notes": "AEON Pay — emerging-markets crypto POS."
          },
          {
            "name": "Stripe",
            "website": "https://stripe.com",
            "domain": "stripe.com",
            "notes": "Owns Bridge; builds Tempo."
          },
          {
            "name": "Visa",
            "website": "https://www.visa.com",
            "domain": "visa.com",
            "notes": null
          },
          {
            "name": "Mastercard",
            "website": "https://www.mastercard.com",
            "domain": "mastercard.com",
            "notes": null
          },
          {
            "name": "Gnosis Pay",
            "website": "https://gnosispay.com",
            "domain": "gnosispay.com",
            "notes": "Self-custodial Visa debit in EEA/UK."
          },
          {
            "name": "Ready",
            "website": "https://ready.co",
            "domain": "ready.co",
            "notes": "Confirm — generic name, high collision risk."
          },
          {
            "name": "Holyheld",
            "website": "https://holyheld.com",
            "domain": "holyheld.com",
            "notes": "Wallets + stablecoins + cards in one app."
          },
          {
            "name": "Exa",
            "website": "https://exa.app",
            "domain": "exa.app",
            "notes": "Exa App — onchain credit/debit card."
          },
          {
            "name": "Rain",
            "website": "https://www.rain.xyz",
            "domain": "rain.xyz",
            "notes": "Card issuing infra. Powers Tuyo's Visa card."
          },
          {
            "name": "MoonPay",
            "website": "https://www.moonpay.com",
            "domain": "moonpay.com",
            "notes": "Duplicate — also in Stablecoin Builders."
          },
          {
            "name": "Coinme",
            "website": "https://coinme.com",
            "domain": "coinme.com",
            "notes": "US cash-to-crypto network."
          },
          {
            "name": "BVNK",
            "website": "https://www.bvnk.com",
            "domain": "bvnk.com",
            "notes": "Stablecoin payment rails for enterprises."
          },
          {
            "name": "Conduit",
            "website": "https://conduitpay.com",
            "domain": "conduitpay.com",
            "notes": "Cross-border B2B stablecoin payments."
          },
          {
            "name": "Bridge",
            "website": "https://www.bridge.xyz",
            "domain": "bridge.xyz",
            "notes": "Acquired by Stripe for $1.1B. Powers KAST accounts."
          },
          {
            "name": "Eco",
            "website": "https://eco.com",
            "domain": "eco.com",
            "notes": "Eco Routes — stablecoin transport API."
          },
          {
            "name": "Relay",
            "website": "https://relay.link",
            "domain": "relay.link",
            "notes": "Cross-chain bridging/payments."
          },
          {
            "name": "Halliday",
            "website": "https://halliday.xyz",
            "domain": "halliday.xyz",
            "notes": "Workflow/orchestration infra."
          },
          {
            "name": "OpenFX",
            "website": "https://www.openfx.com",
            "domain": "openfx.com",
            "notes": "24/7 cross-border FX. Raised $94M Series A."
          },
          {
            "name": "Zerohash",
            "website": "https://zerohash.com",
            "domain": "zerohash.com",
            "notes": "Regulated crypto/stablecoin infrastructure."
          },
          {
            "name": "HIFI",
            "website": "https://www.hifi.com",
            "domain": "hifi.com",
            "notes": "One API for fiat + stablecoin payments. NOT Hifi Finance (lending)."
          },
          {
            "name": "AlphaPoint",
            "website": "https://alphapoint.com/",
            "domain": "alphapoint.com",
            "notes": null
          },
          {
            "name": "Fnality",
            "website": "https://fnality.com/",
            "domain": "fnality.com",
            "notes": null
          },
          {
            "name": "Arf",
            "website": "https://arf.one/",
            "domain": "arf.one",
            "notes": null
          },
          {
            "name": "Everest",
            "website": "https://everest.org/",
            "domain": "everest.org",
            "notes": null
          },
          {
            "name": "Tassat",
            "website": "https://tassat.com/",
            "domain": "tassat.com",
            "notes": null
          },
          {
            "name": "Credible",
            "website": "https://credible.finance/",
            "domain": "credible.finance",
            "notes": null
          },
          {
            "name": "MANSA",
            "website": "https://mansa.xyz/",
            "domain": "mansa.xyz",
            "notes": null
          },
          {
            "name": "Farmsent",
            "website": "https://www.farmsent.io/",
            "domain": "farmsent.io",
            "notes": null
          },
          {
            "name": "tokenforge",
            "website": "https://www.tokenforge.io/",
            "domain": "tokenforge.io",
            "notes": null
          },
          {
            "name": "CapitalCustodyTrust",
            "website": "https://capitalcustodytrust.com/",
            "domain": "capitalcustodytrust.com",
            "notes": null
          }
        ]
      }
    ]
  },
  {
    "section": "Tokenization",
    "categories": [
      {
        "category": "Tokenization Platforms",
        "entities": [
          {
            "name": "Figure",
            "website": "https://www.figure.com",
            "domain": "figure.com",
            "notes": "Also figuremarkets.com and ylds.com. Issues YLDS."
          },
          {
            "name": "Ondo",
            "website": "https://ondo.finance",
            "domain": "ondo.finance",
            "notes": "Also in Asset Issuers + Blockchains."
          },
          {
            "name": "Canton",
            "website": "https://www.canton.network",
            "domain": "canton.network",
            "notes": "Also in Blockchains. Privacy-first institutional chain."
          },
          {
            "name": "Paxos",
            "website": "https://www.paxos.com",
            "domain": "paxos.com",
            "notes": "Duplicate — also Stablecoin Issuers."
          },
          {
            "name": "Nest",
            "website": "https://nest.credit",
            "domain": "nest.credit",
            "notes": "Nest Credit — Plume's RWA vault platform."
          },
          {
            "name": "Superstate",
            "website": "https://superstate.com",
            "domain": "superstate.com",
            "notes": "Also in Asset Issuers. USTB / USCC / Opening Bell."
          },
          {
            "name": "Theo",
            "website": "https://theo.xyz",
            "domain": "theo.xyz",
            "notes": "Beyond issuance' — liquidity + market making + distribution."
          },
          {
            "name": "Grove",
            "website": "https://www.grove.finance",
            "domain": "grove.finance",
            "notes": "Sky ecosystem credit Star. ~$2.6B TVL."
          },
          {
            "name": "Centrifuge",
            "website": "https://centrifuge.io",
            "domain": "centrifuge.io",
            "notes": "Centrifuge Whitelabel. Parent of Anemoy."
          },
          {
            "name": "Dinari",
            "website": "https://dinari.com",
            "domain": "dinari.com",
            "notes": "dShares — tokenized equities."
          },
          {
            "name": "Securitize",
            "website": "https://securitize.io",
            "domain": "securitize.io",
            "notes": "Also in Asset Issuers. Issues BUIDL."
          },
          {
            "name": "Ripple",
            "website": "https://ripple.com",
            "domain": "ripple.com",
            "notes": "Duplicate — 3rd appearance."
          },
          {
            "name": "Tether (XAUT)",
            "website": "https://gold.tether.to",
            "domain": "gold.tether.to",
            "notes": "Tokenized gold."
          },
          {
            "name": "Daylight",
            "website": "https://daylight.energy",
            "domain": "daylight.energy",
            "notes": "Distributed energy RWA. First Centrifuge Whitelabel client. $75M led by Framework."
          },
          {
            "name": "Galaxy Digital",
            "website": "https://www.galaxy.com",
            "domain": "galaxy.com",
            "notes": "Also runs GalaxyOne (Neobanks)."
          },
          {
            "name": "21X",
            "website": "https://21x.eu/",
            "domain": "21x.eu",
            "notes": null
          },
          {
            "name": "ADDX",
            "website": "https://www.addx.co/en/",
            "domain": "addx.co",
            "notes": null
          },
          {
            "name": "Justoken",
            "website": "https://www.justoken.com/",
            "domain": "justoken.com",
            "notes": null
          },
          {
            "name": "Allfunds Blockchain",
            "website": "https://allfunds.com/en/",
            "domain": "allfunds.com",
            "notes": null
          },
          {
            "name": "Alphaledger",
            "website": "https://www.alphaledger.com",
            "domain": "alphaledger.com",
            "notes": null
          },
          {
            "name": "Archax",
            "website": "https://www.archax.com",
            "domain": "archax.com",
            "notes": null
          },
          {
            "name": "Bitbond",
            "website": "https://www.bitbond.com",
            "domain": "bitbond.com",
            "notes": null
          },
          {
            "name": "Blocksquare",
            "website": "https://blocksquare.io/",
            "domain": "blocksquare.io",
            "notes": null
          },
          {
            "name": "BondbloX",
            "website": "https://bondblox.com/",
            "domain": "bondblox.com",
            "notes": null
          },
          {
            "name": "Boson",
            "website": "https://www.bosonprotocol.io/",
            "domain": "bosonprotocol.io",
            "notes": null
          },
          {
            "name": "Brickken",
            "website": "https://www.brickken.com",
            "domain": "brickken.com",
            "notes": null
          },
          {
            "name": "Broadridge",
            "website": "https://www.broadridge.com/capability/middle-and-back-office-solutions/post-trade-processing/distributed-ledger-repo-solutions",
            "domain": "broadridge.com",
            "notes": null
          },
          {
            "name": "Calastone",
            "website": "https://www.calastone.com/",
            "domain": "calastone.com",
            "notes": null
          },
          {
            "name": "Cashlink",
            "website": "https://cashlink.de/de/",
            "domain": "cashlink.de",
            "notes": null
          },
          {
            "name": "Chintai",
            "website": "https://chintai.io/",
            "domain": "chintai.io",
            "notes": null
          },
          {
            "name": "Fairmint",
            "website": "https://www.fairmint.com/",
            "domain": "fairmint.com",
            "notes": null
          },
          {
            "name": "HQLAx",
            "website": "https://www.hqla-x.com/",
            "domain": "hqla-x.com",
            "notes": null
          },
          {
            "name": "InvestaX",
            "website": "https://investax.io/",
            "domain": "investax.io",
            "notes": null
          },
          {
            "name": "INX",
            "website": "https://www.inx.co",
            "domain": "inx.co",
            "notes": null
          },
          {
            "name": "Mt Pelerin",
            "website": "https://www.mtpelerin.com",
            "domain": "mtpelerin.com",
            "notes": null
          },
          {
            "name": "NYALA",
            "website": "https://www.nyala.de/en",
            "domain": "nyala.de",
            "notes": null
          },
          {
            "name": "SDAX",
            "website": "https://www.sdax.co/",
            "domain": "sdax.co",
            "notes": null
          },
          {
            "name": "STOKR",
            "website": "https://stokr.io/",
            "domain": "stokr.io",
            "notes": null
          },
          {
            "name": "Tokeny",
            "website": "https://tokeny.com/",
            "domain": "tokeny.com",
            "notes": null
          },
          {
            "name": "Tokensoft",
            "website": "https://tokensoft.com/",
            "domain": "tokensoft.com",
            "notes": null
          },
          {
            "name": "Vertalo",
            "website": "https://www.vertalo.com",
            "domain": "vertalo.com",
            "notes": null
          },
          {
            "name": "Stobox",
            "website": "https://www.stobox.io/",
            "domain": "stobox.io",
            "notes": null
          },
          {
            "name": "tZERO",
            "website": "https://www.tzero.com",
            "domain": "tzero.com",
            "notes": null
          },
          {
            "name": "Propy",
            "website": "https://propy.com/home/",
            "domain": "propy.com",
            "notes": null
          },
          {
            "name": "10XTS",
            "website": "https://10xts.com/",
            "domain": "10xts.com",
            "notes": null
          },
          {
            "name": "360X",
            "website": "https://www.360x.com",
            "domain": "360x.com",
            "notes": null
          },
          {
            "name": "AgriDex",
            "website": "https://agridex.com/",
            "domain": "agridex.com",
            "notes": null
          },
          {
            "name": "AKRU",
            "website": "https://www.akru.com",
            "domain": "akru.com",
            "notes": null
          },
          {
            "name": "Aktionariat",
            "website": "https://www.aktionariat.com",
            "domain": "aktionariat.com",
            "notes": null
          },
          {
            "name": "Allo",
            "website": "https://allo.xyz/",
            "domain": "allo.xyz",
            "notes": null
          },
          {
            "name": "Alta",
            "website": "https://alta.exchange/",
            "domain": "alta.exchange",
            "notes": null
          },
          {
            "name": "Assetera",
            "website": "https://www.assetera.com",
            "domain": "assetera.com",
            "notes": null
          },
          {
            "name": "Black Manta",
            "website": "https://blackmanta.capital/",
            "domain": "blackmanta.capital",
            "notes": null
          },
          {
            "name": "BlockApps",
            "website": "https://blockapps.net/",
            "domain": "blockapps.net",
            "notes": null
          },
          {
            "name": "Carbonmark",
            "website": "https://www.carbonmark.com",
            "domain": "carbonmark.com",
            "notes": null
          },
          {
            "name": "DigiShares",
            "website": "https://digishares.io/",
            "domain": "digishares.io",
            "notes": null
          },
          {
            "name": "ELYSIA",
            "website": "https://www.elysia.land",
            "domain": "elysia.land",
            "notes": null
          },
          {
            "name": "Fabrica",
            "website": "https://fabrica.land/",
            "domain": "fabrica.land",
            "notes": null
          },
          {
            "name": "Apex Group",
            "website": "https://www.apexgroup.com/",
            "domain": "apexgroup.com",
            "notes": null
          },
          {
            "name": "Goldman Sachs",
            "website": "https://www.goldmansachs.com/",
            "domain": "goldmansachs.com",
            "notes": null
          },
          {
            "name": "Hydra X",
            "website": "https://www.hydrax.io/",
            "domain": "hydrax.io",
            "notes": null
          },
          {
            "name": "Intain",
            "website": "https://intainft.com/",
            "domain": "intainft.com",
            "notes": null
          },
          {
            "name": "Inveniam",
            "website": "https://www.inveniam.io",
            "domain": "inveniam.io",
            "notes": null
          },
          {
            "name": "IXS",
            "website": "https://www.ixs.finance/",
            "domain": "ixs.finance",
            "notes": null
          },
          {
            "name": "Libeara",
            "website": "https://libeara.com/",
            "domain": "libeara.com",
            "notes": null
          },
          {
            "name": "KAIO",
            "website": "https://kaio.xyz/",
            "domain": "kaio.xyz",
            "notes": null
          },
          {
            "name": "Mattereum",
            "website": "https://mattereum.com/",
            "domain": "mattereum.com",
            "notes": null
          },
          {
            "name": "Obligate",
            "website": "https://www.obligate.com",
            "domain": "obligate.com",
            "notes": null
          },
          {
            "name": "Ownera",
            "website": "https://www.ownera.io",
            "domain": "ownera.io",
            "notes": null
          },
          {
            "name": "Untangled",
            "website": "https://untangled.finance/",
            "domain": "untangled.finance",
            "notes": null
          },
          {
            "name": "Arkreen",
            "website": "https://www.arkreen.com/",
            "domain": "arkreen.com",
            "notes": null
          },
          {
            "name": "BSOS",
            "website": "https://www.bsos.co",
            "domain": "bsos.co",
            "notes": null
          },
          {
            "name": "Deal Box",
            "website": "https://dealbox.io",
            "domain": "dealbox.io",
            "notes": null
          },
          {
            "name": "EY",
            "website": "https://blockchain.ey.com/",
            "domain": "blockchain.ey.com",
            "notes": null
          },
          {
            "name": "Société Générale-FORGE",
            "website": "https://www.sgforge.com/",
            "domain": "sgforge.com",
            "notes": null
          },
          {
            "name": "Fusang",
            "website": "https://www.fusang.co",
            "domain": "fusang.co",
            "notes": null
          },
          {
            "name": "Galileo Protocol",
            "website": "https://www.galileoprotocol.io",
            "domain": "galileoprotocol.io",
            "notes": null
          },
          {
            "name": "Hamsa",
            "website": "https://www.hamsa.com",
            "domain": "hamsa.com",
            "notes": null
          },
          {
            "name": "Instruxi",
            "website": "https://www.instruxi.io/",
            "domain": "instruxi.io",
            "notes": null
          },
          {
            "name": "J.P. Morgan / Kinexys",
            "website": "https://www.jpmorgan.com/kinexys/index",
            "domain": "jpmorgan.com",
            "notes": null
          },
          {
            "name": "Klima Protocol",
            "website": "https://www.klimaprotocol.com/",
            "domain": "klimaprotocol.com",
            "notes": null
          },
          {
            "name": "Open Forest Protocol",
            "website": "https://www.openforestprotocol.org/",
            "domain": "openforestprotocol.org",
            "notes": null
          },
          {
            "name": "ORIGYN",
            "website": "https://www.origyn.com/en/",
            "domain": "origyn.com",
            "notes": null
          },
          {
            "name": "Regen Network",
            "website": "https://www.regen.network/",
            "domain": "regen.network",
            "notes": null
          },
          {
            "name": "Toucan Protocol",
            "website": "https://toucan.earth/",
            "domain": "toucan.earth",
            "notes": null
          },
          {
            "name": "Nexera",
            "website": "https://www.nexera.network/",
            "domain": "nexera.network",
            "notes": null
          },
          {
            "name": "Balcony",
            "website": "https://balcony.technology/",
            "domain": "balcony.technology",
            "notes": null
          },
          {
            "name": "Enor",
            "website": "https://enorsecurities.com/",
            "domain": "enorsecurities.com",
            "notes": null
          },
          {
            "name": "Entoro",
            "website": "https://www.entoro.com",
            "domain": "entoro.com",
            "notes": null
          },
          {
            "name": "Estate Protocol",
            "website": "https://www.estateprotocol.com/",
            "domain": "estateprotocol.com",
            "notes": null
          },
          {
            "name": "EstateX",
            "website": "https://estatex.eu/",
            "domain": "estatex.eu",
            "notes": null
          },
          {
            "name": "LF Decentralized Trust",
            "website": "https://www.lfdecentralizedtrust.org/",
            "domain": "lfdecentralizedtrust.org",
            "notes": null
          },
          {
            "name": "Kula",
            "website": "https://www.kula.com/",
            "domain": "kula.com",
            "notes": null
          },
          {
            "name": "Libertum",
            "website": "https://www.libertum.io/en/",
            "domain": "libertum.io",
            "notes": null
          },
          {
            "name": "Lympid",
            "website": "https://www.lympid.io/tokenization-as-a-service",
            "domain": "lympid.io",
            "notes": null
          },
          {
            "name": "Oasis Pro",
            "website": "https://www.oasispromarkets.com",
            "domain": "oasispromarkets.com",
            "notes": null
          },
          {
            "name": "Polymath",
            "website": "https://www.polymath.network",
            "domain": "polymath.network",
            "notes": null
          },
          {
            "name": "DTCC",
            "website": "https://www.dtcc.com/digital-assets",
            "domain": "dtcc.com",
            "notes": null
          },
          {
            "name": "tradias",
            "website": "https://www.tradias.de",
            "domain": "tradias.de",
            "notes": null
          },
          {
            "name": "DeStore",
            "website": "https://www.destore.network/",
            "domain": "destore.network",
            "notes": null
          },
          {
            "name": "Edel",
            "website": "https://www.edel.finance/",
            "domain": "edel.finance",
            "notes": null
          },
          {
            "name": "HELIX",
            "website": "https://www.helixfi.io/",
            "domain": "helixfi.io",
            "notes": null
          },
          {
            "name": "Homebase",
            "website": "https://www.homebasedao.io/",
            "domain": "homebasedao.io",
            "notes": null
          },
          {
            "name": "HouseAfrica",
            "website": "https://houseafrica.io/",
            "domain": "houseafrica.io",
            "notes": null
          },
          {
            "name": "Ink Finance",
            "website": "https://www.inkfinance.xyz/",
            "domain": "inkfinance.xyz",
            "notes": null
          },
          {
            "name": "LAIQON Token",
            "website": "https://www.laiqon-token.com",
            "domain": "laiqon-token.com",
            "notes": null
          },
          {
            "name": "ONINO",
            "website": "https://onino.io/",
            "domain": "onino.io",
            "notes": null
          },
          {
            "name": "Plastiks",
            "website": "https://plastiks.io/",
            "domain": "plastiks.io",
            "notes": null
          },
          {
            "name": "RealtyX",
            "website": "https://realtyx.co/",
            "domain": "realtyx.co",
            "notes": null
          },
          {
            "name": "RealX",
            "website": "https://www.realx.in/",
            "domain": "realx.in",
            "notes": null
          },
          {
            "name": "Scintilla Network",
            "website": "https://scintillanetwork.com/",
            "domain": "scintillanetwork.com",
            "notes": null
          },
          {
            "name": "Spydra",
            "website": "https://www.spydra.app",
            "domain": "spydra.app",
            "notes": null
          },
          {
            "name": "Texture Capital",
            "website": "https://www.texture.capital/",
            "domain": "texture.capital",
            "notes": null
          },
          {
            "name": "T-RIZE",
            "website": "https://www.t-rize.io/",
            "domain": "t-rize.io",
            "notes": null
          },
          {
            "name": "CitaDAO",
            "website": "https://citadao.io/",
            "domain": "citadao.io",
            "notes": null
          },
          {
            "name": "ATYUM",
            "website": "https://atyum.com/en",
            "domain": "atyum.com",
            "notes": null
          },
          {
            "name": "BlockRidge",
            "website": "https://blockridge.com/",
            "domain": "blockridge.com",
            "notes": null
          },
          {
            "name": "Cask Capital",
            "website": "https://www.caskcapital.io/",
            "domain": "caskcapital.io",
            "notes": null
          },
          {
            "name": "EBRIC / Likwid Asset",
            "website": "https://www.likwidasset.com/",
            "domain": "likwidasset.com",
            "notes": null
          },
          {
            "name": "Etherland",
            "website": "https://etherland.tech/",
            "domain": "etherland.tech",
            "notes": null
          },
          {
            "name": "Frac",
            "website": "https://frac.io/?unit=3",
            "domain": "frac.io",
            "notes": null
          },
          {
            "name": "GramChain",
            "website": "https://www.gramchain.com/",
            "domain": "gramchain.com",
            "notes": null
          },
          {
            "name": "MarsBase",
            "website": "https://marsbase.xyz/",
            "domain": "marsbase.xyz",
            "notes": null
          },
          {
            "name": "NASDEX",
            "website": "https://www.nasdex.xyz/",
            "domain": "nasdex.xyz",
            "notes": null
          },
          {
            "name": "Orderbook.io",
            "website": "https://www.orderbook.io/",
            "domain": "orderbook.io",
            "notes": null
          },
          {
            "name": "Relevantz",
            "website": "https://blockchain.relevantz.com/",
            "domain": "blockchain.relevantz.com",
            "notes": null
          },
          {
            "name": "Tectrex",
            "website": "https://www.tectrex.com/",
            "domain": "tectrex.com",
            "notes": null
          },
          {
            "name": "Toto Finance",
            "website": "https://totofinance.co/",
            "domain": "totofinance.co",
            "notes": null
          },
          {
            "name": "Transfer Agent Protocol",
            "website": "https://transferagentprotocol.xyz/",
            "domain": "transferagentprotocol.xyz",
            "notes": null
          },
          {
            "name": "WIWIN",
            "website": "https://wiwin.de/",
            "domain": "wiwin.de",
            "notes": null
          },
          {
            "name": "YieldBricks",
            "website": "https://yieldbricks.com/",
            "domain": "yieldbricks.com",
            "notes": null
          },
          {
            "name": "Blockpeer",
            "website": "https://www.blockpeer.finance/",
            "domain": "blockpeer.finance",
            "notes": null
          },
          {
            "name": "Cheersland",
            "website": "https://cheersland.org/",
            "domain": "cheersland.org",
            "notes": null
          },
          {
            "name": "Republic Note",
            "website": "https://republic.com/note",
            "domain": "republic.com",
            "notes": null
          },
          {
            "name": "Swarm",
            "website": "https://app.swarm.markets/",
            "domain": "app.swarm.markets",
            "notes": null
          },
          {
            "name": "Allocations",
            "website": "https://www.allocations.com/",
            "domain": "allocations.com",
            "notes": null
          },
          {
            "name": "AmerX",
            "website": "https://www.amerx.com/",
            "domain": "amerx.com",
            "notes": null
          },
          {
            "name": "Artory",
            "website": "https://www.wag-art.com/",
            "domain": "wag-art.com",
            "notes": null
          },
          {
            "name": "Axalio",
            "website": "https://www.axalio.com/",
            "domain": "axalio.com",
            "notes": null
          },
          {
            "name": "Bitgreen",
            "website": "https://bitgreen.org/",
            "domain": "bitgreen.org",
            "notes": null
          },
          {
            "name": "Danogo",
            "website": "https://v2.dano.finance/",
            "domain": "v2.dano.finance",
            "notes": null
          },
          {
            "name": "Flowcarbon",
            "website": "https://www.flowcarbon.com",
            "domain": "flowcarbon.com",
            "notes": null
          },
          {
            "name": "HADCO",
            "website": "https://www.hadco.xyz/",
            "domain": "hadco.xyz",
            "notes": null
          },
          {
            "name": "Hauck Aufhäuser Lampe",
            "website": "https://www.bethmann-hal.de/de/index.html",
            "domain": "bethmann-hal.de",
            "notes": null
          },
          {
            "name": "Maxos",
            "website": "https://www.maxos.finance",
            "domain": "maxos.finance",
            "notes": null
          },
          {
            "name": "MontanaLand SlowDAO",
            "website": "https://montanaland.slowdao.xyz/",
            "domain": "montanaland.slowdao.xyz",
            "notes": null
          },
          {
            "name": "Roofstock onChain",
            "website": "https://onchain.roofstock.com/",
            "domain": "onchain.roofstock.com",
            "notes": null
          },
          {
            "name": "RWA Finance",
            "website": "https://www.rwa-finance.com/",
            "domain": "rwa-finance.com",
            "notes": null
          },
          {
            "name": "Beel (formerly Tokenize.it)",
            "website": "https://beel.com/de",
            "domain": "beel.com",
            "notes": null
          },
          {
            "name": "Tokenstreet",
            "website": "https://tokenstreet.com/",
            "domain": "tokenstreet.com",
            "notes": null
          },
          {
            "name": "Barter",
            "website": "https://barter.company/",
            "domain": "barter.company",
            "notes": null
          },
          {
            "name": "Carnomaly",
            "website": "https://carnomaly.io/",
            "domain": "carnomaly.io",
            "notes": null
          },
          {
            "name": "Chirp",
            "website": "https://chirptoken.io/",
            "domain": "chirptoken.io",
            "notes": null
          },
          {
            "name": "Collaterize",
            "website": "https://collaterize.com/",
            "domain": "collaterize.com",
            "notes": null
          },
          {
            "name": "Consensys",
            "website": "https://consensys.io/",
            "domain": "consensys.io",
            "notes": null
          },
          {
            "name": "Dimitra",
            "website": "https://dimitra.io/",
            "domain": "dimitra.io",
            "notes": null
          },
          {
            "name": "E Money Network",
            "website": "https://emoney.io/",
            "domain": "emoney.io",
            "notes": null
          },
          {
            "name": "Enzyme",
            "website": "https://enzyme.finance/",
            "domain": "enzyme.finance",
            "notes": null
          },
          {
            "name": "HiYield",
            "website": "https://www.hiyield.xyz/",
            "domain": "hiyield.xyz",
            "notes": null
          },
          {
            "name": "IXO",
            "website": "https://www.ixo.world/",
            "domain": "ixo.world",
            "notes": null
          },
          {
            "name": "Liquidise",
            "website": "https://uae.liquidise.com/",
            "domain": "uae.liquidise.com",
            "notes": null
          },
          {
            "name": "Liqvid Protocol",
            "website": "https://liqvid.xyz/",
            "domain": "liqvid.xyz",
            "notes": null
          },
          {
            "name": "MBD Financials",
            "website": "https://mbdfinancials.com/",
            "domain": "mbdfinancials.com",
            "notes": null
          },
          {
            "name": "Meupass",
            "website": "https://token.meupass.com/",
            "domain": "token.meupass.com",
            "notes": null
          },
          {
            "name": "Mimo",
            "website": "https://www.mimo.capital/",
            "domain": "mimo.capital",
            "notes": null
          },
          {
            "name": "Moongate",
            "website": "https://app.moongate.id/",
            "domain": "app.moongate.id",
            "notes": null
          },
          {
            "name": "OriginTrail",
            "website": "https://origintrail.io/",
            "domain": "origintrail.io",
            "notes": null
          },
          {
            "name": "QMC",
            "website": "https://qmc.finance/",
            "domain": "qmc.finance",
            "notes": null
          },
          {
            "name": "Quant",
            "website": "https://quant.network/",
            "domain": "quant.network",
            "notes": null
          },
          {
            "name": "RWA Inc",
            "website": "https://rwa.inc/",
            "domain": "rwa.inc",
            "notes": null
          },
          {
            "name": "Raze",
            "website": "https://www.raze.finance/",
            "domain": "raze.finance",
            "notes": null
          },
          {
            "name": "Revest Finance",
            "website": "https://revest.finance/",
            "domain": "revest.finance",
            "notes": null
          },
          {
            "name": "StrikeX",
            "website": "https://strikex.com/",
            "domain": "strikex.com",
            "notes": null
          },
          {
            "name": "T-Blocks",
            "website": "https://tblocks.io/",
            "domain": "tblocks.io",
            "notes": null
          },
          {
            "name": "Tangany",
            "website": "https://tangany.com/",
            "domain": "tangany.com",
            "notes": null
          },
          {
            "name": "Tessera",
            "website": "https://www.tessera.pe/",
            "domain": "tessera.pe",
            "notes": null
          },
          {
            "name": "TokenFi",
            "website": "https://www.tokenfi.com/",
            "domain": "tokenfi.com",
            "notes": null
          },
          {
            "name": "Tokeniza",
            "website": "https://tokeniza.com.br/",
            "domain": "tokeniza.com.br",
            "notes": null
          },
          {
            "name": "Velo",
            "website": "https://www.velo.org/",
            "domain": "velo.org",
            "notes": null
          },
          {
            "name": "Vexora Properties",
            "website": "https://www.vexora.properties/",
            "domain": "vexora.properties",
            "notes": null
          },
          {
            "name": "WECOIN",
            "website": "https://weset.io/",
            "domain": "weset.io",
            "notes": null
          },
          {
            "name": "Xend Finance",
            "website": "https://xend.africa/",
            "domain": "xend.africa",
            "notes": null
          },
          {
            "name": "Zoth.io",
            "website": "https://www.zoth.io/",
            "domain": "zoth.io",
            "notes": null
          },
          {
            "name": "globacap",
            "website": "https://globacap.com/",
            "domain": "globacap.com",
            "notes": null
          },
          {
            "name": "VórtxQR Tokenizadora",
            "website": "https://tokenizadora.com.br/",
            "domain": "tokenizadora.com.br",
            "notes": null
          },
          {
            "name": "STRATO",
            "website": "https://strato.nexus/",
            "domain": "strato.nexus",
            "notes": null
          },
          {
            "name": "Contracoin",
            "website": "https://contracorp.com.au/",
            "domain": "contracorp.com.au",
            "notes": null
          },
          {
            "name": "Farm City RWA",
            "website": "https://farmcity.dev/",
            "domain": "farmcity.dev",
            "notes": null
          },
          {
            "name": "Land Invest Corp",
            "website": "https://landinvest.io/",
            "domain": "landinvest.io",
            "notes": null
          },
          {
            "name": "DOVU",
            "website": "https://dovu.earth/en/",
            "domain": "dovu.earth",
            "notes": null
          },
          {
            "name": "GIGATONS",
            "website": "https://www.gigatons.com/",
            "domain": "gigatons.com",
            "notes": null
          },
          {
            "name": "Suno",
            "website": "https://suno.finance/",
            "domain": "suno.finance",
            "notes": null
          },
          {
            "name": "DGTEnergy",
            "website": "https://dgt.energy/",
            "domain": "dgt.energy",
            "notes": null
          },
          {
            "name": "House of Emirates",
            "website": "https://hoemirates.com/",
            "domain": "hoemirates.com",
            "notes": null
          },
          {
            "name": "Maritime DAO",
            "website": "https://maritimedao.com/app/index.html",
            "domain": "maritimedao.com",
            "notes": null
          },
          {
            "name": "Montis Group",
            "website": "https://montis.digital/",
            "domain": "montis.digital",
            "notes": null
          },
          {
            "name": "ACES.FUN",
            "website": "https://aces.fun/",
            "domain": "aces.fun",
            "notes": null
          },
          {
            "name": "AMPLE Protocol",
            "website": "https://www.ampleprotocol.xyz/",
            "domain": "ampleprotocol.xyz",
            "notes": null
          },
          {
            "name": "AssetLink",
            "website": "https://assetlink.io/",
            "domain": "assetlink.io",
            "notes": null
          },
          {
            "name": "Dualmint",
            "website": "https://www.dualmint.com/",
            "domain": "dualmint.com",
            "notes": null
          },
          {
            "name": "Minestarters",
            "website": "https://minestarters.com/",
            "domain": "minestarters.com",
            "notes": null
          },
          {
            "name": "RedCarpetHQ",
            "website": "https://redcarpethq.org/en",
            "domain": "redcarpethq.org",
            "notes": null
          },
          {
            "name": "STR8FIRE",
            "website": "https://str8fire.io/",
            "domain": "str8fire.io",
            "notes": null
          },
          {
            "name": "Salient Yachts",
            "website": "https://salientyachts.com/",
            "domain": "salientyachts.com",
            "notes": null
          },
          {
            "name": "Veil",
            "website": "https://www.veil-rwa.com/",
            "domain": "veil-rwa.com",
            "notes": null
          }
        ]
      },
      {
        "category": "Tokenized Asset Issuers",
        "entities": [
          {
            "name": "VanEck",
            "website": "https://www.vaneck.com",
            "domain": "vaneck.com",
            "notes": "VBILL."
          },
          {
            "name": "State Street",
            "website": "https://www.statestreet.com",
            "domain": "statestreet.com",
            "notes": null
          },
          {
            "name": "Fidelity",
            "website": "https://www.fidelity.com",
            "domain": "fidelity.com",
            "notes": "FDIT / Fidelity Digital Assets."
          },
          {
            "name": "Janus Henderson",
            "website": "https://www.janushenderson.com",
            "domain": "janushenderson.com",
            "notes": "AAA CLO strategy tokenized via Anemoy/Grove."
          },
          {
            "name": "Franklin Templeton",
            "website": "https://www.franklintempleton.com",
            "domain": "franklintempleton.com",
            "notes": "BENJI / FOBXX."
          },
          {
            "name": "BlackRock",
            "website": "https://www.blackrock.com",
            "domain": "blackrock.com",
            "notes": "BUIDL via Securitize."
          },
          {
            "name": "Ondo",
            "website": "https://ondo.finance",
            "domain": "ondo.finance",
            "notes": "Duplicate. USDY / OUSG."
          },
          {
            "name": "xStocks",
            "website": "https://xstocks.com",
            "domain": "xstocks.com",
            "notes": "Tokenized equities, issued by Backed."
          },
          {
            "name": "Superstate",
            "website": "https://superstate.com",
            "domain": "superstate.com",
            "notes": "Duplicate."
          },
          {
            "name": "Backed",
            "website": "https://backed.fi",
            "domain": "backed.fi",
            "notes": "bTokens. Issuer behind xStocks."
          },
          {
            "name": "Bitwise",
            "website": "https://bitwiseinvestments.com",
            "domain": "bitwiseinvestments.com",
            "notes": null
          },
          {
            "name": "Spiko",
            "website": "https://www.spiko.io",
            "domain": "spiko.io",
            "notes": "EU/French tokenized MMFs (EUTBL / USTBL)."
          },
          {
            "name": "Anemoy",
            "website": "https://anemoy.io",
            "domain": "anemoy.io",
            "notes": "Centrifuge's asset management arm. Manages ACRDX."
          },
          {
            "name": "WisdomTree",
            "website": "https://www.wisdomtree.com",
            "domain": "wisdomtree.com",
            "notes": "WisdomTree Connect / Prime."
          },
          {
            "name": "Grayscale",
            "website": "https://www.grayscale.com",
            "domain": "grayscale.com",
            "notes": null
          },
          {
            "name": "Midas",
            "website": "https://midas.app",
            "domain": "midas.app",
            "notes": "Duplicate. mBASIS / mTBILL."
          },
          {
            "name": "Securitize",
            "website": "https://securitize.io",
            "domain": "securitize.io",
            "notes": "Duplicate."
          },
          {
            "name": "Courtyard",
            "website": "https://courtyard.io/",
            "domain": "courtyard.io",
            "notes": null
          },
          {
            "name": "Lofty",
            "website": "https://www.lofty.ai/",
            "domain": "lofty.ai",
            "notes": null
          },
          {
            "name": "Matrixdock",
            "website": "https://www.matrixdock.com",
            "domain": "matrixdock.com",
            "notes": null
          },
          {
            "name": "OpenEden",
            "website": "https://openeden.com/",
            "domain": "openeden.com",
            "notes": null
          },
          {
            "name": "Propbase",
            "website": "https://www.propbase.app/",
            "domain": "propbase.app",
            "notes": null
          },
          {
            "name": "BAXUS",
            "website": "https://www.baxus.co/",
            "domain": "baxus.co",
            "notes": null
          },
          {
            "name": "Binaryx",
            "website": "https://binaryx.com/",
            "domain": "binaryx.com",
            "notes": null
          },
          {
            "name": "Denario",
            "website": "https://www.denario.swiss/",
            "domain": "denario.swiss",
            "notes": null
          },
          {
            "name": "Kinesis",
            "website": "https://kinesis.money/",
            "domain": "kinesis.money",
            "notes": null
          },
          {
            "name": "Meld Gold",
            "website": "https://www.meld.gold/",
            "domain": "meld.gold",
            "notes": null
          },
          {
            "name": "Ainslie Crypto",
            "website": "https://ainsliecrypto.com.au/",
            "domain": "ainsliecrypto.com.au",
            "notes": null
          },
          {
            "name": "Arca",
            "website": "https://www.arcalabs.com/",
            "domain": "arcalabs.com",
            "notes": null
          },
          {
            "name": "arttrade",
            "website": "https://arttrade.de/",
            "domain": "arttrade.de",
            "notes": null
          },
          {
            "name": "Gold DAO",
            "website": "https://gldt.org/",
            "domain": "gldt.org",
            "notes": null
          },
          {
            "name": "Groma",
            "website": "https://www.groma.com/",
            "domain": "groma.com",
            "notes": null
          },
          {
            "name": "COSIMO Digital",
            "website": "https://cosimodigital.com/",
            "domain": "cosimodigital.com",
            "notes": null
          },
          {
            "name": "DuBois et fils",
            "website": "https://duboisfils.ch/de?redirected=true",
            "domain": "duboisfils.ch",
            "notes": null
          },
          {
            "name": "H. Moser & Cie.",
            "website": "https://h-moser.com/en/collections",
            "domain": "h-moser.com",
            "notes": null
          },
          {
            "name": "PreStocks",
            "website": "https://prestocks.com/",
            "domain": "prestocks.com",
            "notes": null
          },
          {
            "name": "SHIFT",
            "website": "https://www.shiftrwa.xyz/",
            "domain": "shiftrwa.xyz",
            "notes": null
          },
          {
            "name": "360xart",
            "website": "https://www.360xart.com",
            "domain": "360xart.com",
            "notes": null
          },
          {
            "name": "AmmoCrypt",
            "website": "https://ammocrypt.io/",
            "domain": "ammocrypt.io",
            "notes": null
          },
          {
            "name": "Bankex",
            "website": "https://www.bankex.com/",
            "domain": "bankex.com",
            "notes": null
          },
          {
            "name": "BIGFOOT404",
            "website": "https://bigfoot404.biz/",
            "domain": "bigfoot404.biz",
            "notes": null
          },
          {
            "name": "BitBay",
            "website": "https://bitbay.market/",
            "domain": "bitbay.market",
            "notes": null
          },
          {
            "name": "CaskCoin",
            "website": "https://www.caskcoin.com/",
            "domain": "caskcoin.com",
            "notes": null
          },
          {
            "name": "Coded Estate",
            "website": "https://www.codedestate.com/",
            "domain": "codedestate.com",
            "notes": null
          },
          {
            "name": "Coreestate",
            "website": "https://coreestate.io/",
            "domain": "coreestate.io",
            "notes": null
          },
          {
            "name": "Crowdgenix",
            "website": "https://www.crowdgenix.com/",
            "domain": "crowdgenix.com",
            "notes": null
          },
          {
            "name": "Curio",
            "website": "https://curioinvest.com/",
            "domain": "curioinvest.com",
            "notes": null
          },
          {
            "name": "Dequity",
            "website": "https://dequity.io/",
            "domain": "dequity.io",
            "notes": null
          },
          {
            "name": "Diamore",
            "website": "https://diamore.co/",
            "domain": "diamore.co",
            "notes": null
          },
          {
            "name": "Digital Marks / Syntrix",
            "website": "https://digital-marks.com/",
            "domain": "digital-marks.com",
            "notes": null
          },
          {
            "name": "dVIN",
            "website": "https://dvinlabs.com/",
            "domain": "dvinlabs.com",
            "notes": null
          },
          {
            "name": "Fintelum",
            "website": "https://www.fintelum.com/",
            "domain": "fintelum.com",
            "notes": null
          },
          {
            "name": "Grandbase",
            "website": "https://grandbase.io/",
            "domain": "grandbase.io",
            "notes": null
          },
          {
            "name": "Item Banc",
            "website": "https://itembanc.nl/",
            "domain": "itembanc.nl",
            "notes": null
          },
          {
            "name": "JadeCity",
            "website": "https://x.com/TheJadeCity",
            "domain": "x.com",
            "notes": null
          },
          {
            "name": "Manifest",
            "website": "https://manifest.finance/",
            "domain": "manifest.finance",
            "notes": null
          },
          {
            "name": "Probal",
            "website": "https://www.probal.io/",
            "domain": "probal.io",
            "notes": null
          },
          {
            "name": "ReFuture",
            "website": "https://refuture.se/",
            "domain": "refuture.se",
            "notes": null
          },
          {
            "name": "SIX Digital Exchange (SDX)",
            "website": "https://www.six-group.com/en/products-services/securities-services/digital-assets.html",
            "domain": "six-group.com",
            "notes": null
          },
          {
            "name": "SOMA Finance",
            "website": "https://www.soma.finance/",
            "domain": "soma.finance",
            "notes": null
          },
          {
            "name": "Tokenise",
            "website": "https://tokenise.io/",
            "domain": "tokenise.io",
            "notes": null
          },
          {
            "name": "TVVIN",
            "website": "https://www.tvvin.com/",
            "domain": "tvvin.com",
            "notes": null
          },
          {
            "name": "Acquire.Fi",
            "website": "https://www.acquire.fi/",
            "domain": "acquire.fi",
            "notes": null
          },
          {
            "name": "Blockhouse",
            "website": "https://www.blockhouse.app/",
            "domain": "blockhouse.app",
            "notes": null
          },
          {
            "name": "BukProtocol",
            "website": "https://bukprotocol.ai/",
            "domain": "bukprotocol.ai",
            "notes": null
          },
          {
            "name": "Caddy Finance",
            "website": "https://caddy.finance/",
            "domain": "caddy.finance",
            "notes": null
          },
          {
            "name": "ComTech",
            "website": "https://cgold.ae/",
            "domain": "cgold.ae",
            "notes": null
          },
          {
            "name": "ConcentricDAO",
            "website": "https://concentricindustries.net/",
            "domain": "concentricindustries.net",
            "notes": null
          },
          {
            "name": "Cougar DAO",
            "website": "https://cougardao.substack.com/",
            "domain": "cougardao.substack.com",
            "notes": null
          },
          {
            "name": "Dclex",
            "website": "https://primedelta.io/",
            "domain": "primedelta.io",
            "notes": null
          },
          {
            "name": "DigiFT",
            "website": "https://www.digift.io/",
            "domain": "digift.io",
            "notes": null
          },
          {
            "name": "DRVN Labo",
            "website": "https://www.vhcls.app/",
            "domain": "vhcls.app",
            "notes": null
          },
          {
            "name": "Ecosapiens",
            "website": "https://ecosapiens.xyz/",
            "domain": "ecosapiens.xyz",
            "notes": null
          },
          {
            "name": "EthicHub",
            "website": "https://www.ethichub.com/es/coffee",
            "domain": "ethichub.com",
            "notes": null
          },
          {
            "name": "Exporo",
            "website": "https://www.exporo.de",
            "domain": "exporo.de",
            "notes": null
          },
          {
            "name": "GrtWines",
            "website": "https://www.grtwines.com/",
            "domain": "grtwines.com",
            "notes": null
          },
          {
            "name": "LCX",
            "website": "https://lcx.com/",
            "domain": "lcx.com",
            "notes": null
          },
          {
            "name": "Metawealth",
            "website": "https://metawealth.co/",
            "domain": "metawealth.co",
            "notes": null
          },
          {
            "name": "Plural Finance",
            "website": "https://www.pluralfinance.com/",
            "domain": "pluralfinance.com",
            "notes": null
          },
          {
            "name": "Poison Finance",
            "website": "https://poison.finance/",
            "domain": "poison.finance",
            "notes": null
          },
          {
            "name": "Polytrade Finance",
            "website": "https://polytrade.app/",
            "domain": "polytrade.app",
            "notes": null
          },
          {
            "name": "Portio Capital",
            "website": "https://portio.club/",
            "domain": "portio.club",
            "notes": null
          },
          {
            "name": "RealT",
            "website": "https://realtusa.pulse.is/",
            "domain": "realtusa.pulse.is",
            "notes": null
          },
          {
            "name": "Segmint (by VanEck)",
            "website": "https://www.segmint.io/",
            "domain": "segmint.io",
            "notes": null
          },
          {
            "name": "Senken",
            "website": "https://www.senken.io",
            "domain": "senken.io",
            "notes": null
          },
          {
            "name": "Silta",
            "website": "https://silta.finance/",
            "domain": "silta.finance",
            "notes": null
          },
          {
            "name": "Structure",
            "website": "https://structure.fi/",
            "domain": "structure.fi",
            "notes": null
          },
          {
            "name": "USP",
            "website": "https://usp.io/",
            "domain": "usp.io",
            "notes": null
          },
          {
            "name": "Artrade",
            "website": "https://artrade.app/",
            "domain": "artrade.app",
            "notes": null
          },
          {
            "name": "Blockcellar",
            "website": "https://blockcellar.com/",
            "domain": "blockcellar.com",
            "notes": null
          },
          {
            "name": "Crypto autos.com",
            "website": "https://www.cryptoautos.com/",
            "domain": "cryptoautos.com",
            "notes": null
          },
          {
            "name": "Dtravel",
            "website": "https://www.dtravel.com",
            "domain": "dtravel.com",
            "notes": null
          },
          {
            "name": "Hashnote USYC",
            "website": "https://www.hashnote.com/",
            "domain": "hashnote.com",
            "notes": null
          },
          {
            "name": "KUMA Protocol",
            "website": "https://www.kuma.bond/",
            "domain": "kuma.bond",
            "notes": null
          },
          {
            "name": "Opulous",
            "website": "https://opulous.org/",
            "domain": "opulous.org",
            "notes": null
          },
          {
            "name": "Prosper",
            "website": "https://www.prosper-fi.com/",
            "domain": "prosper-fi.com",
            "notes": null
          },
          {
            "name": "Ayni Gold",
            "website": "https://www.ayni.gold/",
            "domain": "ayni.gold",
            "notes": null
          },
          {
            "name": "Galactica",
            "website": "https://galacticarwa.com/",
            "domain": "galacticarwa.com",
            "notes": null
          },
          {
            "name": "Immofanten Invest",
            "website": "https://immofanten.de/",
            "domain": "immofanten.de",
            "notes": null
          },
          {
            "name": "Kryptofanten AG",
            "website": "https://kryptofanten.de/",
            "domain": "kryptofanten.de",
            "notes": null
          },
          {
            "name": "Mannah",
            "website": "https://www.mannah.io/",
            "domain": "mannah.io",
            "notes": null
          },
          {
            "name": "NexBridge",
            "website": "https://sv.nexbridge.finance",
            "domain": "sv.nexbridge.finance",
            "notes": null
          },
          {
            "name": "OilXCoin",
            "website": "https://oilxcoin.us/en",
            "domain": "oilxcoin.us",
            "notes": null
          },
          {
            "name": "OkiFin Capital GmbH",
            "website": "https://www.okifin.com/",
            "domain": "okifin.com",
            "notes": null
          },
          {
            "name": "Ribbon Finance",
            "website": "https://www.ribbon.finance/",
            "domain": "ribbon.finance",
            "notes": null
          },
          {
            "name": "STIMA",
            "website": "https://stima.io/",
            "domain": "stima.io",
            "notes": null
          },
          {
            "name": "Solv Finance",
            "website": "https://solv.finance/",
            "domain": "solv.finance",
            "notes": null
          },
          {
            "name": "Treesury",
            "website": "https://www.treesury.com/",
            "domain": "treesury.com",
            "notes": null
          },
          {
            "name": "WELF",
            "website": "https://welf.com/",
            "domain": "welf.com",
            "notes": null
          },
          {
            "name": "YieldNest",
            "website": "https://yieldnest.finance/",
            "domain": "yieldnest.finance",
            "notes": null
          },
          {
            "name": "Auxite",
            "website": "https://www.auxite.io/en",
            "domain": "auxite.io",
            "notes": null
          },
          {
            "name": "Bingold",
            "website": "https://bingold.to/",
            "domain": "bingold.to",
            "notes": null
          },
          {
            "name": "Cropto",
            "website": "https://www.cropto.io/",
            "domain": "cropto.io",
            "notes": null
          },
          {
            "name": "EmGEMx",
            "website": "https://gemx.ag/",
            "domain": "gemx.ag",
            "notes": null
          },
          {
            "name": "GoldPro",
            "website": "https://ipmb.com/",
            "domain": "ipmb.com",
            "notes": null
          },
          {
            "name": "GoldZip",
            "website": "https://goldzip.info/",
            "domain": "goldzip.info",
            "notes": null
          },
          {
            "name": "Novem Gold Token",
            "website": "https://novemgold.com/?lang=en",
            "domain": "novemgold.com",
            "notes": null
          },
          {
            "name": "Palm Economy",
            "website": "https://palmeconomy.io/",
            "domain": "palmeconomy.io",
            "notes": null
          },
          {
            "name": "Serenity",
            "website": "https://s.technology/",
            "domain": "s.technology",
            "notes": null
          },
          {
            "name": "SilverTimes",
            "website": "https://www.silvertimes.io",
            "domain": "silvertimes.io",
            "notes": null
          },
          {
            "name": "VeraOne",
            "website": "https://veraone.io/fr/accueil/",
            "domain": "veraone.io",
            "notes": null
          },
          {
            "name": "Zambesi gold",
            "website": "https://www.zgdgold.com/",
            "domain": "zgdgold.com",
            "notes": null
          },
          {
            "name": "Arvo",
            "website": "https://arvoprotocol.com/",
            "domain": "arvoprotocol.com",
            "notes": null
          },
          {
            "name": "Bixos",
            "website": "https://www.bixos.com/",
            "domain": "bixos.com",
            "notes": null
          },
          {
            "name": "HOME3",
            "website": "https://www.home3suite.com/",
            "domain": "home3suite.com",
            "notes": null
          },
          {
            "name": "Headway Nova",
            "website": "https://hwnova.site/",
            "domain": "hwnova.site",
            "notes": null
          },
          {
            "name": "IMO",
            "website": "https://www.imo-invest.com/",
            "domain": "imo-invest.com",
            "notes": null
          },
          {
            "name": "LABSV2",
            "website": "https://www.labs.solutions/",
            "domain": "labs.solutions",
            "notes": null
          },
          {
            "name": "Magma",
            "website": "https://thisismagma.com/",
            "domain": "thisismagma.com",
            "notes": null
          },
          {
            "name": "Mey Network",
            "website": "https://mey.network/",
            "domain": "mey.network",
            "notes": null
          },
          {
            "name": "Parcl",
            "website": "https://www.parcllabs.com/",
            "domain": "parcllabs.com",
            "notes": null
          },
          {
            "name": "Propchain",
            "website": "https://propchain.com/",
            "domain": "propchain.com",
            "notes": null
          },
          {
            "name": "Reental",
            "website": "https://www.reental.co/",
            "domain": "reental.co",
            "notes": null
          },
          {
            "name": "SQRBIT",
            "website": "https://sqrbit.com/",
            "domain": "sqrbit.com",
            "notes": null
          },
          {
            "name": "T3RRA",
            "website": "https://t3rra.co/",
            "domain": "t3rra.co",
            "notes": null
          },
          {
            "name": "Tokenizer.estate",
            "website": "https://tokenizer.estate/",
            "domain": "tokenizer.estate",
            "notes": null
          },
          {
            "name": "VESTN",
            "website": "https://vestn.io/",
            "domain": "vestn.io",
            "notes": null
          },
          {
            "name": "1x.exchange",
            "website": "https://www.1x.exchange/",
            "domain": "1x.exchange",
            "notes": null
          },
          {
            "name": "ATV MBSToken II",
            "website": "https://atvfund.io/",
            "domain": "atvfund.io",
            "notes": null
          },
          {
            "name": "Apollo Global",
            "website": "https://www.apollo.com/",
            "domain": "apollo.com",
            "notes": null
          },
          {
            "name": "BlackRock (BUIDL)",
            "website": "https://www.blackrock.com/us/individual",
            "domain": "blackrock.com",
            "notes": null
          },
          {
            "name": "EVIDENT",
            "website": "https://evident.capital/",
            "domain": "evident.capital",
            "notes": null
          },
          {
            "name": "FundBridge Capital",
            "website": "https://fundbridge.sg/",
            "domain": "fundbridge.sg",
            "notes": null
          },
          {
            "name": "GM artification",
            "website": "https://gmartification.com/",
            "domain": "gmartification.com",
            "notes": null
          },
          {
            "name": "J.P. Morgan Asset Management",
            "website": "https://am.jpmorgan.com/us/asset-management/welcome/",
            "domain": "am.jpmorgan.com",
            "notes": null
          },
          {
            "name": "MAIV",
            "website": "https://maiv.io/",
            "domain": "maiv.io",
            "notes": null
          },
          {
            "name": "MERJ",
            "website": "https://merj.exchange/",
            "domain": "merj.exchange",
            "notes": null
          },
          {
            "name": "Memento",
            "website": "https://mementoblockchain.com/",
            "domain": "mementoblockchain.com",
            "notes": null
          },
          {
            "name": "Mineral Vault",
            "website": "https://mineralvault.io/",
            "domain": "mineralvault.io",
            "notes": null
          },
          {
            "name": "Particle",
            "website": "https://www.particlecollection.com/",
            "domain": "particlecollection.com",
            "notes": null
          },
          {
            "name": "Rare Spirits",
            "website": "https://www.rarespirits.io/",
            "domain": "rarespirits.io",
            "notes": null
          },
          {
            "name": "Scenium",
            "website": "https://www.scenium.io/",
            "domain": "scenium.io",
            "notes": null
          },
          {
            "name": "TRAKX",
            "website": "https://trakx.io/",
            "domain": "trakx.io",
            "notes": null
          },
          {
            "name": "The RWAX",
            "website": "https://therwax.com/",
            "domain": "therwax.com",
            "notes": null
          },
          {
            "name": "UBS Asset Management",
            "website": "https://www.ubs.com/us/en.html",
            "domain": "ubs.com",
            "notes": null
          },
          {
            "name": "Blubird",
            "website": "https://www.getblubird.com/",
            "domain": "getblubird.com",
            "notes": null
          },
          {
            "name": "Lumishare",
            "website": "https://lumishare.io/",
            "domain": "lumishare.io",
            "notes": null
          },
          {
            "name": "Apraemio",
            "website": "https://www.apraemio.com/",
            "domain": "apraemio.com",
            "notes": null
          },
          {
            "name": "BEARTIE",
            "website": "https://beartie.com/",
            "domain": "beartie.com",
            "notes": null
          },
          {
            "name": "CSOP",
            "website": "https://www.csopasset.com",
            "domain": "csopasset.com",
            "notes": null
          },
          {
            "name": "Hash Global",
            "website": "https://www.hashglobal.io/",
            "domain": "hashglobal.io",
            "notes": null
          },
          {
            "name": "Invesco",
            "website": "https://www.invesco.com/us/en/country-splash.html",
            "domain": "invesco.com",
            "notes": null
          },
          {
            "name": "Lingo",
            "website": "https://lingocoin.io/",
            "domain": "lingocoin.io",
            "notes": null
          },
          {
            "name": "Mner Club",
            "website": "https://www.mner.club/",
            "domain": "mner.club",
            "notes": null
          },
          {
            "name": "Osean",
            "website": "https://www.osean.online/",
            "domain": "osean.online",
            "notes": null
          },
          {
            "name": "Pilgrim Partners",
            "website": "https://www.pilgrimpartnersasia.com/",
            "domain": "pilgrimpartnersasia.com",
            "notes": null
          },
          {
            "name": "REV",
            "website": "https://staynearn.com/",
            "domain": "staynearn.com",
            "notes": null
          },
          {
            "name": "Reserve",
            "website": "https://reserve.org/",
            "domain": "reserve.org",
            "notes": null
          },
          {
            "name": "S.P.O.T.T.Y.",
            "website": "https://portal.spottyassets.com/",
            "domain": "portal.spottyassets.com",
            "notes": null
          },
          {
            "name": "The Coop Network",
            "website": "https://thecoopnetwork.io/",
            "domain": "thecoopnetwork.io",
            "notes": null
          },
          {
            "name": "Timeless Investments",
            "website": "https://www.timeless.investments/",
            "domain": "timeless.investments",
            "notes": null
          },
          {
            "name": "Unlimitime",
            "website": "https://unlimitime.com/",
            "domain": "unlimitime.com",
            "notes": null
          },
          {
            "name": "Veritas Protocol",
            "website": "https://www.veritasprotocol.com/",
            "domain": "veritasprotocol.com",
            "notes": null
          },
          {
            "name": "Voya Management",
            "website": "https://investments.voya.com/",
            "domain": "investments.voya.com",
            "notes": null
          },
          {
            "name": "WellingtonManagement",
            "website": "https://www.wellington.com/en",
            "domain": "wellington.com",
            "notes": null
          },
          {
            "name": "Alpaca Securities",
            "website": "https://alpaca.markets/",
            "domain": "alpaca.markets",
            "notes": null
          },
          {
            "name": "Enegra",
            "website": "https://www.enegragroup.com/",
            "domain": "enegragroup.com",
            "notes": null
          },
          {
            "name": "Piggycell",
            "website": "https://www.piggycell.io/home",
            "domain": "piggycell.io",
            "notes": null
          },
          {
            "name": "ST0x",
            "website": "https://www.st0x.io/",
            "domain": "st0x.io",
            "notes": null
          },
          {
            "name": "AZTEcosystem",
            "website": "https://aztecosystem.com/",
            "domain": "aztecosystem.com",
            "notes": null
          },
          {
            "name": "Asset Avenue",
            "website": "https://www.assetavenue.capital/",
            "domain": "assetavenue.capital",
            "notes": null
          },
          {
            "name": "CavalRe | Multiswap",
            "website": "https://caval.re/",
            "domain": "caval.re",
            "notes": null
          },
          {
            "name": "CodeNekt Ecosystem",
            "website": "https://codenekt-ecosystem.io/",
            "domain": "codenekt-ecosystem.io",
            "notes": null
          },
          {
            "name": "DEX.Photos",
            "website": "https://dex.photos/",
            "domain": "dex.photos",
            "notes": null
          },
          {
            "name": "DRVN / VHCLS",
            "website": "https://www.vhcls.app/",
            "domain": "vhcls.app",
            "notes": null
          },
          {
            "name": "Demether",
            "website": "https://www.demether.io/",
            "domain": "demether.io",
            "notes": null
          },
          {
            "name": "Elevex",
            "website": "https://elevex.ai/",
            "domain": "elevex.ai",
            "notes": null
          },
          {
            "name": "Evolve Pro",
            "website": "https://evolvetoken.io/",
            "domain": "evolvetoken.io",
            "notes": null
          },
          {
            "name": "Ferrous",
            "website": "https://ferrous.app/",
            "domain": "ferrous.app",
            "notes": null
          },
          {
            "name": "Moonwhale",
            "website": "https://moonwhale.ai/",
            "domain": "moonwhale.ai",
            "notes": null
          },
          {
            "name": "SolarShare",
            "website": "https://www.solarshare.io/",
            "domain": "solarshare.io",
            "notes": null
          },
          {
            "name": "Soudian",
            "website": "https://soudian.ai/",
            "domain": "soudian.ai",
            "notes": null
          },
          {
            "name": "Splyce Finance",
            "website": "https://splyce.finance/",
            "domain": "splyce.finance",
            "notes": null
          },
          {
            "name": "Toyow",
            "website": "https://www.toyow.com/",
            "domain": "toyow.com",
            "notes": null
          },
          {
            "name": "f2o Sports",
            "website": "https://f2osports.com/",
            "domain": "f2osports.com",
            "notes": null
          },
          {
            "name": "lend.xyz",
            "website": "https://lend.xyz/",
            "domain": "lend.xyz",
            "notes": null
          },
          {
            "name": "Sukuk",
            "website": "https://sukuk.fi/",
            "domain": "sukuk.fi",
            "notes": null
          }
        ]
      }
    ]
  },
  {
    "section": "Blockchains",
    "categories": [
      {
        "category": "Blockchains",
        "entities": [
          {
            "name": "Ethereum",
            "website": "https://ethereum.org",
            "domain": "ethereum.org",
            "notes": null
          },
          {
            "name": "Solana",
            "website": "https://solana.com",
            "domain": "solana.com",
            "notes": null
          },
          {
            "name": "Polygon",
            "website": "https://polygon.technology",
            "domain": "polygon.technology",
            "notes": "Revolut's preferred stablecoin stack."
          },
          {
            "name": "Arc",
            "website": "https://www.arc.network",
            "domain": "arc.network",
            "notes": "Circle's L1. USDC as gas. Public testnet; mainnet beta expected 2026."
          },
          {
            "name": "Arbitrum",
            "website": "https://arbitrum.io",
            "domain": "arbitrum.io",
            "notes": null
          },
          {
            "name": "Plume",
            "website": "https://plume.org",
            "domain": "plume.org",
            "notes": "Duplicate. RWA-focused L1/L2."
          },
          {
            "name": "Canton",
            "website": "https://www.canton.network",
            "domain": "canton.network",
            "notes": "Duplicate."
          },
          {
            "name": "Plasma",
            "website": "https://www.plasma.to",
            "domain": "plasma.to",
            "notes": "Tether-aligned stablechain. Live mainnet. Also runs Plasma One."
          },
          {
            "name": "Noble",
            "website": "https://www.noble.xyz",
            "domain": "noble.xyz",
            "notes": "Duplicate."
          },
          {
            "name": "Ripple (XRPL)",
            "website": "https://xrpl.org",
            "domain": "xrpl.org",
            "notes": "Duplicate — corporate site is ripple.com."
          },
          {
            "name": "ZKsync",
            "website": "https://zksync.io",
            "domain": "zksync.io",
            "notes": null
          },
          {
            "name": "Avalanche",
            "website": "https://www.avax.network",
            "domain": "avax.network",
            "notes": null
          },
          {
            "name": "Stable",
            "website": "https://stable.xyz",
            "domain": "stable.xyz",
            "notes": "USDT-native stablechain. Confirm domain."
          },
          {
            "name": "Celo",
            "website": "https://celo.org",
            "domain": "celo.org",
            "notes": null
          },
          {
            "name": "Provenance",
            "website": "https://provenance.io",
            "domain": "provenance.io",
            "notes": "Figure's chain. YLDS native here."
          },
          {
            "name": "BNB Chain",
            "website": "https://www.bnbchain.org",
            "domain": "bnbchain.org",
            "notes": null
          },
          {
            "name": "Aptos",
            "website": "https://aptosfoundation.org",
            "domain": "aptosfoundation.org",
            "notes": "Corporate: aptoslabs.com"
          },
          {
            "name": "Codex",
            "website": "https://www.codex.xyz",
            "domain": "codex.xyz",
            "notes": "OP-stack stablecoin-first L2. USDC gas. Coinbase Ventures / Dragonfly."
          },
          {
            "name": "Stellar",
            "website": "https://stellar.org",
            "domain": "stellar.org",
            "notes": null
          },
          {
            "name": "Ondo",
            "website": "https://ondo.finance",
            "domain": "ondo.finance",
            "notes": "Duplicate — Ondo Chain."
          },
          {
            "name": "Tempo",
            "website": "https://tempo.xyz",
            "domain": "tempo.xyz",
            "notes": "Stripe + Paradigm stablechain. Testnet/devnet as of early 2026."
          },
          {
            "name": "Tron",
            "website": "https://tron.network",
            "domain": "tron.network",
            "notes": "Largest USDT settlement chain by volume."
          },
          {
            "name": "Dusk",
            "website": "https://dusk.network",
            "domain": "dusk.network",
            "notes": null
          },
          {
            "name": "Polymesh",
            "website": "https://polymesh.network",
            "domain": "polymesh.network",
            "notes": null
          },
          {
            "name": "XDC Network",
            "website": "https://xdc.org",
            "domain": "xdc.org",
            "notes": null
          },
          {
            "name": "Redbelly Network",
            "website": "https://www.redbelly.network",
            "domain": "redbelly.network",
            "notes": null
          },
          {
            "name": "Creditcoin",
            "website": "https://creditcoin.org/",
            "domain": "creditcoin.org",
            "notes": null
          },
          {
            "name": "Lumia",
            "website": "https://lumia.org/",
            "domain": "lumia.org",
            "notes": null
          },
          {
            "name": "MANTRA",
            "website": "https://mantrachain.io/",
            "domain": "mantrachain.io",
            "notes": null
          },
          {
            "name": "Mavryk Network",
            "website": "https://mavryk.org/",
            "domain": "mavryk.org",
            "notes": null
          },
          {
            "name": "KiiChain",
            "website": "https://kiichain.io/",
            "domain": "kiichain.io",
            "notes": null
          },
          {
            "name": "peaq",
            "website": "https://www.peaq.xyz/",
            "domain": "peaq.xyz",
            "notes": null
          },
          {
            "name": "Toronet",
            "website": "https://website.toronet.org/",
            "domain": "website.toronet.org",
            "notes": null
          },
          {
            "name": "Novastro",
            "website": "https://www.novastro.xyz/",
            "domain": "novastro.xyz",
            "notes": null
          },
          {
            "name": "Realio Network",
            "website": "https://realio.network/",
            "domain": "realio.network",
            "notes": null
          },
          {
            "name": "3DPass",
            "website": "https://3dpass.org/",
            "domain": "3dpass.org",
            "notes": null
          },
          {
            "name": "Camino Network",
            "website": "https://camino.network/",
            "domain": "camino.network",
            "notes": null
          },
          {
            "name": "Chromia",
            "website": "https://chromia.com/",
            "domain": "chromia.com",
            "notes": null
          },
          {
            "name": "Coreum",
            "website": "https://tx.org/",
            "domain": "tx.org",
            "notes": null
          },
          {
            "name": "DeFiChain",
            "website": "https://defichain.com/",
            "domain": "defichain.com",
            "notes": null
          },
          {
            "name": "Energy Web",
            "website": "https://energyweb.org/",
            "domain": "energyweb.org",
            "notes": null
          },
          {
            "name": "Ravencoin",
            "website": "https://ravencoin.org/",
            "domain": "ravencoin.org",
            "notes": null
          },
          {
            "name": "Re.al",
            "website": "https://www.re.al/",
            "domain": "re.al",
            "notes": null
          },
          {
            "name": "Vaulta",
            "website": "https://www.vaulta.com",
            "domain": "vaulta.com",
            "notes": null
          },
          {
            "name": "XDB CHAIN",
            "website": "https://xdbchain.com/",
            "domain": "xdbchain.com",
            "notes": null
          },
          {
            "name": "Haven1",
            "website": "https://haven1.org/",
            "domain": "haven1.org",
            "notes": null
          },
          {
            "name": "GGEZ1",
            "website": "https://ggez.one/",
            "domain": "ggez.one",
            "notes": null
          },
          {
            "name": "Own Network",
            "website": "https://ownnetwork.xyz/",
            "domain": "ownnetwork.xyz",
            "notes": null
          }
        ]
      }
    ]
  },
  {
    "section": "Lending",
    "categories": [
      {
        "category": "Lending",
        "entities": [
          {
            "name": "Maple",
            "website": "https://maple.finance",
            "domain": "maple.finance",
            "notes": "Institutional onchain credit. syrupUSDC."
          },
          {
            "name": "Morpho",
            "website": "https://morpho.org",
            "domain": "morpho.org",
            "notes": "Modular lending. Powers Tuyo/Coinbase yield."
          },
          {
            "name": "Euler",
            "website": "https://www.euler.finance",
            "domain": "euler.finance",
            "notes": null
          },
          {
            "name": "Cap",
            "website": "https://cap.app",
            "domain": "cap.app",
            "notes": "Cap Labs — cUSD stablecoin/lending. Confirm domain."
          },
          {
            "name": "Compound",
            "website": "https://compound.finance",
            "domain": "compound.finance",
            "notes": null
          },
          {
            "name": "Aave",
            "website": "https://aave.com",
            "domain": "aave.com",
            "notes": "Duplicate."
          },
          {
            "name": "Goldfinch",
            "website": "https://goldfinch.finance",
            "domain": "goldfinch.finance",
            "notes": "Private credit."
          },
          {
            "name": "OpenTrade",
            "website": "https://opentrade.io",
            "domain": "opentrade.io",
            "notes": "Yield/lending infra for fintechs."
          },
          {
            "name": "Spark",
            "website": "https://spark.fi",
            "domain": "spark.fi",
            "notes": "Sky ecosystem Star. Sibling to Grove."
          },
          {
            "name": "Wildcat",
            "website": "https://wildcat.finance",
            "domain": "wildcat.finance",
            "notes": "Undercollateralized credit markets."
          },
          {
            "name": "Pendle",
            "website": "https://www.pendle.finance",
            "domain": "pendle.finance",
            "notes": "Yield tokenization. Hosts PT-nOPAL."
          },
          {
            "name": "Kamino",
            "website": "https://kamino.finance",
            "domain": "kamino.finance",
            "notes": "Solana lending. Integrates OnRe's ONyc."
          },
          {
            "name": "Fluid",
            "website": "https://fluid.io",
            "domain": "fluid.io",
            "notes": "Instadapp's lending/DEX protocol."
          },
          {
            "name": "Dolomite",
            "website": "https://dolomite.io",
            "domain": "dolomite.io",
            "notes": null
          },
          {
            "name": "AmFi",
            "website": "https://amfi.finance/en",
            "domain": "amfi.finance",
            "notes": null
          },
          {
            "name": "Clearpool",
            "website": "https://clearpool.finance/",
            "domain": "clearpool.finance",
            "notes": null
          },
          {
            "name": "Defactor",
            "website": "https://www.defactor.com",
            "domain": "defactor.com",
            "notes": null
          },
          {
            "name": "Huma Finance",
            "website": "https://www.huma.finance",
            "domain": "huma.finance",
            "notes": null
          },
          {
            "name": "Cicada Partners",
            "website": "https://www.cicada.partners/",
            "domain": "cicada.partners",
            "notes": null
          },
          {
            "name": "Credefi",
            "website": "https://www.credefi.io/",
            "domain": "credefi.io",
            "notes": null
          },
          {
            "name": "cSigma",
            "website": "https://www.csigma.finance/",
            "domain": "csigma.finance",
            "notes": null
          },
          {
            "name": "Homium",
            "website": "https://www.homium.io/",
            "domain": "homium.io",
            "notes": null
          },
          {
            "name": "Jia",
            "website": "https://www.jia.xyz",
            "domain": "jia.xyz",
            "notes": null
          },
          {
            "name": "Kasu",
            "website": "https://kasu.finance/",
            "domain": "kasu.finance",
            "notes": null
          },
          {
            "name": "Ledgity",
            "website": "https://ledgity.finance/",
            "domain": "ledgity.finance",
            "notes": null
          },
          {
            "name": "Zivoe",
            "website": "https://www.zivoe.com/",
            "domain": "zivoe.com",
            "notes": null
          },
          {
            "name": "Isle Finance",
            "website": "https://www.isle.finance/",
            "domain": "isle.finance",
            "notes": null
          },
          {
            "name": "Qiro Finance",
            "website": "https://www.qiro.fi/",
            "domain": "qiro.fi",
            "notes": null
          },
          {
            "name": "Vayana",
            "website": "https://www.vayana.com/",
            "domain": "vayana.com",
            "notes": null
          },
          {
            "name": "Anzi",
            "website": "https://anzi.finance/",
            "domain": "anzi.finance",
            "notes": null
          },
          {
            "name": "Bloom",
            "website": "https://www.bloom.garden/",
            "domain": "bloom.garden",
            "notes": null
          },
          {
            "name": "Bricklayer DAO",
            "website": "https://bricklayerdao.com/",
            "domain": "bricklayerdao.com",
            "notes": null
          },
          {
            "name": "Definder",
            "website": "https://definder.global/",
            "domain": "definder.global",
            "notes": null
          },
          {
            "name": "EnerDAO",
            "website": "https://www.enerdao.org/",
            "domain": "enerdao.org",
            "notes": null
          },
          {
            "name": "stUSDT",
            "website": "https://stusdt.io/#/home",
            "domain": "stusdt.io",
            "notes": null
          },
          {
            "name": "Whrrl",
            "website": "https://www.whr.loans/",
            "domain": "whr.loans",
            "notes": null
          },
          {
            "name": "AgriFi",
            "website": "https://agrifiafrica.com/",
            "domain": "agrifiafrica.com",
            "notes": null
          },
          {
            "name": "Fortunafi",
            "website": "https://www.fortunafi.com",
            "domain": "fortunafi.com",
            "notes": null
          },
          {
            "name": "Mystic Finance",
            "website": "https://app.mysticfinance.xyz/",
            "domain": "app.mysticfinance.xyz",
            "notes": null
          },
          {
            "name": "Peerhive",
            "website": "https://www.peerhive.app/",
            "domain": "peerhive.app",
            "notes": null
          },
          {
            "name": "Soil",
            "website": "https://soil.co/",
            "domain": "soil.co",
            "notes": null
          },
          {
            "name": "T-Protocol",
            "website": "https://www.tprotocol.io",
            "domain": "tprotocol.io",
            "notes": null
          },
          {
            "name": "TradeFinex",
            "website": "https://tradefinex.org/",
            "domain": "tradefinex.org",
            "notes": null
          },
          {
            "name": "XDC Trade Network",
            "website": "https://xdctrade.network/",
            "domain": "xdctrade.network",
            "notes": null
          },
          {
            "name": "ConsolFreight",
            "website": "https://www.consolfreight.io/",
            "domain": "consolfreight.io",
            "notes": null
          },
          {
            "name": "Credix",
            "website": "https://www.credix.finance",
            "domain": "credix.finance",
            "notes": null
          },
          {
            "name": "Frigg",
            "website": "https://www.frigg.eco",
            "domain": "frigg.eco",
            "notes": null
          },
          {
            "name": "New Silver",
            "website": "https://newsilver.com/",
            "domain": "newsilver.com",
            "notes": null
          },
          {
            "name": "Pontoro",
            "website": "https://www.pontoro.com",
            "domain": "pontoro.com",
            "notes": null
          },
          {
            "name": "0xequity",
            "website": "https://www.0xequity.com/",
            "domain": "0xequity.com",
            "notes": null
          },
          {
            "name": "Canza Finance",
            "website": "https://canza.io/",
            "domain": "canza.io",
            "notes": null
          },
          {
            "name": "DeFa By InvoiceMate",
            "website": "https://www.imdefa.com/",
            "domain": "imdefa.com",
            "notes": null
          },
          {
            "name": "Empowa",
            "website": "https://www.empowa.io/",
            "domain": "empowa.io",
            "notes": null
          },
          {
            "name": "Hifi Finance",
            "website": "https://hifi.finance/",
            "domain": "hifi.finance",
            "notes": null
          },
          {
            "name": "Pareto",
            "website": "https://pareto.credit/",
            "domain": "pareto.credit",
            "notes": null
          },
          {
            "name": "TrueFi",
            "website": "https://forum.truefi.io/",
            "domain": "forum.truefi.io",
            "notes": null
          },
          {
            "name": "BantuSaku",
            "website": "https://bantusaku.id/",
            "domain": "bantusaku.id",
            "notes": null
          },
          {
            "name": "Bulla Network",
            "website": "https://www.bulla.network/",
            "domain": "bulla.network",
            "notes": null
          },
          {
            "name": "Liquity Protocol",
            "website": "https://www.liquity.org/",
            "domain": "liquity.org",
            "notes": null
          },
          {
            "name": "Stable (mortgage protocol)",
            "website": "https://trystable.co/",
            "domain": "trystable.co",
            "notes": null
          },
          {
            "name": "RAAC",
            "website": "https://raac.io/",
            "domain": "raac.io",
            "notes": null
          }
        ]
      }
    ]
  },
  {
    "section": "Insurance",
    "categories": [
      {
        "category": "Insurance",
        "entities": [
          {
            "name": "Meanwhile",
            "website": "https://www.meanwhile.bm",
            "domain": "meanwhile.bm",
            "notes": "Bermuda-regulated bitcoin-denominated life insurance."
          },
          {
            "name": "Firelight",
            "website": "https://firelight.finance",
            "domain": "firelight.finance",
            "notes": "Sentora-built DeFi insurance layer. Flare/XRP + Lombard BTC markets."
          },
          {
            "name": "Re",
            "website": "https://www.re.xyz",
            "domain": "re.xyz",
            "notes": "Onchain reinsurance protocol. NOT the same as OnRe."
          },
          {
            "name": "Nexus Mutual",
            "website": "https://nexusmutual.io",
            "domain": "nexusmutual.io",
            "notes": "$6B+ protected since 2019. 70+ discrete covers."
          },
          {
            "name": "Arbol",
            "website": "https://www.arbol.io/",
            "domain": "arbol.io",
            "notes": null
          },
          {
            "name": "Ensuro",
            "website": "https://www.ensuro.co",
            "domain": "ensuro.co",
            "notes": null
          },
          {
            "name": "infineo",
            "website": "https://infineo.ai/",
            "domain": "infineo.ai",
            "notes": null
          },
          {
            "name": "OnRe",
            "website": "https://www.onre.finance/",
            "domain": "onre.finance",
            "notes": null
          },
          {
            "name": "Carapace Finance",
            "website": "https://www.carapace.finance",
            "domain": "carapace.finance",
            "notes": null
          },
          {
            "name": "Etherisc",
            "website": "https://etherisc.com/",
            "domain": "etherisc.com",
            "notes": null
          },
          {
            "name": "Five Sigma",
            "website": "https://fivesigmalabs.com/",
            "domain": "fivesigmalabs.com",
            "notes": null
          }
        ]
      }
    ]
  },
  {
    "section": "Wallet Infrastructure",
    "categories": [
      {
        "category": "Wallet Infrastructure",
        "entities": [
          {
            "name": "Privy",
            "website": "https://www.privy.io",
            "domain": "privy.io",
            "notes": "Embedded wallets. Acquired by Stripe."
          },
          {
            "name": "Dynamic",
            "website": "https://www.dynamic.xyz",
            "domain": "dynamic.xyz",
            "notes": "Embedded wallets / auth."
          },
          {
            "name": "Fireblocks",
            "website": "https://www.fireblocks.com",
            "domain": "fireblocks.com",
            "notes": "MPC custody. T-RIZE partner."
          },
          {
            "name": "Fordefi",
            "website": "https://fordefi.com",
            "domain": "fordefi.com",
            "notes": "Institutional MPC wallet."
          },
          {
            "name": "BitGo",
            "website": "https://bitgo.com/",
            "domain": "bitgo.com",
            "notes": null
          },
          {
            "name": "Taurus",
            "website": "https://www.taurushq.com",
            "domain": "taurushq.com",
            "notes": null
          },
          {
            "name": "DLT Finance",
            "website": "https://dlt-finance.com/",
            "domain": "dlt-finance.com",
            "notes": null
          },
          {
            "name": "Smart Token Labs",
            "website": "https://smarttokenlabs.com/",
            "domain": "smarttokenlabs.com",
            "notes": null
          },
          {
            "name": "Anchorage",
            "website": "https://www.anchorage.com/",
            "domain": "anchorage.com",
            "notes": null
          },
          {
            "name": "Copper",
            "website": "https://copper.co/en-us",
            "domain": "copper.co",
            "notes": null
          },
          {
            "name": "Fidelity Digital Assets",
            "website": "https://fidelitydigitalassets.com/",
            "domain": "fidelitydigitalassets.com",
            "notes": null
          },
          {
            "name": "Hex Trust",
            "website": "https://www.hextrust.com/",
            "domain": "hextrust.com",
            "notes": null
          },
          {
            "name": "THE Foundation",
            "website": "https://foundationnetwork.org/",
            "domain": "foundationnetwork.org",
            "notes": null
          }
        ]
      }
    ]
  },
  {
    "section": "Wallets",
    "categories": [
      {
        "category": "Wallets",
        "entities": [
          {
            "name": "MetaMask",
            "website": "https://metamask.io",
            "domain": "metamask.io",
            "notes": "Duplicate."
          },
          {
            "name": "Rabby",
            "website": "https://rabby.io",
            "domain": "rabby.io",
            "notes": "DeBank's wallet."
          },
          {
            "name": "World App",
            "website": "https://world.org",
            "domain": "world.org",
            "notes": "Worldcoin / Tools for Humanity."
          },
          {
            "name": "Trust Wallet",
            "website": "https://trustwallet.com",
            "domain": "trustwallet.com",
            "notes": null
          },
          {
            "name": "Base",
            "website": "https://www.base.app",
            "domain": "base.app",
            "notes": "Base App (consumer) vs base.org (chain). Map lists it under Wallets."
          },
          {
            "name": "OKX",
            "website": "https://www.okx.com",
            "domain": "okx.com",
            "notes": null
          },
          {
            "name": "OnchainLabs",
            "website": "https://onchainlabs.ch/",
            "domain": "onchainlabs.ch",
            "notes": null
          },
          {
            "name": "Exodus Movement",
            "website": "https://www.exodus.com/",
            "domain": "exodus.com",
            "notes": null
          }
        ]
      }
    ]
  },
  {
    "section": "Fintech",
    "categories": [
      {
        "category": "Fintech",
        "entities": [
          {
            "name": "Revolut",
            "website": "https://www.revolut.com",
            "domain": "revolut.com",
            "notes": "65M users. $10.5B stablecoin volume by end-2025."
          },
          {
            "name": "Cash App",
            "website": "https://cash.app",
            "domain": "cash.app",
            "notes": "Block."
          },
          {
            "name": "Robinhood",
            "website": "https://robinhood.com",
            "domain": "robinhood.com",
            "notes": "Tokenized equities in EU."
          },
          {
            "name": "Venmo",
            "website": "https://venmo.com",
            "domain": "venmo.com",
            "notes": "PayPal-owned."
          },
          {
            "name": "Wise",
            "website": "https://wise.com",
            "domain": "wise.com",
            "notes": null
          },
          {
            "name": "PayPal",
            "website": "https://www.paypal.com",
            "domain": "paypal.com",
            "notes": "Duplicate."
          },
          {
            "name": "Gluwa",
            "website": "https://gluwa.com/",
            "domain": "gluwa.com",
            "notes": null
          },
          {
            "name": "Particula",
            "website": "https://particula.io/",
            "domain": "particula.io",
            "notes": null
          },
          {
            "name": "Bankhaus Scheich",
            "website": "https://www.bankhaus-scheich.de",
            "domain": "bankhaus-scheich.de",
            "notes": null
          },
          {
            "name": "RWA.xyz",
            "website": "https://app.rwa.xyz/",
            "domain": "app.rwa.xyz",
            "notes": null
          },
          {
            "name": "Parvis",
            "website": "https://www.parvisinvest.com/",
            "domain": "parvisinvest.com",
            "notes": null
          },
          {
            "name": "Carbon.Credit",
            "website": "https://carbon.credit/",
            "domain": "carbon.credit",
            "notes": null
          },
          {
            "name": "GROW Inc",
            "website": "https://www.grow.inc/",
            "domain": "grow.inc",
            "notes": null
          },
          {
            "name": "Security Token Market (STM.co)",
            "website": "https://www.stm.co/",
            "domain": "stm.co",
            "notes": null
          },
          {
            "name": "Foretoken",
            "website": "https://foretoken.xyz/",
            "domain": "foretoken.xyz",
            "notes": null
          },
          {
            "name": "Futu",
            "website": "https://futuholdings.com/",
            "domain": "futuholdings.com",
            "notes": null
          },
          {
            "name": "AMINA Bank (formerly SEBA)",
            "website": "https://aminagroup.com/",
            "domain": "aminagroup.com",
            "notes": null
          },
          {
            "name": "Sygnum",
            "website": "https://www.sygnum.com/",
            "domain": "sygnum.com",
            "notes": null
          },
          {
            "name": "Upvest",
            "website": "https://upvest.co/",
            "domain": "upvest.co",
            "notes": null
          },
          {
            "name": "Gate",
            "website": "https://www.gate.com/",
            "domain": "gate.com",
            "notes": null
          },
          {
            "name": "Mercado Bitcoin",
            "website": "https://www.mercadobitcoin.com.br/",
            "domain": "mercadobitcoin.com.br",
            "notes": null
          },
          {
            "name": "Figure Markets",
            "website": "https://www.figuremarkets.com/",
            "domain": "figuremarkets.com",
            "notes": null
          }
        ]
      }
    ]
  },
  {
    "section": "Neobanks",
    "categories": [
      {
        "category": "Neobanks",
        "entities": [
          {
            "name": "ether.fi",
            "website": "https://ether.fi",
            "domain": "ether.fi",
            "notes": "EtherFi Cash — self-custodial Visa from a restaking protocol."
          },
          {
            "name": "KAST",
            "website": "https://www.kast.xyz",
            "domain": "kast.xyz",
            "notes": "$80M Series A at $600M val. 1M users, 170+ countries. Legal entity: Troia Corp."
          },
          {
            "name": "Avici",
            "website": "https://avici.money/",
            "domain": "avici.money",
            "notes": "Crypto-secured Visa credit card, self-custody. $AVICI token. VERIFY DOMAIN."
          },
          {
            "name": "Plasma",
            "website": "https://www.plasma.to",
            "domain": "plasma.to",
            "notes": "Plasma One neobank. Duplicate of chain entry."
          },
          {
            "name": "ur.app",
            "website": "https://ur.app",
            "domain": "ur.app",
            "notes": "UR — European crypto neobank."
          },
          {
            "name": "DolarApp",
            "website": "https://dolarapp.com",
            "domain": "dolarapp.com",
            "notes": "LatAm digital-dollar account. Map label reads 'Dollar App'."
          },
          {
            "name": "GalaxyOne",
            "website": "https://www.galaxy.com",
            "domain": "galaxy.com",
            "notes": "Galaxy Digital's retail platform. Find the /one or standalone URL."
          }
        ]
      }
    ]
  },
  {
    "section": "Oracles",
    "categories": [
      {
        "category": "Oracles",
        "entities": [
          {
            "name": "Chainlink",
            "website": "https://chain.link",
            "domain": "chain.link",
            "notes": "Powers T-RIZE Proof of Reserve/Origin/Process."
          },
          {
            "name": "Chronicle",
            "website": "https://chroniclelabs.org",
            "domain": "chroniclelabs.org",
            "notes": "Sky-native oracle. Prices ACRDX."
          },
          {
            "name": "RedStone",
            "website": "https://redstone.finance",
            "domain": "redstone.finance",
            "notes": "Co-authored the 2026 RWA standards report."
          },
          {
            "name": "Pyth",
            "website": "https://www.pyth.network",
            "domain": "pyth.network",
            "notes": null
          },
          {
            "name": "Parcl Labs",
            "website": "https://www.parcllabs.com/",
            "domain": "parcllabs.com",
            "notes": null
          },
          {
            "name": "Truflation",
            "website": "https://truflation.com/",
            "domain": "truflation.com",
            "notes": null
          },
          {
            "name": "DIA",
            "website": "https://www.diadata.org/",
            "domain": "diadata.org",
            "notes": null
          }
        ]
      }
    ]
  },
  {
    "section": "Historical",
    "categories": [
      {
        "category": "Historical Initiatives",
        "entities": [
          {
            "name": "Bru Finance",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Numa",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Parabol",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "TrueFi Asset Vaults",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Aconomy Foundation",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "AmberIsland",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "AnotherBlock",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "ArkeFi",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Arkive",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "ArtFi",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Bosonic",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Brightvine",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Cadence Protocol",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Canto",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Carbify",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Carbonds",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Cogito Finance",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Daylight Energy (by Anode Labs)",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Degen Distillery",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Ekta",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Florence Finance",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Fluent Finance",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Frictionless Markets",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Harbor Trade",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "IAN",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Invaria2222",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Kettle Finance",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Kinto",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Labs Groupio",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "LandX",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Mohash",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Mortar",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Moss",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Nash21",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "OpenChrono",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Penomo",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Planet ReFi",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "PurpleFi",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "R3 Corda",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Revenly.ai",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "REX Protocol",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Robinland",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Solidblock",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "SolidViolet",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Stream Protocol",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Trident Digital",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Unlockd",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Vortex (by Petale)",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Watches.io",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Altr Lend (by LuciDAO)",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Angle",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Archblock",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "CACHE Gold",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Landshare",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Lisk",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Mountain Protocol",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Unikura",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "AlloyCapital",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Alta Finance",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Arcton",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Aurus",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Bluejay Finance",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Cerchia",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Certo stUSD",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "CompanyDAO",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "DeltaP3",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Embedr",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Emerald",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Jasmine Energy",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Joltify",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "LevinSwap",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Neutral Exchange",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Pleno",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Qorra",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Skyhookcapital",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Thovt",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Uranium3o8",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Weown",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "YakDAO",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Yieldteq",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Atlendis",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Axon Protocol",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "CellarDAO",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Comdex",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Dexstar",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "GMP (Gen M Partners)",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Horly.app",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "KreskoFi",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "LoPo Finance",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Phyken Network",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "PV01",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "RWATA",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Sapling",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Solid.world",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Solteria (by Solty Labs)",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Ubuntu Glamping $UGST",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Vanbex",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Vayu.trade",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "VentureClub",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Whimsy Estates",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Epoch Island",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Etana Custody",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "LTO Network",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Linear",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Lucidao",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "MetaZero",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Mintify",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Rentible",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Sailing Protocol",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Sologenic",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "TrendX",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Union Protocol",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "dAMM Finance",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "impactMarket",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Membrane Finance",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Open Money DAO",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "PT Rupiah Token",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Record Nexus",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Altai",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Exim Token",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Kinka",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "LOD3",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "BricksEstate",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Decentralverse AI",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "PiXL",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "CMB International",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "CycleX",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Sharingblock",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Taikang",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "VIVI COIN",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "VyronexVNX",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Remora Markets",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Anvl.finance",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Fiide",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "KWARXS",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Mu Digital",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "OASES Global",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "SylvaTrust NextGen",
            "website": "",
            "domain": "",
            "notes": null
          },
          {
            "name": "Tokenise (tokenise.tech)",
            "website": "",
            "domain": "",
            "notes": "Archived by reviewer decision after the tokenise.tech website failed access checks. The separately listed tokenise.io offering retains its existing status."
          }
        ]
      }
    ]
  }
];

// Curated overlap: map company (exact name) -> priced token id. Clicking one of these tiles
// opens the RICH token panel (price + recent news + "How is this RWA?") instead of the light
// company card. Hand-verified to avoid fuzzy mismatches.
export const ENTITY_TOKEN_LINKS: Record<string, string> = {
  BlackRock: 'buidl',
  Centrifuge: 'centrifuge',
  Circle: 'usyc',
  Figure: 'figr-heloc',
  'Franklin Templeton': 'benji',
  Goldfinch: 'goldfinch',
  Maple: 'maple',
  Ondo: 'ondo',
  Paxos: 'pax-gold',
  Pendle: 'pendle',
  Plume: 'plume',
  Provenance: 'provenance',
  Spiko: 'eutbl',
  Stellar: 'stellar',
  Superstate: 'ustb',
  'Tether (XAUT)': 'tether-gold',
  'Janus Henderson': 'jtrsy',
};
