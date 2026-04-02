export async function searchBusinesses(city) {
  const query = `businesses in ${city}`;
  const url = `/api/google-places?endpoint=/maps/api/place/textsearch/json&query=${encodeURIComponent(query)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API: ${data.status} — ${data.error_message || 'Unknown error'}`);
  }

  const places = data.results || [];

  // Fetch details for each place to check for website and get extra info
  const detailed = await Promise.all(
    places.slice(0, 50).map((place) => getPlaceDetails(place.place_id))
  );

  // Filter to businesses without websites
  const noWebsite = detailed.filter((p) => p && !p.website);

  // Search for contact info (email, social, website) via Google Custom Search
  const contactResults = await Promise.all(
    noWebsite.map((place) =>
      searchContactInfo(place.name, place.formatted_address || city)
    )
  );

  return noWebsite.map((place, i) => {
    const contact = contactResults[i];
    return {
      place_id: place.place_id,
      name: place.name || 'Unknown Business',
      address: place.formatted_address || '',
      category: getCategoryFromTypes(place.types),
      rating: place.rating || 0,
      reviewCount: place.user_ratings_total || 0,
      photoCount: place.photos?.length || 0,
      photos: (place.photos || []).slice(0, 10).map((p) =>
        `/api/google-places?endpoint=/maps/api/place/photo&maxwidth=800&photo_reference=${p.photo_reference}`
      ),
      phone: place.formatted_phone_number || '',
      hours: place.opening_hours?.weekday_text || [],
      googleMapsUrl: place.url || '',
      types: place.types || [],
      socialLinks: contact.socialLinks,
      facebookUrl: contact.facebookUrl,
      instagramUrl: contact.instagramUrl,
      contactWebsite: contact.contactWebsite,
      hasBookingLink: false,
      email: contact.email,
      emailConfidence: contact.emailConfidence,
      status: 'pending',
      generatedUrl: '',
      themeData: null,
      generatedHtml: '',
      score: 0,
    };
  });
}

async function getPlaceDetails(placeId) {
  const fields = 'place_id,name,formatted_address,rating,user_ratings_total,photos,opening_hours,formatted_phone_number,website,types,url';
  const url = `/api/google-places?endpoint=/maps/api/place/details/json&place_id=${placeId}&fields=${fields}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status !== 'OK') return null;
    return data.result;
  } catch {
    return null;
  }
}

function defaultContactInfo() {
  return { email: '', emailConfidence: 'none', socialLinks: [], facebookUrl: '', instagramUrl: '', contactWebsite: '' };
}

async function searchContactInfo(businessName, location) {
  // Extract city from address for a cleaner query
  const city = location.split(',').slice(-2, -1)[0]?.trim() || location;
  const query = `"${businessName}" ${city}`;
  const url = `/api/brave-search?endpoint=/res/v1/web/search&q=${encodeURIComponent(query)}&count=10`;

  try {
    const response = await fetch(url);
    if (!response.ok) return defaultContactInfo();
    const data = await response.json();

    const items = data.web?.results || [];
    let email = '';
    let emailConfidence = 'none';
    let facebookUrl = '';
    let instagramUrl = '';
    let contactWebsite = '';
    const socialLinks = [];

    const directoryDomains = ['google.com', 'yelp.com', 'yellowpages.com', 'bbb.org', 'mapquest.com', 'tripadvisor.com'];

    for (const item of items) {
      const link = item.url || '';
      const snippet = item.description || '';

      // Facebook page
      if (!facebookUrl && link.includes('facebook.com') && !link.includes('/login')) {
        facebookUrl = link;
        socialLinks.push('facebook');
      }

      // Instagram profile
      if (!instagramUrl && link.includes('instagram.com') && !link.includes('/accounts/')) {
        instagramUrl = link;
        socialLinks.push('instagram');
      }

      // Email in snippet or title
      if (!email) {
        const emailMatch = (snippet + ' ' + (item.title || '')).match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
        if (emailMatch && !emailMatch[0].includes('example.com') && !emailMatch[0].includes('sentry.')) {
          email = emailMatch[0];
          emailConfidence = 'probable';
        }
      }

      // Website that isn't social media or a directory
      if (!contactWebsite) {
        const isDirectory = directoryDomains.some((d) => link.includes(d));
        const isSocial = link.includes('facebook.com') || link.includes('instagram.com') || link.includes('twitter.com') || link.includes('tiktok.com');
        if (!isDirectory && !isSocial) {
          contactWebsite = link;
        }
      }
    }

    return { email, emailConfidence, socialLinks, facebookUrl, instagramUrl, contactWebsite };
  } catch {
    return defaultContactInfo();
  }
}

function getCategoryFromTypes(types) {
  if (!types || types.length === 0) return 'Business';
  const typeMap = {
    restaurant: 'Restaurant',
    cafe: 'Cafe',
    bar: 'Bar',
    store: 'Store',
    gym: 'Gym',
    spa: 'Spa',
    salon: 'Salon',
    bakery: 'Bakery',
    church: 'Church',
    school: 'School',
    dentist: 'Dentist',
    doctor: 'Doctor',
    lawyer: 'Lawyer',
    plumber: 'Plumber',
    electrician: 'Electrician',
    florist: 'Florist',
    pharmacy: 'Pharmacy',
    veterinary_care: 'Veterinary',
    car_repair: 'Auto Repair',
    beauty_salon: 'Beauty Salon',
    hair_care: 'Hair Care',
  };
  for (const type of types) {
    if (typeMap[type]) return typeMap[type];
  }
  return types[0]?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Business';
}

export function getPhotoUrl(photoReference, maxWidth = 400) {
  return `/api/google-places?endpoint=/maps/api/place/photo&maxwidth=${maxWidth}&photo_reference=${photoReference}`;
}

export function calculateScore(business) {
  const reviewScore = Math.min(business.reviewCount / 200, 1);
  const photoScore = Math.min(business.photoCount / 20, 1);
  const contactCount = [business.facebookUrl, business.instagramUrl, business.contactWebsite, business.email].filter(Boolean).length;
  const contactScore = Math.min(contactCount / 3, 1);
  const bookingScore = business.hasBookingLink ? 1 : 0;

  const score = Math.round(
    reviewScore * 40 + photoScore * 30 + contactScore * 15 + bookingScore * 15
  );
  return score;
}

export function getScoreLabel(score) {
  if (score >= 80) return { label: 'Hot Lead', color: '#D32F2F', emoji: '🔥' };
  if (score >= 50) return { label: 'Good Lead', color: '#ED6C02', emoji: '⭐' };
  if (score >= 20) return { label: 'Possible Lead', color: '#2E7D32', emoji: '🌱' };
  return { label: 'Cold Lead', color: '#757575', emoji: '❄️' };
}
