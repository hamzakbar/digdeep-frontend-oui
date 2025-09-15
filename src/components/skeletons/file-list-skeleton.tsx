export const FileListSkeleton = () => (
  <div className="space-y-1">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
      />
    ))}
  </div>
) 