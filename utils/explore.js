// The query string of an Explore view (/explore), without empty values
export function exploreQuery({text, tab, categoryId}) {
  return {
    ...(text && {q: text}),
    ...(tab && tab !== 'all' && {tab}),
    ...(categoryId && {category: categoryId})
  };
}

// The same view as a link
export function exploreHref(basePath, view) {
  const query = new URLSearchParams(exploreQuery(view)).toString();
  return `${basePath}/explore${query ? `?${query}` : ''}`;
}
