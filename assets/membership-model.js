// Adapted from the existing RWAF membership questionnaire on 2026-10-13. The fee question is omitted.
export const membershipSections = ["Contact & company", "Your RWA experience", "Project & community", "Get involved"];
export const membershipFields = [
  {
    "key": "firstName",
    "label": "First name",
    "type": "text",
    "required": true,
    "max": 120,
    "section": 0
  },
  {
    "key": "lastName",
    "label": "Last name",
    "type": "text",
    "required": true,
    "max": 120,
    "section": 0
  },
  {
    "key": "email",
    "label": "Email",
    "type": "email",
    "required": true,
    "max": 254,
    "section": 0
  },
  {
    "key": "company",
    "label": "Company",
    "type": "text",
    "required": true,
    "max": 120,
    "section": 0
  },
  {
    "key": "website",
    "label": "Please share the company or project website URL:",
    "type": "url",
    "required": false,
    "section": 0,
    "max": 1000
  },
  {
    "key": "roles",
    "label": "Please select all that qualify. You would describe yourself as:",
    "type": "choices",
    "required": false,
    "section": 0,
    "max": 1000,
    "choices": [
      "RWA Issuer",
      "Tokenization Platform for RWAs",
      "Marketplace for RWAs",
      "DeFi or Lending for RWAs",
      "Infrastructure for RWAs",
      "Investor in RWAs",
      "Other"
    ],
    "multiple": true
  },
  {
    "key": "referral",
    "label": "How did you hear about the RWA Foundation?",
    "type": "choices",
    "required": true,
    "section": 0,
    "max": 1000,
    "choices": [
      "X/ Twitter",
      "Telegram",
      "STM",
      "Word of Mouth",
      "From an RWA Foundation Member",
      "Other"
    ],
    "multiple": true
  },
  {
    "key": "hasTokenized",
    "label": "Have you ever tokenized any RWAs directly or on behalf of clients?",
    "type": "yesno",
    "required": true,
    "section": 1,
    "max": 1000
  },
  {
    "key": "tokenizedDescription",
    "label": "Please describe what assets you have tokenized:",
    "type": "text",
    "required": true,
    "section": 1,
    "max": 1000,
    "hint": "Only a brief description is required",
    "when": {
      "hasTokenized": "Yes"
    }
  },
  {
    "key": "tokenizedValue",
    "label": "What's the total value in assets you have put onchain?",
    "type": "text",
    "required": false,
    "section": 1,
    "max": 1000,
    "when": {
      "hasTokenized": "Yes"
    }
  },
  {
    "key": "tokenizedAssets",
    "label": "What types of assets have you tokenized:",
    "type": "choices",
    "required": true,
    "section": 1,
    "max": 1000,
    "choices": [
      "Equities",
      "Funds",
      "Treasuries",
      "Stablecoins",
      "Real Estate",
      "Commodities",
      "Collectibles/ Art",
      "Other"
    ],
    "multiple": true,
    "when": {
      "hasTokenized": "Yes"
    }
  },
  {
    "key": "hasInvested",
    "label": "Have you invested in RWA tokens before?",
    "type": "yesno",
    "required": true,
    "section": 1,
    "max": 1000,
    "hint": "Say \"Yes\" if you are an VC investor in RWA infrastructure"
  },
  {
    "key": "investmentDescription",
    "label": "Give a brief description of what RWAs you hold and why:",
    "type": "text",
    "required": true,
    "section": 1,
    "max": 1000,
    "hint": "If you do not want to share, input NA. This is for informational purposes only and your answers will not be shared. ",
    "when": {
      "hasInvested": "Yes"
    }
  },
  {
    "key": "purchasedAssets",
    "label": "What types of RWAs have you purchased?:",
    "type": "choices",
    "required": true,
    "section": 1,
    "max": 1000,
    "choices": [
      "Equities",
      "Funds",
      "Treasuries",
      "Stablecoins",
      "Real Estate",
      "Commodities",
      "Collectibles/ Art",
      "Other"
    ],
    "multiple": true,
    "when": {
      "hasInvested": "Yes"
    }
  },
  {
    "key": "hasInfraInvestment",
    "label": "Have you ever invested in any RWA infrastructure companies or projects?",
    "type": "yesno",
    "required": true,
    "section": 1,
    "max": 1000,
    "when": {
      "hasInvested": "Yes"
    }
  },
  {
    "key": "infraDescription",
    "label": "Please share a description of what investments you have made and why:",
    "type": "text",
    "required": true,
    "section": 1,
    "max": 1000,
    "when": {
      "hasInvested": "Yes",
      "hasInfraInvestment": "Yes"
    }
  },
  {
    "key": "ventureGroup",
    "label": "Are you interested in joining a Venture working group for RWAs? Share deal flow, syndicate potential deals, etc.",
    "type": "yesno",
    "required": true,
    "section": 1,
    "max": 1000,
    "when": {
      "hasInvested": "Yes"
    }
  },
  {
    "key": "motivation",
    "label": "Why are you interested in joining the RWA Foundation?",
    "type": "choices",
    "required": true,
    "section": 1,
    "max": 1000,
    "hint": "You may select more than one! ",
    "choices": [
      "To support the RWA industry and collaborate with other members",
      "To build brand awareness for my company or project",
      "To find business development leads for my company or project",
      "To integrate my technology or service with the RWA ecosystem",
      "To create new initiatives and programs with the RWA Foundation",
      "Other"
    ],
    "multiple": true
  },
  {
    "key": "description",
    "label": "Please give a brief description of your RWA company or project:",
    "type": "textarea",
    "required": true,
    "section": 2,
    "max": 3000,
    "hint": "Include services, history, key clients... brag about yourself! "
  },
  {
    "key": "hasToken",
    "label": "Does your company or project have a governance or native token associated with it? (Say yes if its planned, but not live)",
    "type": "yesno",
    "required": true,
    "section": 2,
    "max": 1000,
    "hint": "NOT a tokenized asset or security but a crypto asset "
  },
  {
    "key": "ticker",
    "label": "What is the token ticker associated with the company or project:",
    "type": "text",
    "required": true,
    "section": 2,
    "max": 1000,
    "when": {
      "hasToken": "Yes"
    }
  },
  {
    "key": "tokenType",
    "label": "What type of token is it?",
    "type": "choices",
    "required": true,
    "section": 2,
    "max": 1000,
    "choices": [
      "Governance token related to DAO or protocol or application",
      "Native token used to transact for services",
      "Deflationary token (buy and burn using revenue)",
      "Community token",
      "Other"
    ],
    "multiple": false,
    "when": {
      "hasToken": "Yes"
    }
  },
  {
    "key": "tokenLive",
    "label": "Is the token live?",
    "type": "yesno",
    "required": true,
    "section": 2,
    "max": 1000,
    "when": {
      "hasToken": "Yes"
    }
  },
  {
    "key": "blockchain",
    "label": "What blockchain is the token minted on?",
    "type": "text",
    "required": true,
    "section": 2,
    "max": 1000,
    "hint": "If on multiple chains, please specify and reference interoperability provider",
    "when": {
      "hasToken": "Yes"
    }
  },
  {
    "key": "holders",
    "label": "Number of token holders?",
    "type": "text",
    "required": false,
    "section": 2,
    "max": 1000,
    "when": {
      "hasToken": "Yes"
    }
  },
  {
    "key": "community",
    "label": "Please tell us about the size of your community:",
    "type": "textarea",
    "required": true,
    "section": 2,
    "max": 3000,
    "hint": "Include social media accounts and followers, platform users, etc. "
  },
  {
    "key": "hasFunding",
    "label": "Have you raised any funding for your company or project?",
    "type": "yesno",
    "required": true,
    "section": 2,
    "max": 1000
  },
  {
    "key": "funding",
    "label": "How much have you raised? Please include lead and notable investors",
    "type": "text",
    "required": true,
    "section": 2,
    "max": 1000,
    "when": {
      "hasFunding": "Yes"
    }
  },
  {
    "key": "workingGroups",
    "label": "Which working groups would you be interested in participating in? (Monthly hour long meeting)",
    "type": "choices",
    "required": true,
    "section": 3,
    "max": 1000,
    "hint": "Suggest your own working group using the \"Other\" option",
    "choices": [
      "Creating Interoperability Standards for Multi-chain Assets",
      "Establishing Best Practices for Using RWAs for Treasury Management",
      "DeFi Composability for RWAs; Building Bridges for RWAs to DeFi",
      "Developing RWA Lending Markets, Risk Protections, and Safeguards",
      "Seeding Liquidity for RWA Markets",
      "Spearheading RWA Global Policy Advocacy",
      "Using Oracles and Ratings to Improve RWA Infrastructure",
      "Other"
    ],
    "multiple": true
  },
  {
    "key": "participation",
    "label": "Where else would you be interested in participating with the RWA Foundation?:",
    "type": "choices",
    "required": true,
    "section": 3,
    "max": 1000,
    "choices": [
      "Webinars and Media",
      "Research",
      "Community Development",
      "Co-branded Marketing Campaigns",
      "Hosting or Sponsoring Events",
      "Giveaway Contests (Airdrops or Merch)",
      "Building on the $WALLY ecosystem",
      "Other"
    ],
    "multiple": false
  },
  {
    "key": "mission",
    "label": "Final Question: What is your mission statement for RWAs?",
    "type": "text",
    "required": true,
    "section": 3,
    "max": 1000
  },
  {
    "key": "notes",
    "label": "Before you officially submit your application. Please include anything else you'd like us to know!",
    "type": "textarea",
    "required": false,
    "section": 3,
    "max": 3000
  }
];
export const fieldApplies = (field, values) => !field.when || Object.entries(field.when).every(([key,value]) => values[key] === value);
export function validateMembership(value) {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return {error:'Complete the application fields.'};
 const answers={},errors={};
 for (const field of membershipFields) {
  if (!fieldApplies(field,value)) continue;
  const input=value[field.key];
  if (field.type==='choices') {
   const items=Array.isArray(input)?input:[];
   if (!Array.isArray(input) && input!==undefined || items.length>field.choices.length || (!field.multiple&&items.length>1) || items.some(item=>!field.choices.includes(item)) || new Set(items).size!==items.length || (field.required&&!items.length)) {errors[field.key]='Select an option.';continue;}
   answers[field.key]=items;
   if(items.includes('Other')) {
    const other=value[field.key+'Other'];
    if(typeof other!=='string'||!other.trim()||other.length>500||/[\u0000-\u001f\u007f]/.test(other))errors[field.key]='Please describe your Other selection.';
    else answers[field.key+'Other']=other.trim();
   }
  } else {
   const text=typeof input==='string'?input.trim():'';
   if((input!==undefined&&typeof input!=='string')||text.length>field.max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)||(field.required&&!text)){errors[field.key]='Complete this field.';continue;}
   if(field.type==='yesno'&&!['Yes','No'].includes(text)){errors[field.key]='Choose Yes or No.';continue;}
   if(field.type==='email'&&!/^[^\s@:/<>]+@[^\s@:/<>]+\.[^\s@:/<>]+$/.test(text)){errors[field.key]='Enter a valid email address.';continue;}
   if(field.type==='url'&&text){try{const u=new URL(text);if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.'))throw Error();}catch{errors[field.key]='Use a full HTTPS website URL.';continue;}}
   answers[field.key]=field.type==='email'?text.toLowerCase():text;
  }
 }
 return Object.keys(errors).length?{error:'Check the highlighted fields.',errors}:{answers};
}
