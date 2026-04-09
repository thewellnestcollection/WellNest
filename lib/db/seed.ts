import { db, propertiesTable } from "./src/index";
import { sql } from "drizzle-orm";

const CATEGORIES = ["Farm", "Treehouse", "Cabin/Hut", "Cottage", "Pub with Rooms", "Boat", "Estate/Manor"];

type PropertySeed = {
  name: string;
  category: string;
  location: string;
  nightlyPrice: string;
  guests: number;
  facilities: string[];
  contactEmail: string;
  images: string[];
  featured: boolean;
  pickMonth: number;
  pickYear: number;
};

const aprilPicks: PropertySeed[] = [
  {
    name: "Harlow Hill Farm",
    category: "Farm",
    location: "Yorkshire Dales, North Yorkshire",
    nightlyPrice: "285",
    guests: 8,
    facilities: ["Log fire", "Hot tub", "Farmyard animals", "Kitchen garden", "BBQ", "Dog friendly"],
    contactEmail: "stays@harlowhill.co.uk",
    images: ["https://images.unsplash.com/photo-1573548842355-73bb50e50b94?w=1200&q=80"],
    featured: true,
    pickMonth: 4,
    pickYear: 2026,
  },
  {
    name: "The Canopy at Brocklehurst",
    category: "Treehouse",
    location: "Cotswolds, Gloucestershire",
    nightlyPrice: "320",
    guests: 2,
    facilities: ["King bed", "Private deck", "Outdoor bath", "Woodland views", "Breakfast hamper"],
    contactEmail: "hello@brocklehursttreehouse.co.uk",
    images: ["https://images.unsplash.com/photo-1444464666168-49d633b86797?w=1200&q=80"],
    featured: false,
    pickMonth: 4,
    pickYear: 2026,
  },
  {
    name: "Moorland Bothy",
    category: "Cabin/Hut",
    location: "Peak District, Derbyshire",
    nightlyPrice: "185",
    guests: 4,
    facilities: ["Wood burner", "Off-grid", "Stargazing deck", "Mountain views", "Outdoor kitchen"],
    contactEmail: "book@moorlandbothy.co.uk",
    images: ["https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200&q=80"],
    featured: false,
    pickMonth: 4,
    pickYear: 2026,
  },
  {
    name: "Wisteria Cottage",
    category: "Cottage",
    location: "Lake District, Cumbria",
    nightlyPrice: "245",
    guests: 6,
    facilities: ["Stone fireplace", "Garden", "Beamed ceilings", "Dog friendly", "Near lake access"],
    contactEmail: "info@wisteriacottage.co.uk",
    images: ["https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1200&q=80"],
    featured: false,
    pickMonth: 4,
    pickYear: 2026,
  },
  {
    name: "The Pheasant Arms & Rooms",
    category: "Pub with Rooms",
    location: "Ludlow, Shropshire",
    nightlyPrice: "195",
    guests: 2,
    facilities: ["Real ale bar", "Restaurant", "Award-winning kitchen", "Countryside walks", "Cosy rooms"],
    contactEmail: "rooms@pheasantarms.co.uk",
    images: ["https://images.unsplash.com/photo-1568096889942-6eedde686635?w=1200&q=80"],
    featured: false,
    pickMonth: 4,
    pickYear: 2026,
  },
  {
    name: "The Saltmarsh",
    category: "Boat",
    location: "Norfolk Broads, Norfolk",
    nightlyPrice: "270",
    guests: 4,
    facilities: ["Full galley kitchen", "Sun deck", "Kayaks included", "Heated cabin", "Wildlife spotting"],
    contactEmail: "bookings@saltmarshboat.co.uk",
    images: ["https://images.unsplash.com/photo-1520034475321-cbe63696469a?w=1200&q=80"],
    featured: false,
    pickMonth: 4,
    pickYear: 2026,
  },
  {
    name: "Ashdale Manor",
    category: "Estate/Manor",
    location: "Herefordshire",
    nightlyPrice: "650",
    guests: 16,
    facilities: ["Indoor pool", "Snooker room", "Tennis court", "Chef available", "Private grounds", "Cinema room"],
    contactEmail: "enquiries@ashdalemanor.co.uk",
    images: ["https://images.unsplash.com/photo-1464146072230-91cabc968266?w=1200&q=80"],
    featured: false,
    pickMonth: 4,
    pickYear: 2026,
  },
];

