import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "node:dns/promises";
import User from "../models/User.js";
import Event from "../models/Event.js";

dotenv.config({ path: "./.env" });
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const cliArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const FORCE_RESEED = process.argv.includes("--force");

const DEFAULT_ADMIN_EMAIL =
  cliArgs[0] ||
  process.env.SEED_EVENTS_ADMIN_EMAIL ||
  "ahmedmaher-admin@eventify.com";

/** Spread dates between start and end (inclusive), evenly by index. */
function dateAt(index, total, start, end) {
  const t0 = start.getTime();
  const t1 = end.getTime();
  const t = total <= 1 ? t0 : t0 + ((t1 - t0) * index) / (total - 1);
  return new Date(t);
}

function seatsFromCapacity(capacity, fillRatio = 0.82) {
  const taken = Math.floor(capacity * fillRatio);
  return Math.max(1, capacity - taken);
}

/**
 * Demo + catalog events for RAG chatbot testing.
 * Images: Unsplash, Pexels, Pixabay (hotlink-friendly CDN URLs).
 */
const SEED_EVENTS = [
  {
    title: "Cairo Tech Innovation Summit 2026",
    description:
      "A one-day tech conference for developers and product teams. Talks on cloud, AI, and modern web stacks. Great for first-time conference attendees who want innovation and networking in Cairo.",
    location: "Cairo, Egypt — Smart Village Conference Center",
    category: "conference",
    capacity: 300,
    price: 89,
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Full-Stack Angular & Node Workshop",
    description:
      "Hands-on workshop building a full-stack app with Angular and Node.js. Includes live coding, Q&A, and starter project files. Ideal for developers learning production-ready patterns.",
    location: "Cairo, Egypt — Downtown Tech Hub",
    category: "workshop",
    capacity: 40,
    price: 45,
    image:
      "https://images.unsplash.com/photo-1516321318423-f1f12bb71535?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "UI/UX Design Sprint Workshop",
    description:
      "A practical design workshop covering wireframing, prototyping, and Figma workflows. Learn user research basics and ship a simple mobile screen by end of day.",
    location: "Cairo, Egypt — Design District Studio",
    category: "workshop",
    capacity: 30,
    price: 35,
    image:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Cairo Jazz Night Live",
    description:
      "An evening concert with live jazz bands by the Nile. Outdoor night atmosphere, food vendors, and seated zones. Perfect for music lovers looking for a fun night out in Cairo.",
    location: "Cairo, Egypt — Nile Garden Amphitheater",
    category: "concert",
    capacity: 500,
    price: 25,
    image:
      "https://images.unsplash.com/photo-1415201364779-b17592d43dae?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Summer Music Festival — Free Entry",
    description:
      "Free outdoor music festival with multiple stages, local bands, and DJ sets. Family-friendly afternoon and evening celebration. No ticket price—register early for limited free passes.",
    location: "Cairo, Egypt — New Cairo Festival Grounds",
    category: "concert",
    capacity: 2000,
    price: 0,
    image:
      "https://images.unsplash.com/photo-1459747759005-2eab5720a946?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Leadership & Business Growth Seminar",
    description:
      "Business seminar on leadership, team readiness, and executive communication. Includes roundtable discussion and case studies for professionals and entrepreneurs.",
    location: "Giza, Egypt — Business Tower Hall",
    category: "seminar",
    capacity: 120,
    price: 15,
    image:
      "https://images.unsplash.com/photo-1475721027840-f941538fccb1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Startup Networking Roundtable",
    description:
      "Free startup networking event for founders, investors, and mentors. Short pitches, open roundtable, and innovation-focused conversations. Great for first-time attendees exploring the ecosystem.",
    location: "Cairo, Egypt — Innovation Hub",
    category: "seminar",
    capacity: 80,
    price: 0,
    image:
      "https://images.unsplash.com/photo-1556761175-5973dc0e32e7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Community Football Cup Finals",
    description:
      "Local sports tournament finals with community teams, halftime show, and fan zone. Affordable tickets and lively match-day atmosphere in Cairo.",
    location: "Cairo, Egypt — Sports City Arena",
    category: "sports",
    capacity: 800,
    price: 10,
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Alexandria Digital Marketing Masterclass",
    description:
      "Advanced workshop on digital marketing, analytics, and growth campaigns. Held in Alexandria for marketers exploring performance and brand strategy.",
    location: "Alexandria, Egypt — Harbor View Center",
    category: "workshop",
    capacity: 60,
    price: 55,
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Cairo Food & Culture Festival",
    description:
      "Artisan dining stalls, live cooking demos, and cultural performances. A celebration of food, culture, and community in the heart of Cairo.",
    location: "Cairo, Egypt — Zamalek Waterfront Park",
    category: "other",
    capacity: 1500,
    price: 20,
    image:
      "https://cdn.pixabay.com/photo/2016/11/29/12/54/bar-1869656_1280.jpg",
  },
  {
    title: "Global AI & Cloud Conference 2027",
    description:
      "International conference on artificial intelligence, cloud infrastructure, and startup innovation. Keynotes, panels, and hands-on labs for engineering leaders.",
    location: "Cairo, Egypt — Egypt International Exhibition Center",
    category: "conference",
    capacity: 1200,
    price: 120,
    image:
      "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "Cybersecurity Essentials Workshop",
    description:
      "Workshop on secure coding, threat modeling, and incident response. Includes practical labs for developers and IT teams building safer applications.",
    location: "Cairo, Egypt — Cyber Park Labs",
    category: "workshop",
    capacity: 50,
    price: 65,
    image:
      "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "Rock Night Cairo — Live Bands",
    description:
      "High-energy rock concert with three local bands, light show, and late-night food trucks. Perfect for fans of live music and festival-style nights.",
    location: "Cairo, Egypt — Maadi Open-Air Stage",
    category: "concert",
    capacity: 900,
    price: 40,
    image:
      "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "Classical Strings Evening",
    description:
      "An intimate classical performance featuring string quartet repertoire. Elegant indoor venue with premium acoustics for music enthusiasts.",
    location: "Cairo, Egypt — Opera House Side Hall",
    category: "concert",
    capacity: 250,
    price: 55,
    image:
      "https://images.pexels.com/photos/109669/pexels-photo-109669.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "Executive Leadership Roundtable",
    description:
      "Executive seminar focused on leadership readiness, decision-making, and organizational growth. Interactive roundtable with industry mentors.",
    location: "Cairo, Egypt — Nile Business Club",
    category: "seminar",
    capacity: 45,
    price: 95,
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Cairo Marathon 2027",
    description:
      "City marathon with 5K, 10K, and full marathon categories. Community run event with hydration stations, medals, and family cheering zones.",
    location: "Cairo, Egypt — Downtown Start Line",
    category: "sports",
    capacity: 5000,
    price: 30,
    image:
      "https://images.unsplash.com/photo-1452626038306-9d5e1a069c54?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Beach Volleyball Cup — Alexandria",
    description:
      "Regional volleyball tournament on Alexandria’s coast. Tournament brackets, food court, and sunset matches for sports fans.",
    location: "Alexandria, Egypt — Stanley Beach Courts",
    category: "sports",
    capacity: 600,
    price: 18,
    image:
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Photography Masterclass — Street & Night",
    description:
      "Creative workshop on street and night photography techniques. Includes guided photowalk, editing tips, and portfolio review session.",
    location: "Cairo, Egypt — Khan El Khalili District",
    category: "workshop",
    capacity: 25,
    price: 50,
    image:
      "https://cdn.pixabay.com/photo/2014/09/05/18/34/camera-443990_1280.jpg",
  },
  {
    title: "Wellness & Mindfulness Retreat",
    description:
      "A calming day retreat with yoga sessions, mindfulness talks, and healthy dining. Ideal for attendees seeking balance away from busy schedules.",
    location: "Giza, Egypt — Palm Gardens Retreat",
    category: "other",
    capacity: 100,
    price: 75,
    image:
      "https://cdn.pixabay.com/photo/2017/08/06/12/52/people-2594684_1280.jpg",
  },
  {
    title: "Modern Art Exhibition Opening",
    description:
      "Opening night for a contemporary art exhibition with curator tours, live installations, and networking for collectors and creators.",
    location: "Cairo, Egypt — Contemporary Art Museum",
    category: "other",
    capacity: 200,
    price: 0,
    image:
      "https://cdn.pixabay.com/photo/2015/05/31/10/55/gallery-791552_1280.jpg",
  },
  {
    title: "Mediterranean Cooking Workshop",
    description:
      "Hands-on cooking workshop featuring Mediterranean recipes, chef demonstrations, and a shared tasting table. Perfect for food lovers and culture explorers.",
    location: "Alexandria, Egypt — Corniche Culinary Studio",
    category: "workshop",
    capacity: 35,
    price: 42,
    image:
      "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "Product Design & Innovation Summit",
    description:
      "Design and innovation summit with UX leaders, product case studies, and startup showcases. Connect with teams shipping user-centered products.",
    location: "Cairo, Egypt — Design Innovation Campus",
    category: "conference",
    capacity: 400,
    price: 79,
    image:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80",
  },
];

