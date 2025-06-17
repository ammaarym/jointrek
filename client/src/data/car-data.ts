// Comprehensive car make and model data
export const CAR_MAKES = [
  "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge",
  "Ford", "GMC", "Honda", "Hyundai", "Infiniti", "Jeep", "Kia", "Lexus", 
  "Lincoln", "Mazda", "Mercedes-Benz", "Mitsubishi", "Nissan", "Ram", "Subaru",
  "Tesla", "Toyota", "Volkswagen", "Volvo"
];

export const CAR_MODELS: Record<string, string[]> = {
  "Acura": ["ILX", "TLX", "RLX", "MDX", "RDX", "NSX"],
  "Audi": ["A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "e-tron", "R8"],
  "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4", "i3", "i4", "iX"],
  "Buick": ["Encore", "Encore GX", "Envision", "Enclave"],
  "Cadillac": ["CT4", "CT5", "XT4", "XT5", "XT6", "Escalade", "Lyriq"],
  "Chevrolet": ["Spark", "Sonic", "Cruze", "Malibu", "Impala", "Camaro", "Corvette", "Trax", "Equinox", "Blazer", "Traverse", "Tahoe", "Suburban", "Colorado", "Silverado", "Bolt EV", "Bolt EUV"],
  "Chrysler": ["300", "Pacifica"],
  "Dodge": ["Charger", "Challenger", "Durango", "Journey"],
  "Ford": ["Fiesta", "Focus", "Fusion", "Mustang", "EcoSport", "Escape", "Edge", "Explorer", "Expedition", "Ranger", "F-150", "F-250", "F-350", "Bronco", "Bronco Sport", "Maverick", "Lightning"],
  "GMC": ["Terrain", "Acadia", "Yukon", "Canyon", "Sierra", "Hummer EV"],
  "Honda": ["Fit", "Civic", "Accord", "Insight", "CR-V", "HR-V", "Passport", "Pilot", "Ridgeline"],
  "Hyundai": ["Accent", "Elantra", "Sonata", "Venue", "Kona", "Tucson", "Santa Fe", "Palisade", "Ioniq 5", "Genesis G90"],
  "Infiniti": ["Q50", "Q60", "QX50", "QX60", "QX80"],
  "Jeep": ["Compass", "Cherokee", "Grand Cherokee", "Wrangler", "Gladiator", "Renegade", "Grand Wagoneer"],
  "Kia": ["Rio", "Forte", "K5", "Stinger", "Soul", "Seltos", "Sportage", "Sorento", "Telluride", "EV6"],
  "Lexus": ["IS", "ES", "GS", "LS", "RC", "LC", "UX", "NX", "GX", "LX", "RX"],
  "Lincoln": ["Corsair", "Nautilus", "Aviator", "Navigator"],
  "Mazda": ["Mazda3", "Mazda6", "CX-3", "CX-30", "CX-5", "CX-9", "MX-5 Miata"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "S-Class", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "G-Class", "EQS", "EQE"],
  "Mitsubishi": ["Mirage", "Eclipse Cross", "Outlander", "Outlander Sport"],
  "Nissan": ["Versa", "Sentra", "Altima", "Maxima", "370Z", "GT-R", "Kicks", "Rogue", "Murano", "Pathfinder", "Armada", "Frontier", "Titan", "Leaf", "Ariya"],
  "Ram": ["1500", "2500", "3500", "ProMaster"],
  "Subaru": ["Impreza", "Legacy", "WRX", "BRZ", "Crosstrek", "Forester", "Outback", "Ascent"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck", "Roadster"],
  "Toyota": ["Yaris", "Corolla", "Camry", "Avalon", "Prius", "C-HR", "RAV4", "Venza", "Highlander", "4Runner", "Sequoia", "Land Cruiser", "Tacoma", "Tundra", "Sienna"],
  "Volkswagen": ["Jetta", "Passat", "Arteon", "Golf", "Atlas", "Tiguan", "ID.4"],
  "Volvo": ["S60", "S90", "V60", "V90", "XC40", "XC60", "XC90", "C40", "EX30"]
};

// Generate years from 2010 to current year + 1
export const CAR_YEARS = Array.from(
  { length: new Date().getFullYear() - 2009 }, 
  (_, i) => new Date().getFullYear() + 1 - i
);

// Seat capacity mapping for different car types
export const getMaxSeatsForModel = (make: string, model: string): number => {
  const largeSUVs = ["Tahoe", "Suburban", "Expedition", "Yukon", "Sequoia", "Armada", "QX80", "GLS", "Navigator", "Escalade", "Palisade", "Telluride", "Atlas", "XC90", "Pilot", "Pathfinder", "Highlander", "Acadia", "Traverse", "Enclave", "Grand Cherokee", "Durango", "Explorer"];
  const midSUVs = ["RAV4", "CR-V", "Escape", "Equinox", "Rogue", "Forester", "Outback", "CX-5", "Tucson", "Santa Fe", "Edge", "Murano", "RX", "GX", "Q5", "X3", "GLC", "XT5"];
  const trucks = ["F-150", "F-250", "F-350", "Silverado", "Sierra", "Ram 1500", "Ram 2500", "Ram 3500", "Tundra", "Tacoma", "Colorado", "Canyon", "Ranger", "Frontier", "Ridgeline", "Maverick"];
  const minivans = ["Sienna", "Pacifica", "Odyssey"];
  const coupes = ["Mustang", "Camaro", "Challenger", "Charger", "Corvette", "370Z", "GT-R", "BRZ", "MX-5 Miata"];

  if (largeSUVs.includes(model)) return 8;
  if (midSUVs.includes(model)) return 5;
  if (trucks.includes(model)) return 5;
  if (minivans.includes(model)) return 8;
  if (coupes.includes(model)) return 2;
  
  // Default sedan capacity
  return 4;
};

// Baggage capacity estimates based on vehicle type
export const getBaggageCapacity = (make: string, model: string): { checkIn: number; personal: number } => {
  const largeSUVs = ["Tahoe", "Suburban", "Expedition", "Yukon", "Sequoia", "Armada", "QX80", "GLS", "Navigator", "Escalade", "Palisade", "Telluride", "Atlas", "XC90"];
  const midSUVs = ["RAV4", "CR-V", "Escape", "Equinox", "Rogue", "Forester", "Outback", "CX-5", "Tucson", "Santa Fe", "Edge", "Murano", "RX", "GX", "Q5", "X3", "GLC", "XT5"];
  const trucks = ["F-150", "F-250", "F-350", "Silverado", "Sierra", "Ram 1500", "Ram 2500", "Ram 3500", "Tundra", "Tacoma", "Colorado", "Canyon", "Ranger", "Frontier", "Ridgeline", "Maverick"];
  const minivans = ["Sienna", "Pacifica", "Odyssey"];
  const compactCars = ["Corolla", "Civic", "Sentra", "Elantra", "Forte", "Impreza", "Jetta", "Focus", "Cruze"];

  if (largeSUVs.includes(model)) return { checkIn: 6, personal: 8 };
  if (midSUVs.includes(model)) return { checkIn: 4, personal: 5 };
  if (trucks.includes(model)) return { checkIn: 5, personal: 5 };
  if (minivans.includes(model)) return { checkIn: 5, personal: 8 };
  if (compactCars.includes(model)) return { checkIn: 2, personal: 3 };
  
  // Default sedan capacity
  return { checkIn: 3, personal: 4 };
};