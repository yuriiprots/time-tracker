import { Skeleton } from "@/components/ui/Skeleton";

export function EntryListSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          {/* Project Header Skeleton */}
          <div className="bg-gray-50 px-6 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3 w-1/2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>

          {/* Entries Skeleton */}
          <div className="divide-y divide-border">
            {[1, 2].map((j) => (
              <div key={j} className="px-4 md:px-6 py-3 md:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <Skeleton className="h-6 w-20" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
