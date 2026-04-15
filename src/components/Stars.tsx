export const renderStars = (rating: number) => {
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<FullStar key={i} />);
    } else if (i === Math.ceil(rating) && rating % 1 >= 0.5) {
      stars.push(<HalfStar key={i} />);
    } else {
      stars.push(<EmptyStar key={i} />);
    }
  }
  return <div className="flex items-center gap-1">{stars}</div>;
};
const HalfStar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="text-gold-base">
    <defs>
      <linearGradient id="half-grad">
        <stop offset="50%" stopColor="currentColor" />
        <stop offset="50%" stopColor="transparent" />
      </linearGradient>
    </defs>
    <path
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
    />
    <path
      fill="url(#half-grad)"
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
    />
  </svg>
);
const FullStar = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    className="text-gold-base"
    fill="currentColor"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const EmptyStar = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    className="text-gray-300 dark:text-zinc-600"
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
    />
  </svg>
);
