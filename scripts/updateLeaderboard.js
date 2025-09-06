// scripts/updateLeaderboard.js
const { execSync } = require("child_process");
const fs = require("fs");

// ambil daftar commit per user
const log = execSync("git log --pretty='%an'").toString();

// hitung jumlah commit tiap user
const counts = {};
log.split("\n").forEach(name => {
  if (!name.trim()) return;
  counts[name] = (counts[name] || 0) + 1;
});

// urutkan berdasarkan jumlah commit terbanyak
const leaderboard = Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .map(([name, commits], i) => `${i + 1}. **${name}** — ${commits} commits`)
  .join("\n");

// bikin output untuk README
const output = `
## 🏆 Leaderboard Anggota Paling Aktif

${leaderboard}

> Leaderboard ini otomatis diperbarui setiap commit push ke branch *main*.
`;

fs.writeFileSync("LEADERBOARD.md", output);

// sisipkan leaderboard ke README.md
let readme = fs.readFileSync("README.md", "utf-8");
const start = "<!--LEADERBOARD_START-->";
const end = "<!--LEADERBOARD_END-->";

const regex = new RegExp(`${start}[\\s\\S]*${end}`);
readme = readme.replace(regex, `${start}\n${output}\n${end}`);

fs.writeFileSync("README.md", readme);
