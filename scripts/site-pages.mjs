import {reportPages} from './research-reports.mjs';
export const origin='https://www.rwaf.xyz';
export const pages=[
 {id:'home',path:'/',title:'RWA Foundation · Open access to onchain finance',description:'Explore real-world asset tokenization with RWA Foundation: industry news, research, companies, jobs and plain-English education for the onchain economy.'},
 {id:'foundation',path:'/members/',title:'Our Members & Mission · RWA Foundation',description:'Meet the RWA Foundation member companies and learn about our nonprofit mission to make tokenized real-world assets trustworthy, understood and open to everyone.'},
 {id:'membership',path:'/membership/',title:'Apply for Membership · RWA Foundation',description:'Apply to join RWA Foundation. Tell us about your company, tokenization experience and interest in collaborating with the RWA community.'},
 {id:'eco',path:'/ecosystem/',title:'RWA Ecosystem Directory, Map & Stats · RWA Foundation',description:'Explore the RWA company directory and ecosystem map. Search tokenization providers, stablecoins, institutions and infrastructure, and view sourced industry statistics.'},
 {id:'news',path:'/news/',title:'RWA News & Tokenization Archive · RWA Foundation',description:'Follow real-world asset and tokenization news, search archived headlines, and discover updates from RWA Foundation member companies.'},
 {id:'jobs',path:'/jobs/',title:'RWA Jobs & Careers in Tokenization · RWA Foundation',description:'Find recent jobs at real-world asset, tokenization and blockchain companies. Filter roles by location, employment type, posting date and RWAF membership.'},
 {id:'learn',path:'/learn/',title:'RWAs Explained: A Beginner’s Guide · RWA Foundation',description:'Learn the basics of real-world assets onchain: wallets, stablecoins, RWA vaults, token trading and borrowing, explained in plain English.'},
 {id:'wallynft',path:'/wally-nft/',title:'WALLY NFT Community · RWA Foundation',description:'Discover the WALLY NFT collection, its community of real-world asset supporters, and how the collection supports the RWA Foundation mission.'},
 {id:'meet',path:'/meet/',title:'Meet WALLY · RWA Foundation',description:'Meet WALLY, the face of open finance. Watch the trailer and explore the mission, mind and community behind RWA Foundation and WALLY NFT.'},
 {id:'newsletter',path:'/newsletter/',title:'Join the Herd Newsletter · RWA Foundation',description:'Subscribe to the RWA Foundation newsletter for updates from the real-world asset economy, research and the Herd community.'},
 {id:'brandkit',path:'/media-kit/',title:'Media Kit, Logos & Brand Guidelines · RWA Foundation',description:'Download official RWA Foundation and WALLY logos, PNG artwork and PDF brand guidelines. Find the brand colors and typography for your next feature.'},
 {id:'fastSubmit',path:'/fast-submit/',title:'Fast Submit · RWA Foundation',description:'Team link submissions for RWAF news, jobs and ecosystem listings.',noindex:true},
 {id:'admin',path:'/admin/',title:'Admin Console · RWA Foundation',description:'RWA Foundation administration for members, news, jobs and ecosystem submissions.',noindex:true},
 {id:'research',path:'/research/',title:'RWA Research Reports · RWA Foundation',description:'Read RWA Foundation research reports on tokenized assets, market structure and RWA perpetual futures, produced with our data partners.'},
 {id:'wallyArticles',path:'/research/wally/',title:'WALLY Articles · RWA Foundation Research',description:'Read WALLY’s latest long-form articles on real-world assets, open finance and the onchain economy, published through the official WALLY account on X.'},
 {id:'zeusArticles',path:'/research/zeus/',title:'Zeus’ Corner · RWA Foundation Research',description:'Explore Zeus’ Corner: long-form articles and perspectives on real-world asset tokenization and the onchain economy from ZeusRWA on X.'},
 {id:'perpsReport',path:'/research/rwa-perps-sep-2026/',title:'RWA Perpetuals Report — September 2026 · RWA Foundation',description:'Explore the September 2026 RWA Perpetuals Report with DefiLlama: trading venues, asset classes and reference-asset groups in onchain perpetual futures.'},
 {id:'marketReport',path:'/research/market-structure-aug-2026/',title:'Market Structure Report — August 2026 · RWA Foundation',description:'Read the August 2026 Market Structure Report with Token Terminal, covering stablecoins, tokenized funds, private credit, commodities and equities.'},
 ...reportPages,
 {id:'guide',path:'/guide/',title:"Wally's RWA Textbook · RWA Foundation",description:'Learn about tokenized real-world assets with Wally’s RWA Textbook: watch the film, play Tokens, Please, or read the illustrated lessons.'}
];
export const aliases={'/foundation/':'/members/','/brand/':'/media-kit/','/brandkit/':'/media-kit/','/eco/':'/ecosystem/','/careers/':'/jobs/','/articles/':'/research/','/home/':'/'};