const seedEvents = async () => {
  try {
    const adminEmail = DEFAULT_ADMIN_EMAIL.toLowerCase().trim();
    console.log(`Seeding events for admin: ${adminEmail}`);

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const admin = await User.findOne({ email: adminEmail, role: "admin" });
    if (!admin) {
      console.error(
        `✗ Admin not found: ${adminEmail}. Create the account first (npm run seed:admin).`,
      );
      process.exit(1);
    }

    const now = new Date();
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() + 14);
    const rangeEnd = new Date(now);
    rangeEnd.setFullYear(rangeEnd.getFullYear() + 1);

    const seedTitles = SEED_EVENTS.map((e) => e.title);

    if (FORCE_RESEED) {
      const removed = await Event.deleteMany({
        title: { $in: seedTitles },
        createdBy: admin._id,
      });
      console.log(`Removed ${removed.deletedCount} existing seeded event(s) (--force).`);
    }

    let created = 0;
    let skipped = 0;

    for (let i = 0; i < SEED_EVENTS.length; i++) {
      const item = SEED_EVENTS[i];
      const exists = await Event.findOne({
        title: item.title,
        createdBy: admin._id,
      });

      if (exists) {
        skipped += 1;
        console.log(`  ⊘ Skipped (exists): ${item.title}`);
        continue;
      }

      const eventDate = dateAt(i, SEED_EVENTS.length, rangeStart, rangeEnd);
      eventDate.setHours(10 + (i % 8), (i % 4) * 15, 0, 0);

      const capacity = item.capacity;
      const doc = new Event({
        title: item.title,
        description: item.description,
        date: eventDate,
        location: item.location,
        category: item.category,
        capacity,
        availableSeats: seatsFromCapacity(capacity),
        price: item.price,
        status: "upcoming",
        image: item.image,
        imagePublicId: null,
        createdBy: admin._id,
      });

      await doc.save();
      created += 1;
      console.log(
        `  ✓ ${item.title} — ${eventDate.toISOString().slice(0, 10)} (${item.category}, $${item.price})`,
      );
    }

    console.log(`\nDone. Created: ${created}, skipped: ${skipped}, total seed set: ${SEED_EVENTS.length}`);
    console.log(`Date range: ${rangeStart.toISOString().slice(0, 10)} → ${rangeEnd.toISOString().slice(0, 10)}`);
    await mongoose.connection.close();
  } catch (error) {
    if (error?.message?.includes("querySrv ECONNREFUSED")) {
      console.error("✗ MongoDB SRV lookup failed. Check DNS/network and try again.");
    }
    console.error("✗ Error seeding events:", error.message);
    process.exit(1);
  }
};

seedEvents();
