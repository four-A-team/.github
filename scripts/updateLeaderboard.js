const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const table = require("markdown-table");

const owner = "FOUR-A-TEAM"; 
const repo = "absensi-karyawan"; 
const token = process.env.GITHUB_TOKEN || ""; 

const octokit = new Octokit({ auth: token });

(async () => {
  const { data: contributors } = await octokit.repos.listContributors({
    owner,
    repo,
  });

  const leaderboard = contributors.map((c, i) => [
    `${i + 1}`,
    `**${c.login}**`,
    `${c.contributions} commits`,
    `${c.contributions * 2} pts`,
  ]);

  const tableData = [["Peringkat", "Anggota", "Aktivitas", "Poin"], ...leaderboard];

  const newSection = `
## 🏆 Leaderboard Kontributor

> Anggota paling aktif akan ditraktir sama **Ammar** 🍽️  
> Perhitungan berdasarkan commit, PR, issues, dan aktivitas di GitHub.

${table(tableData)}
`;

  let readme = fs.readFileSync("README.md", "utf-8");

  // replace section Leaderboard kalau sudah ada
  if (readme.includes("## 🏆 Leaderboard Kontributor")) {
    readme = readme.replace(
      /## 🏆 Leaderboard Kontributor[\s\S]*?(?=## 🎖️|$)/,
      newSection
    );
  } else {
    // kalau belum ada, tambahkan sebelum Hall of Fame
    readme = readme.replace("## 🎖️ Hall of Fame", newSection + "\n\n## 🎖️ Hall of Fame");
  }

  fs.writeFileSync("README.md", readme);
})();
