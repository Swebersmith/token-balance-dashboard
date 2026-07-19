export default function ProviderCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div>
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
            <div className="h-3 w-12 bg-gray-100 dark:bg-gray-700 rounded" />
          </div>
        </div>
        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="mb-3">
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
        <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded" />
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="h-3 w-12 bg-gray-100 dark:bg-gray-700 rounded" />
        <div className="h-3 w-8 bg-gray-100 dark:bg-gray-700 rounded ml-auto" />
      </div>
    </div>
  )
}
