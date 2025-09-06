// scripts/updateLeaderboard.js
const fs = require("fs");
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = "four-A-team";  // ganti dengan nama org kamu
const repo = ".github";       // repo tempat README

async function main() {
  const members = ["Ammar", "Atha", "Ayu", "Arini"];
  const scores = {};

  for (const m of members) {
    scores[m] = { commits: 0, prs: 0, issues: 0, reviews: 0, total: 0 };
  }

  // hitung commits
  const commits = await octokit.repos.listCommits({ owner, repo, per_page: 100 });
  commits.data.forEach(c => {
    const author = c.commit.author.name;
    if (scores[author]) {
      scores[author].commits++;
    }
  });

  // hitung pull requests
  const prs = await octokit.pulls.list({ owner, repo, state: "all", per_page: 100 });
  prs.data.forEach(pr => {
    const author = pr.user.login;
    if (scores[author]) {
      scores[author].prs++;
    }
  });

  // hitung issues
  const issues = await octokit.issues.listForRepo({ owner, repo, state: "all", per_page: 100 });
  issues.data.forEach(issue => {
    if (!issue.pull_request) {
      const author = issue.user.login;
      if (scores[author]) {
        scores[author].issues++;
      }
    }
  });

  // hitung review PR
  for (const pr of prs.data) {
    const reviews = await octokit.pulls.listReviews({ owner, repo, pull_number: pr.number });
    reviews.data.forEach(r => {
      const reviewer = r.user.login;
      if (scores[reviewer]) {
        scores[reviewer].reviews++;
      }
    });
  }

  // hitung total skor
  for (const m of members) {
    scores[m].total =
      scores[m].commits * 1 +
      scores[m].prs * 3 +
      scores[m].issues * 2 +
      scores[m].reviews * 2;
  }

  // buat leaderboard
  const leaderboard = Object.entries(scores)
    .sort((a, b) => b[1].total - a[1].total)
    .map(
      ([name, s], i) =>
        `${i + 1}. **${name}** — 📝 ${s.commits} commits | 🔀 ${s.prs} PR | ❗ ${s.issues} issues | 👀 ${s.reviews} reviews | ⭐ Total: ${s.total}`
    )
    .join("\n");

  const output = `
## 🏆 Leaderboard Anggota Paling Aktif

${leaderboard}

> Update otomatis dari aktivitas GitHub (commit, PR, issue, review).
`;

  fs.writeFileSync("LEADERBOARD.md", output);

  let readme = fs.readFileSync("README.md", "utf-8");
  const start = "<!--LEADERBOARD_START-->";
  const end = "<!--LEADERBOARD_END-->";
  const regex = new RegExp(`${start}[\\s\\S]*${end}`);
  readme = readme.replace(regex, `${start}\n${output}\n${end}`);
  fs.writeFileSync("README.md", readme);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
