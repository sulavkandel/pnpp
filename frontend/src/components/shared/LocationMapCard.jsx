function parseCoordinates(locationCoordinates, locationText) {
  if (locationCoordinates && typeof locationCoordinates === "object") {
    const latitude = Number(locationCoordinates.latitude ?? locationCoordinates.lat);
    const longitude = Number(locationCoordinates.longitude ?? locationCoordinates.lng ?? locationCoordinates.lon);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
  }

  const match = String(locationText || "").match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { latitude, longitude };
}

function buildMapUrls(locationText, wardNumber, locationCoordinates) {
  const coordinates = parseCoordinates(locationCoordinates, locationText);
  if (coordinates) {
    const delta = 0.008;
    const { latitude, longitude } = coordinates;
    return {
      coordinates,
      embedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - delta}%2C${latitude - delta}%2C${longitude + delta}%2C${latitude + delta}&layer=mapnik&marker=${latitude}%2C${longitude}`,
      openUrl: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`,
      label: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    };
  }

  const query = [locationText, wardNumber ? `Ward ${wardNumber}` : "", "Pokhara", "Nepal"]
    .filter(Boolean)
    .join(", ");

  return {
    coordinates: null,
    embedUrl: "",
    openUrl: query ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}` : "",
    label: locationText || query || "Pokhara, Nepal",
  };
}

export function LocationMapCard({
  title,
  locationText,
  locationCoordinates,
  wardNumber,
  language = "en",
  className = "",
}) {
  const mapState = buildMapUrls(locationText, wardNumber, locationCoordinates);
  const copy = language === "ne"
    ? {
        title: title || "स्थान नक्सा",
        subtitle: mapState.coordinates ? "GPS बिन्दु नक्सामा देखाइयो।" : "स्थान खोजी लिङ्कबाट नक्सा खोल्न सकिन्छ।",
        action: mapState.coordinates ? "नक्सा खोल्नुहोस्" : "नक्सामा खोज्नुहोस्",
        empty: "स्थान विवरण उपलब्ध छैन।",
      }
    : {
        title: title || "Location Map",
        subtitle: mapState.coordinates ? "The captured GPS point is shown below." : "Use the map search link for this location.",
        action: mapState.coordinates ? "Open Map" : "Search Map",
        empty: "No location details available.",
      };

  return (
    <article className={`location-map-card ${className}`.trim()}>
      <div className="location-map-head">
        <div>
          <p className="eyebrow small">{copy.title}</p>
          <h3>{mapState.label || copy.empty}</h3>
        </div>
        {mapState.openUrl ? (
          <a className="button secondary compact-button" href={mapState.openUrl} target="_blank" rel="noreferrer">
            {copy.action}
          </a>
        ) : null}
      </div>
      <p className="location-map-copy">{copy.subtitle}</p>
      {mapState.coordinates ? (
        <div className="location-map-frame-wrap">
          <iframe
            className="location-map-frame"
            src={mapState.embedUrl}
            title={copy.title}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <div className="location-map-placeholder">
          <strong>{mapState.label || copy.empty}</strong>
          <span>{copy.subtitle}</span>
        </div>
      )}
    </article>
  );
}
