export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-700/50 rounded-lg animate-pulse ${className}`} />
  );
}
