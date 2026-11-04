import { seedDemoShowIfEmpty, getDb, listShows } from "../src/lib/db";

getDb();
seedDemoShowIfEmpty();
for (const show of listShows(true)) {
  console.log(`#${show.id} ${show.title} | ${show.startsAt} | ${show.venue} | cap ${show.capacity}`);
}
console.log("Database ready at data/tickets.db");
