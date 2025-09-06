const fs = require("fs");
const path = require("path");
const { Octokit } = require("@octokit/rest");

const org = "FOUR-A-TEAM"; // Ganti dengan nama organisasi kamu
const members = ["Ammar", "Atha", "Ayu", "Arini"]; // username GitHub anggota

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // token otomatis dari GitHub Actions
});

async function getContributions(username) {
  let commits = 0;
  let issues = 0;
  let prs = 0;

  try {
    // Hitung commits (ambil dari events)
    const events = await octokit.activity.listEventsForUser({
      username,
      per_page: 100,
    });

    events.data.forEach((event) => {
      if (event.type === "PushEvent") {
        commits += event.payload.commits.length;
      }
      if (event.type === "IssuesEvent") {
        issues++;
      }
      if (event.type === "PullRequestEvent") {
        prs++;
      }
    });
  } catch (err) {
    console.error(`Error fetch ${username}:`, err.message);
  }

  return { username, commits, issues, prs, total: commits + issues + prs };
}

async function main() {
  const results = [];

  for (const member of members) {
    const stats = await getContributions(member);
    results.push(stats);
  }

  // Urutkan berdasarkan total kontribusi
  results.sort((a, b) => b.total - a.total);

  // Buat tabel markdown
  let leaderboard = `
## 🏆 Leaderboard Kontributor

Anggota paling aktif akan mendapatkan **hadiah spesial dari Kapten Ammar 🎁**  

| Peringkat | Anggota | Commits | Issues | PR | Total |
|-----------|---------|---------|--------|----|-------|
`;

  results.forEach((r, i) => {
    leaderboard += `| ${i + 1} | ${r.username} | ${r.commits} | ${r.issues} | ${r.prs} | ${r.total} |\n`;
  });

  leaderboard += `\n✨ Tetap semangat! Setiap kontribusi dihargai 💪\n`;

  // Update README.md
  const readmePath = path.join(__dirname, "../profile/README.md");
  let readme = fs.readFileSync(readmePath, "utf-8");

  // Ganti bagian leaderboard (pakai marker agar mudah update otomatis)
  const startMarker = "<!-- LEADERBOARD:START -->";
  const endMarker = "<!-- LEADERBOARD:END -->";

  const newSection = `${startMarker}\n${leaderboard}\n${endMarker}`;

  if (readme.includes(startMarker) && readme.includes(endMarker)) {
    readme = readme.replace(
      new RegExp(`${startMarker}[\\s\\S]*${endMarker}`),
      newSection
    );
  } else {
    // Kalau belum ada marker, append di bawah
    readme += `\n\n${newSection}\n`;
  }

  fs.writeFileSync(readmePath, readme);
  console.log("✅ Leaderboard updated!");
}

main();
