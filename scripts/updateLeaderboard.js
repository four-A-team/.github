const fs = require("fs");
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const ORG = "four-A-team";   // ganti sesuai nama org kamu
const FILE = ".github/profile/README.md";

async function main() {
  // Ambil member org
  const { data: members } = await octokit.orgs.listMembers({
    org: ORG,
    per_page: 100,
  });

  // Ambil kontribusi tiap member dari repo org
  let scores = {};
  for (const member of members) {
    const username = member.login;
    scores[username] = 0;

    // hitung kontribusi di semua repo org
    const { data: repos } = await octokit.repos.listForOrg({
      org: ORG,
      type: "all",
      per_page: 50,
    });

    for (const repo of repos) {
      const { data: commits } = await octokit.repos.listCommits({
        owner: ORG,
        repo: repo.name,
        author: username,
        per_page: 100,
      });

      scores[username] += commits.length;
    }
  }

  // Urutkan leaderboard
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  let table = `| Peringkat | Anggota | Kontribusi |\n|-----------|---------|-------------|\n`;
  sorted.forEach(([user, score], i) => {
    table += `| ${i + 1} | ${user} | ${score} |\n`;
  });

  // Update README
  let readme = fs.readFileSync(FILE, "utf-8");
  const start = "<!-- LEADERBOARD:START -->";
  const end = "<!-- LEADERBOARD:END -->";
  const regex = new RegExp(`${start}[\\s\\S]*${end}`);

  const replacement = `${start}\n${table}\n${end}`;
  readme = readme.replace(regex, replacement);

  fs.writeFileSync(FILE, readme);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
