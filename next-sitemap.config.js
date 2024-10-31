/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://stickify.ru",
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
  },
  changefreq: "daily",
  priority: 0.7,
};