const marchPicks: PropertySeed[] = [
  {
    name: "Croft End Farm",
    category: "Farm",
    location: "Northumberland",
    nightlyPrice: "260",
    guests: 10,
    facilities: ["Hot tub", "Lambing season visits", "Orchard", "Log fire", "Dog friendly"],
    contactEmail: "stay@croftendfarm.co.uk",
    images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80"],
    featured: false,
    pickMonth: 3,
    pickYear: 2026,
  },
  {
    name: "The Nest at Greenoak",
    category: "Treehouse",
    location: "New Forest, Hampshire",
    nightlyPrice: "295",
    guests: 2,
    facilities: ["Double bed", "Rope bridge", "Forest bath", "Hammock terrace", "Welcome hamper"],
    contactEmail: "stay@greenoaktreehouse.co.uk",
    images: ["https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1200&q=80"],
    featured: false,
    pickMonth: 3,
    pickYear: 2026,
  },
  {
    name: "The Shepherds Rest",
    category: "Cabin/Hut",
    location: "Exmoor, Somerset",
    nightlyPrice: "165",
    guests: 2,
    facilities: ["Shepherd's hut", "Cast iron bath", "Views over moor", "Campfire pit", "Stargazing"],
    contactEmail: "book@shepherdsrest.co.uk",
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80"],
    featured: false,
    pickMonth: 3,
    pickYear: 2026,
  },
  {
    name: "Bluebell Cottage",
    category: "Cottage",
    location: "Chiltern Hills, Oxfordshire",
    nightlyPrice: "210",
    guests: 4,
    facilities: ["Thatched roof", "Inglenook fireplace", "Rose garden", "Village pub nearby"],
    contactEmail: "hello@bluebellcottage.co.uk",
    images: ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80"],
    featured: false,
    pickMonth: 3,
    pickYear: 2026,
  },
  {
    name: "The Woolpack Inn",
    category: "Pub with Rooms",
    location: "Edale, Derbyshire",
    nightlyPrice: "175",
    guests: 2,
    facilities: ["Real fire", "Hikers welcome", "Home-cooked meals", "Local ales", "Boot room"],
    contactEmail: "stay@woolpackinn.co.uk",
    images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80"],
    featured: false,
    pickMonth: 3,
    pickYear: 2026,
  },
  {
    name: "Harbour Light",
    category: "Boat",
    location: "Dartmouth, Devon",
    nightlyPrice: "250",
    guests: 3,
    facilities: ["Estuary moorings", "Dinghy included", "Fully fitted galley", "Private quay"],
    contactEmail: "book@harbourlight.co.uk",
    images: ["https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80"],
    featured: false,
    pickMonth: 3,
    pickYear: 2026,
  },
  {
    name: "Thornbury Hall",
    category: "Estate/Manor",
    location: "Gloucestershire",
    nightlyPrice: "580",
    guests: 14,
    facilities: ["Orangery", "Walled garden", "Library", "Billiard room", "Private chef on request"],
    contactEmail: "info@thornburyhall.co.uk",
    images: ["https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=1200&q=80"],
    featured: false,
    pickMonth: 3,
    pickYear: 2026,
  },
];

const februaryPicks: PropertySeed[] = [
  {
    name: "Millstone Farm",
    category: "Farm",
    location: "Scottish Borders",
    nightlyPrice: "240",
    guests: 8,
    facilities: ["Working farm", "Log burner", "Highland cattle", "Private loch access", "Dog friendly"],
    contactEmail: "bookings@millstonefarm.co.uk",
    images: ["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80"],
    featured: false,
    pickMonth: 2,
    pickYear: 2026,
  },
  {
    name: "Oakrise Treehouse",
    category: "Treehouse",
    location: "Brecon Beacons, Wales",
    nightlyPrice: "275",
    guests: 2,
    facilities: ["Suspended walkway", "Wood-fired hot tub", "Valley views", "Breakfast basket"],
    contactEmail: "hello@oakrisetreehouse.co.uk",
    images: ["https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1200&q=80"],
    featured: false,
    pickMonth: 2,
    pickYear: 2026,
  },
  {
    name: "The Pine Loft",
    category: "Cabin/Hut",
    location: "Cairngorms, Scotland",
    nightlyPrice: "220",
    guests: 4,
    facilities: ["Sauna", "Mountain views", "Ski storage", "Log fire", "Nordic hot tub"],
    contactEmail: "stay@pineloft.co.uk",
    images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80"],
    featured: false,
    pickMonth: 2,
    pickYear: 2026,
  },
  {
    name: "Larkspur Cottage",
    category: "Cottage",
    location: "Suffolk Coast",
    nightlyPrice: "225",
    guests: 4,
    facilities: ["Beach access", "Wood burner", "Coastal walks", "Dog friendly", "Courtyard garden"],
    contactEmail: "info@larkspurcottage.co.uk",
    images: ["https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?w=1200&q=80"],
    featured: false,
    pickMonth: 2,
    pickYear: 2026,
  },
  {
    name: "The Crown & Anchor",
    category: "Pub with Rooms",
    location: "Whitstable, Kent",
    nightlyPrice: "185",
    guests: 2,
    facilities: ["Seafront location", "Oyster bar", "Cosy snug", "Local beers", "Breakfast included"],
    contactEmail: "rooms@crownanchorwhitstable.co.uk",
    images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80"],
    featured: false,
    pickMonth: 2,
    pickYear: 2026,
  },
  {
    name: "The Wandering Keel",
    category: "Boat",
    location: "Thames Estuary, Essex",
    nightlyPrice: "235",
    guests: 4,
    facilities: ["Traditional narrowboat", "Woodburner", "Canal cruises", "Fishing rods", "Vintage interior"],
    contactEmail: "stay@wanderingkeel.co.uk",
    images: ["https://images.unsplash.com/photo-1523978591478-c753949ff840?w=1200&q=80"],
    featured: false,
    pickMonth: 2,
    pickYear: 2026,
  },
  {
    name: "Claverton Grange",
    category: "Estate/Manor",
    location: "Bath, Somerset",
    nightlyPrice: "720",
    guests: 18,
    facilities: ["Heated outdoor pool", "Croquet lawn", "Games room", "Event barn", "Cellar wine collection"],
    contactEmail: "enquiries@clavertongrange.co.uk",
    images: ["https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80"],
    featured: false,
    pickMonth: 2,
    pickYear: 2026,
  },
];

async function seed() {
  console.log("🌱 Clearing existing properties...");
  await db.execute(sql`TRUNCATE TABLE properties RESTART IDENTITY`);

  const allProperties = [...aprilPicks, ...marchPicks, ...februaryPicks];

  console.log(`🌱 Inserting ${allProperties.length} properties...`);
  await db.insert(propertiesTable).values(allProperties);

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
