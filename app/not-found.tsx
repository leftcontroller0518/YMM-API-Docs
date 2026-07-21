import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className={"flex items-center justify-center min-h-dvh bg-red-950 text-red-100"}>
      <div className="flex flex-col items-start justify-center w-fit">
        <h1 className="text-4xl font-bold">404</h1>
        <h2 className="mt-2 text-xl">Page Not Found</h2>
        <p className="mt-4 text-center text-red-300">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="mt-8 bg-red-100 text-red-950 hover:bg-red-200 rounded-none">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  )
}

