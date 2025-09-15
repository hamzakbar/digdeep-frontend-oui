export const TableSkeleton = () => (
  <div className="space-y-2">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
      />
    ))}
  </div>
) 