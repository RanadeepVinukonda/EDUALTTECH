import { cn } from "@/lib/cn";

export default function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-[20px] bg-white p-8 shadow-elev2", className)} {...props}>
      {children}
    </div>
  );
}
