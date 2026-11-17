# robweb

Robin Clevett's new website (replacing the WordPress site at robc.co.uk), served at https://robweb.wolf.uk.com.

- Box: `wolf` LXC (10.0.10.118), `/root/robweb`, port 6980 (`./start.sh`, screen `robweb`).
- Public: `*.wolf.uk.com` resolves to the Hetzner edge (116.202.127.6); the edge nginx proxies robweb.wolf.uk.com to 10.0.10.118:6980 with Let's Encrypt (set up by Paul, same as mfs.wolf.uk.com).
- Today (17 Nov 2026) it serves a noindex holding page from `public/` via `serve.mjs`; the rebuild replaces it.

## Findings that shape the rebuild (17 Nov 2026)
- robc.co.uk is WordPress 7.1.4 (theme exs-pro; Contact Form 7, YouTube Embed Plus), 20 pages, DNS at livedns (ns1-3.livedns.co.uk), A 116.202.127.16.
- It has NO Google Analytics tag on any page, so its GA4 property "Robc.co.uk" (262364074, G-XQNLT1H91R, in Ian's account "UKBITCOINBLOG") has never received data.
- Every page links to toolsandjigs.com (Robin's Shopify, cf7084-4.myshopify.com, GA4 G-8C03SDGZYL) without UTM tags, which is why Shopify reports robc.co.uk as its top referrer.
- The new site must ship with GA4 (consent-first) and UTM-tagged links to the shop so both sides can prove it.
