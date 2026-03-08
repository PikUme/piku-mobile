export function formatFeedDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diff = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '방금 전';
  }

  if (diff < hour) {
    return `${Math.max(1, Math.floor(diff / minute))}분 전`;
  }

  if (diff < day) {
    return `${Math.max(1, Math.floor(diff / hour))}시간 전`;
  }

  return `${Math.max(1, Math.floor(diff / day))}일 전`;
}

export function getFeedPreviewText(content: string, maxLength = 30) {
  if (content.length <= maxLength) {
    return {
      text: content,
      truncated: false,
    };
  }

  return {
    text: `${content.slice(0, maxLength)}...`,
    truncated: true,
  };
}
