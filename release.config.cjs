const fs = require("fs");
const path = require("path");

const mainTemplate = fs.readFileSync(
  path.join(__dirname, ".release", "release-notes.hbs"),
  "utf8"
);

module.exports = {
  tagFormat: "v${version}",

  branches: [
    "main",
    { name: "beta", prerelease: true }
  ],

  plugins: [
    [
      "@semantic-release/commit-analyzer",
      { preset: "conventionalcommits" }
    ],

    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        writerOpts: {
          mainTemplate
        }
      }
    ],

    [
      "@semantic-release/github",
      {
        draftRelease: true,
        assets: [
          {
            path: "trafikinfo-se-alert-card.js",
            label: "trafikinfo-se-alert-card.js"
          }
        ]
      }
    ]
  ]
};