import type { ReadLinesValue } from "./readLines";

export const DEMO_FILE_SIZE_ESTIMATE = 3 * 1024 * 1024 * 1024; // 5GB
export const DEMO_FILE_NAME = "demo.mbox";

// Generated with:
// new Array(20).fill().map(() => ({ name: faker.person.fullName(), email: faker.internet.email() }))
const DEMO_SENDERS = [
  { name: "Melinda Tillman", email: "Selina.Yundt@hotmail.com" },
  { name: "Julio Frami", email: "Fausto3@yahoo.com" },
  { name: "Carroll Heller", email: "Donavon_Abshire5@hotmail.com" },
  { name: "Margaret Hermann", email: "Liliana_Bins80@hotmail.com" },
  { name: "Camille Wisoky", email: "Vincent87@hotmail.com" },
  { name: "Jaime Hartmann", email: "Dell.Boyer@hotmail.com" },
  { name: "Jorge Heller", email: "Kristian_Quigley@gmail.com" },
  { name: "Kendra Kohler", email: "Berneice.Rodriguez@yahoo.com" },
  { name: "Ms. Sheila Deckow Sr.", email: "Emily.Gleichner@hotmail.com" },
  { name: "Dianna Grady III", email: "Kyle.Fisher@yahoo.com" },
  { name: "Marilyn Yost", email: "Rhoda26@yahoo.com" },
  { name: "George Grady", email: "Ella_Mante42@hotmail.com" },
  { name: "Courtney Hessel", email: "Kenton_Heathcote@gmail.com" },
  { name: "Morris West", email: "Dexter_Kunde@yahoo.com" },
  { name: "Johanna Ebert", email: "Dewayne_Bernier@gmail.com" },
  { name: "Caroline Lubowitz", email: "Leonora.Lueilwitz10@gmail.com" },
  { name: "Gerardo Legros DVM", email: "Spencer.Crona13@yahoo.com" },
  { name: "Tommy Kshlerin", email: "Aric.Lueilwitz71@gmail.com" },
  { name: "Sheri Wilkinson", email: "Philip24@gmail.com" },
  { name: "Ms. Angel Lind", email: "Issac_Walsh9@gmail.com" },
];

const LOREM_IPSUM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

const BYTES_PER_CHUNK = 10 * 1024 * 1024; // 1MB

export function* generateDemoLines(): Iterable<ReadLinesValue> {
  let totalBytes = 0;

  let linesThisChunk: string[] = [];
  let bytesThisChunk = 0;
  while (totalBytes < DEMO_FILE_SIZE_ESTIMATE) {
    while (bytesThisChunk < BYTES_PER_CHUNK) {
      const senderIdx = Math.floor(Math.random() * DEMO_SENDERS.length);
      const sender = DEMO_SENDERS[senderIdx]!;
      const numLines = Math.floor(Math.random() * 50 * (senderIdx / DEMO_SENDERS.length));
      const messageLines = [
        `From ${sender.name} <${sender.email}>`,
        `From: ${sender.name} <${sender.email}>`,
      ];
      for (let i = 0; i < numLines; i++) {
        messageLines.push(LOREM_IPSUM.substring(0, Math.floor(Math.random() * LOREM_IPSUM.length)));
      }
      for (const line of messageLines) {
        linesThisChunk.push(line);
        bytesThisChunk += line.length;
      }
    }
    totalBytes += bytesThisChunk;
    yield { lines: linesThisChunk, bytesRead: totalBytes };
    bytesThisChunk = 0;
    linesThisChunk = [];
  }
}
