/**
 * 15 Local SMB Companies across 6 Indian cities
 * Cities: Vijayawada, Guntur, Hyderabad, Visakhapatnam, Bengaluru, Chennai
 * SMB Types: Bakery, Clinic, Logistics, Coaching, Hardware, Boutique Hotel,
 *            IT Startup, Restaurant, Salon, Gym, School, Pharmacy, Electronics,
 *            Travel Agency, NGO
 */

export const companiesData = [
  {
    name: 'Durga Sweets & Artisan Bakery',
    slug: 'durga-sweets-bakery',
    description:
      'Premier traditional confectionery and handcrafted bakery in the heart of Vijayawada. Specializing in regional delicacies, fresh European-style sourdough breads, and custom festive celebration cakes crafted daily by skilled confectioners.',
    website: 'https://durgasweets.example.in',
    location: {
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      geo: {
        type: 'Point',
        coordinates: [80.648, 16.5062], // [lng, lat]
      },
    },
    recruiterRef: 'recruiter@rozgaar.example',
  },
  {
    name: 'Amaravati Family Health & Dental Clinic',
    slug: 'amaravati-health-clinic',
    description:
      'Multi-specialty primary outpatient clinic and modern dental healthcare centre in Vijayawada. Serving local families with preventative wellness checkups, digital diagnostics, pediatric dentistry, and round-the-clock urgent consultations.',
    website: 'https://amaravatihealth.example.in',
    location: {
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      geo: {
        type: 'Point',
        coordinates: [80.655, 16.512],
      },
    },
    recruiterRef: 'recruiter.amaravati@rozgaar.example',
  },
  {
    name: 'Teluguland Express Freight & Cargo',
    slug: 'teluguland-logistics',
    description:
      'Regional middle-mile logistics aggregator and cold-chain freight fleet operator headquartered in Krishna District. Delivering seamless warehouse inventory routing, express perishables transit, and dedicated B2B cargo line-haul services across South India.',
    website: 'https://telugulandexpress.example.in',
    location: {
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      geo: {
        type: 'Point',
        coordinates: [80.62, 16.52],
      },
    },
    recruiterRef: 'recruiter.teluguland@rozgaar.example',
  },
  {
    name: 'Krishna Pragati Academy & Coaching',
    slug: 'krishna-pragati-coaching',
    description:
      'Leading secondary entrance examination preparation coaching centre in Guntur. Providing rigorous conceptual foundation courses, state board test series, and personalized mentor classrooms for science, mathematics, and engineering aspirants.',
    website: 'https://krishnapragati.example.in',
    location: {
      city: 'Guntur',
      state: 'Andhra Pradesh',
      geo: {
        type: 'Point',
        coordinates: [80.4365, 16.3067],
      },
    },
    recruiterRef: 'recruiter.krishna@rozgaar.example',
  },
  {
    name: 'Andhra Spares & Industrial Hardware',
    slug: 'andhra-industrial-hardware',
    description:
      'Wholesale and retail distributor of industrial grade fasteners, power tools, safety valves, and electrical bearings in Guntur. Supplying local agricultural machinery workshops, manufacturing factories, and construction contractors with certified equipment.',
    website: 'https://andhrahardware.example.in',
    location: {
      city: 'Guntur',
      state: 'Andhra Pradesh',
      geo: {
        type: 'Point',
        coordinates: [80.442, 16.311],
      },
    },
    recruiterRef: 'recruiter.andhra@rozgaar.example',
  },
  {
    name: 'Deccan Grand Boutique Suites',
    slug: 'deccan-grand-boutique-hotel',
    description:
      'Four-star heritage boutique hospitality property located in Banjara Hills, Hyderabad. Featuring 45 bespoke luxury rooms, banquet conference facilities, rooftop fine dining, and personalized concierge experiences for business executives and tourists.',
    website: 'https://deccangrand.example.in',
    location: {
      city: 'Hyderabad',
      state: 'Telangana',
      geo: {
        type: 'Point',
        coordinates: [78.4867, 17.385],
      },
    },
    recruiterRef: 'recruiter.deccan@rozgaar.example',
  },
  {
    name: 'CyberBazaar Cloud Technologies',
    slug: 'cyberbazaar-technologies',
    description:
      'Fast-growing cloud software product company located in HITEC City, Hyderabad. Developing microservices-based inventory synchronization and omnichannel point-of-sale platforms tailored specifically for independent Indian retailers and distributors.',
    website: 'https://cyberbazaar.example.in',
    location: {
      city: 'Hyderabad',
      state: 'Telangana',
      geo: {
        type: 'Point',
        coordinates: [78.38, 17.445],
      },
    },
    recruiterRef: 'recruiter.cyberbazaar@rozgaar.example',
  },
  {
    name: 'Charminar Wholesale Spices & Foods',
    slug: 'charminar-spices-foods',
    description:
      'Historic wholesale food supplier and aromatic spices processing unit near Hyderabad Old City. Distributing premium GI-tagged chillies, turmeric blends, grains, and dry pantry essentials to hotel chains, supermarkets, and specialty caterers across the state.',
    website: 'https://charminarspices.example.in',
    location: {
      city: 'Hyderabad',
      state: 'Telangana',
      geo: {
        type: 'Point',
        coordinates: [78.474, 17.3616],
      },
    },
    recruiterRef: 'recruiter.charminar@rozgaar.example',
  },
  {
    name: 'Godavari Spice Kitchen & Banquets',
    slug: 'godavari-spice-kitchen',
    description:
      'Popular coastal Andhra dining destination and event banquet venue overlooking Beach Road in Visakhapatnam. Renowned for authentic seafood curries, tandoor delicacies, outdoor event catering, and attentive hospitality for weddings and corporate gatherings.',
    website: 'https://godavarispice.example.in',
    location: {
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      geo: {
        type: 'Point',
        coordinates: [83.2185, 17.6868],
      },
    },
    recruiterRef: 'recruiter.godavari@rozgaar.example',
  },
  {
    name: 'Coastal Waves Hair & Beauty Salon',
    slug: 'coastal-waves-salon',
    description:
      'Full-service premium unisex styling studio, botanical day spa, and bridal makeover parlour in Siripuram, Visakhapatnam. Providing hair design, rejuvenating ayurvedic skin treatments, therapeutic massages, and complete bridal party makeup.',
    website: 'https://coastalwaves.example.in',
    location: {
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      geo: {
        type: 'Point',
        coordinates: [83.31, 17.72],
      },
    },
    recruiterRef: 'recruiter.coastal@rozgaar.example',
  },
  {
    name: 'Bayview Iron & Fitness Hub',
    slug: 'bayview-fitness-hub',
    description:
      'Sprawling high-performance fitness center and functional CrossFit gymnasium in MVP Colony, Visakhapatnam. Equipped with Olympic lifting platforms, cardio zones, certified strength coaches, group HIIT sessions, and sports nutrition guidance.',
    website: 'https://bayviewfitness.example.in',
    location: {
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      geo: {
        type: 'Point',
        coordinates: [83.33, 17.73],
      },
    },
    recruiterRef: 'recruiter.bayview@rozgaar.example',
  },
  {
    name: 'Vidya Bharati Matriculation School',
    slug: 'vidya-bharati-school',
    description:
      'Co-educational secondary educational institution in Adyar, Chennai, fostering academic excellence and holistic character formation. Offering activity-based early childhood pedagogy, STEM laboratories, robotics clubs, and athletic sports development.',
    website: 'https://vidyabharati.example.in',
    location: {
      city: 'Chennai',
      state: 'Tamil Nadu',
      geo: {
        type: 'Point',
        coordinates: [80.2707, 13.0827],
      },
    },
    recruiterRef: 'recruiter.vidyabharati@rozgaar.example',
  },
  {
    name: 'Sanjeevani Community Meds & Pharmacy',
    slug: 'sanjeevani-community-pharmacy',
    description:
      'Neighborhood trusted retail pharmacy and surgical equipment dispensary in T. Nagar, Chennai. Maintaining round-the-clock prescription fulfillment, computerized drug interaction checks, senior home medicine delivery, and basic wellness diagnostic screenings.',
    website: 'https://sanjeevanipharma.example.in',
    location: {
      city: 'Chennai',
      state: 'Tamil Nadu',
      geo: {
        type: 'Point',
        coordinates: [80.25, 13.06],
      },
    },
    recruiterRef: 'recruiter.sanjeevani@rozgaar.example',
  },
  {
    name: 'Coromandel Digital & Appliance Store',
    slug: 'coromandel-digital-electronics',
    description:
      'Independent consumer electronics showroom and authorized authorized repair depot in Anna Nagar, Chennai. Showcasing smartphones, laptops, energy-efficient inverter air conditioners, home appliances, and certified on-site warranty repair services.',
    website: 'https://coromandeldigital.example.in',
    location: {
      city: 'Chennai',
      state: 'Tamil Nadu',
      geo: {
        type: 'Point',
        coordinates: [80.22, 13.04],
      },
    },
    recruiterRef: 'recruiter.coromandel@rozgaar.example',
  },
  {
    name: 'Mysore Gate Holiday & Travel Desk',
    slug: 'mysore-gate-travel-desk',
    description:
      'Customized outbound vacation planner and regional heritage tour curator in Koramangala, Bengaluru. Specializing in family hill-station itineraries, corporate offsite group retreats, international visa documentation assistance, and airport transit transfers.',
    website: 'https://mysoregatetravel.example.in',
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      geo: {
        type: 'Point',
        coordinates: [77.5946, 12.9716],
      },
    },
    recruiterRef: 'recruiter.mysoregate@rozgaar.example',
  },
  {
    name: 'Hasiru Earth Ecological Foundation',
    slug: 'hasiru-earth-foundation',
    description:
      'Non-profit environmental civil society organization in Indiranagar, Bengaluru. Championing urban watershed lake rejuvenation, community composting hubs, indigenous tree canopy afforestation, and youth sustainable climate literacy programs.',
    website: 'https://hasiruearth.example.in',
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      geo: {
        type: 'Point',
        coordinates: [77.62, 12.935],
      },
    },
    recruiterRef: 'recruiter.hasiru@rozgaar.example',
  },
];

