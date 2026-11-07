# Search Discovery Operations

The site exposes crawlable HTML, a canonical domain, structured data,
`robots.txt`, and `sitemap.xml`. Search engines decide when and whether a page
is indexed; deployment does not guarantee ranking or immediate inclusion.

## Current production endpoints

- Sitemap: https://www.learnbyshorts.com/sitemap.xml
- Robots: https://www.learnbyshorts.com/robots.txt
- Primary course: https://www.learnbyshorts.com/learn-v2/index.html

## Webmaster setup

1. Verify `https://www.learnbyshorts.com/` as a domain property in Google Search
   Console, using DNS verification when possible.
2. Submit `sitemap.xml` in Google Search Console.
3. Verify the site in Bing Webmaster Tools and submit the same sitemap.
4. Review indexing, page experience, structured-data, security, and crawl
   reports monthly.
5. Add only real, useful course pages to the sitemap. Do not generate thin or
   duplicated keyword pages.

Official operational references:

- Google sitemap guidance:
  https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Bing Webmaster Tools:
  https://www.bing.com/webmasters/
- IndexNow:
  https://www.indexnow.org/documentation

## Release checklist

- Page has a unique title, description, H1, canonical URL, and useful content.
- Links are ordinary HTML links reachable without authentication.
- Structured data describes visible page content and validates as JSON.
- The production URL returns successfully through CloudFront.
- Direct S3 origin access remains denied.
- Sitemap `lastmod` changes only when page content materially changes.
- Search-performance exports are archived in the impact evidence folder.

