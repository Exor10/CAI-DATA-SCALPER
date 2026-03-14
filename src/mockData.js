const tags = ['Active', 'Queued', 'Review', 'Fresh'];
const sources = ['NewsPulse', 'FeedSpark', 'OpenTrends', 'ScoutWire'];

export function createMockResults(query) {
  const now = Date.now();
  const keyword = (query || 'general').trim();

  return Array.from({ length: 8 }).map((_, index) => {
    const tag = tags[index % tags.length];
    const source = sources[index % sources.length];
    const minutesAgo = index * 13 + 4;

    return {
      id: `${keyword}-${index}-${now}`,
      title: `${capitalize(keyword)} Insight ${index + 1}`,
      source,
      summary: `Snapshot for ${keyword} from ${source}. Quick notes for monitoring and follow-up.`,
      timestamp: new Date(now - minutesAgo * 60_000).toISOString(),
      tag,
    };
  });
}

function capitalize(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
