import { Octokit } from "@octokit/rest";
import fs from "fs";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const org = "FOUR-A-TEAM"; // ganti dengan nama organisasi mu

async function main() {
  // Ambil daftar anggota organisasi
  const { data: members } = await octokit.orgs.listMembers({
    org,
  });

  let leaderboard = [];

  for (const member of members) {
    // Hitung kontribusi publik di seluruh GitHub
    const { data: user } = await octokit.users.getByUsername({
      username: member.login,
    });

    leaderboard.push({
      login: member.login,
      contributions: user.public_repos + user.followers, // metrik sederhana
    });
  }

  // Urutkan berdasarkan kontribusi
  leaderboard.sort((a, b) => b.contributions - a.contributions);

  // Ambil top 5
  const top = leaderboard.slice(0, 5);

  // Buat tabel leaderboard
  let table = `# 🏆 Leaderboard Anggota Aktif\n\n`;
  table += `Hadiah akan diberikan oleh **Kapten Ammar** 🎁\n\n`;
  table += `| Peringkat | Anggota | Skor |\n`;
  table += `|-----------|---------|------|\n`;

  top.forEach((user, i) => {
    table += `| ${i + 1} | [@${user.login}](https://github.com/${user.login}) | ${user.contributions} |\n`;
  });

  // Tulis ke README.md
  fs.writeFileSync(".github/profile/README.md", table);
}

main();
