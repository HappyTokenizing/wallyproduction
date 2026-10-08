# Exits classification — 7 October 2026

The former Failed Initiatives summary card is now **Exits**. It counts documented completed mergers and acquisitions, once per transaction ID. The matching Exits — M&A status filter includes both current and historical profiles with qualifying transactions. Acquisitions do not automatically make an operating company historical.

Eight reviewed transactions are recorded in `data/research/exits.json`: Hashnote/Circle, Membrane Finance/Paxos, Tokeny/Apex (controlling majority), Oasis Pro/Ondo, Backed/Payward, tradias/Boerse Stuttgart Digital, Coreum–Sologenic/TX and Amberdata/Kaiko. Each includes an official source, target, counterparty, review date and explanatory text in the profile dialog. Amberdata is represented under its existing Kaiko alias; Coreum and Sologenic's combined transaction is counted once under TX. These are the verified directory transactions, not a claim to cover every M&A deal in the industry.

The count excludes closures, bankruptcies, standalone rebrands and announced transactions without verified completion. Mountain Protocol and Zodia Custody are not counted based solely on their conditional acquisition announcements. Product aliases such as xStocks do not create additional deals.

Neufund was absent from the previous directory. Its own 10 January 2022 closure FAQ confirms that platform access ended on 17 January 2022. It is now a historical profile with a Closed lifecycle, a documented closure flag and the official publication linked as evidence. It and Archblock remain excluded from Exits. The former Neufund domain is withheld from website navigation.

Totals: 1,131 profiles, 957 current, 140 historical, 34 awaiting review, and 8 documented M&A exits. The live admin roster still supplies the member count.

Validation: `npm ci`, 68 passing tests, reproducible import output, and clean diff checks. Chromium verified the summary, Exits filter, transaction evidence, Neufund's historical-only visibility, M&A-only map, and mobile layout with no page errors. Changes target staging only.
