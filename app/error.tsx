"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ErrorPage({
                                    error,
                                    reset,
                                  }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-dvh bg-red-950 text-red-100">
      <div className="flex flex-col items-start justify-center w-fit">
        <h1 className="text-4xl font-bold">500</h1>
        <h2 className="mt-2 text-xl">Internal Server Error</h2>

        <p className="mt-4 text-red-300">
          An unexpected server error has occurred.
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 w-full max-w-xl rounded border border-red-700 bg-red-900/50 p-4 font-mono text-sm">
            <div>{error.message}</div>
            {error.digest && (
              <div className="mt-2 text-red-400">
                Digest: {error.digest}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <Button
            onClick={reset}
            className="bg-red-100 text-red-950 hover:bg-red-200 rounded-none"
          >
            Try Again
          </Button>

          <Button
            asChild
            variant="outline"
            className="bg-red-100 text-red-950 hover:bg-red-200 rounded-none"
          >
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}